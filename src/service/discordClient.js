const { Client, Events, Partials, GatewayIntentBits } = require('discord.js')
const axios = require('axios')

class DiscordClient {
	constructor(token, channelId, webhookName) {
		this.token = token
		this.channelId = channelId
		this.webhookName = webhookName
		this.webhookLink = null
		this.loginTimeout = 10000

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
			this.client.user.setStatus('idle')
			this.client.user.setAFK(true)
		}).then(() => {
			return new Promise((resolve, reject) => {
				this.client.once(Events.ClientReady, async client => {
					try {
						const channel = client.channels.cache.get(this.channelId)
						const hooks = await channel.fetchWebhooks()

						hooks.forEach((hook) => {
							if (hook.name === this.webhookName) {
								this.webhookLink = hook.url
							}
						})

						if (!this.webhookLink) {
							const hook = await channel.createWebhook({ name: this.webhookName })
							this.webhookLink = hook.url
						}

						console.log(`Ready! Logged in as ${client.user.tag}`)
						resolve('ready')
					}
					catch (error) {
						reject(error)
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
		if (!this.webhookLink) {
			return Promise.resolve()
		}
		this.client.user.setStatus('dnd')
		console.log(`${this.client.user.tag} logged out`)
		return this.client.destroy()
	}

	setPresence(presence) {
		this.client.user.setAFK(presence.afk)
		this.client.user.setStatus(presence.status)
		return this.client.user.setActivity(presence.activity)
	}

	onMessage(callback) {
		this.client.on(Events.MessageCreate, message => {
			if (message.channelId === this.channelId && !message.author.bot && !message.webhookId) {
				callback(message)
			}
		})
	}

	send(username, content) {
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

module.exports = DiscordClient
