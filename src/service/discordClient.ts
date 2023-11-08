import {
	Client, Events, Partials, GatewayIntentBits,
	NewsChannel, StageChannel, TextChannel, VoiceChannel, ForumChannel, Message,
} from 'discord.js'
import axios from 'axios'
import { Presence } from '../presence.js'

type SupportsWebhooks = NewsChannel | StageChannel | TextChannel | VoiceChannel | ForumChannel;

interface MessageCallback {
	(entry: Message): void;
}

function getChannel(client: Client, channelId: string): SupportsWebhooks | null {
	const channel = client.channels.cache.get(channelId)

	const supportsWebhooks = channel instanceof NewsChannel ||
		channel instanceof StageChannel ||
		channel instanceof TextChannel ||
		channel instanceof VoiceChannel ||
		channel instanceof ForumChannel

	return supportsWebhooks ? channel : null
}

export class DiscordClient {

	private readonly loginTimeout: number = 30000
	private readonly channelId: string
	private readonly webhookName: string
	private readonly token: string
	private webhookLink: string = ''
	private client: Client

	constructor(token: string, channelId: string, webhookName: string) {
		this.token = token
		this.channelId = channelId
		this.webhookName = webhookName

		this.client = new Client({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
			partials: [Partials.Message, Partials.Channel, Partials.Reaction],
		})
	}

	initialize() {
		if (this.webhookLink) {
			return Promise.reject(new Error('Discord client is already initialized'))
		}

		const loginPromise = this.client.login(this.token).then(() => {
			if (!this.client.user) {
				throw new Error('Unable to find bot user')
			}
			this.client.user.setStatus('idle')
			this.client.user.setAFK(true)
		}).then(() => {
			return new Promise((resolve, reject) => {
				this.client.once(Events.ClientReady, async client => {
					try {
						const channel = getChannel(client, this.channelId)
						if (!channel) {
							return reject(new Error(`Channel ${this.channelId} does not support webhooks`))
						}

						const hooks = await channel.fetchWebhooks()
						this.webhookLink = hooks.find(hook => hook.name === this.webhookName)?.url || ''

						if (!this.webhookLink) {
							const hook = await channel.createWebhook({ name: this.webhookName })
							this.webhookLink = hook.url
						}

						console.log(`Ready! Logged in as ${client.user.tag}`)
						return resolve('ready')
					}
					catch (error) {
						return reject(error)
					}
				})
			})
		})

		const timeoutPromise = new Promise((resolve, reject) => {
			setTimeout(() => reject(new Error('Login timed out')), this.loginTimeout)
		})

		return Promise.race([loginPromise, timeoutPromise])
	}

	terminate() {
		if (!this.webhookLink || !this.client.user) {
			return Promise.resolve()
		}
		this.client.user.setStatus('dnd')
		console.log(`${this.client.user.tag} logged out`)
		return this.client.destroy()
	}

	setPresence(presence: Presence) {
		if (!this.client.user) {
			throw new Error('Unable to find bot user')
		}
		this.client.user.setAFK(presence.afk)
		this.client.user.setStatus(presence.status)
		return this.client.user.setActivity(presence.activity)
	}

	onMessage(callback: MessageCallback) {
		this.client.on(Events.MessageCreate, message => {
			if (message.channelId === this.channelId && !message.author.bot && !message.webhookId) {
				callback(message)
			}
		})
	}

	send(username: string, content: string) {
		if (!this.webhookLink) {
			return Promise.reject(new Error('Webhook is not set'))
		}
		return axios.post(this.webhookLink, {
			content: content,
			username: username,
			avatar_url: `https://minotar.net/helm/${username}/150.png`,
		}).then(response => response.status)
	}
}
