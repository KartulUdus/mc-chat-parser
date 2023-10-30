require('dotenv').config()

const { Client, Events, Partials, GatewayIntentBits } = require('discord.js')
const Rcon = require('rcon-client')
const Presence = require('./presence')
const { webhook } = require('./discordWebhook.js')
const { reader } = require('./logReader.js')

const webhookName = process.env.WEBHOOK_NAME || 'mc-chat-parser'
const senderColor = process.env.SENDER_COLOR || '#2CBAA8'
const logFile = process.env.LOG_FILE || '/logs/latest.log'
const timestampPattern = process.env.TIMESTAMP_PATTERN || '\\d{2}:\\d{2}:\\d{2}'

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

reader.register('\\[Server thread\\/INFO]: <', async (logOutput) => {
	const message = logOutput.substring(logOutput.indexOf('>') + 1)
	const user = logOutput.match(/<\w+>/)[0].replace(/[<>]/g, '')
	await webhook.send(client, message, user, process.env.DISCORD_CHANNEL_ID)
})

const main = async () => {
	reader.start(logFile, timestampPattern)

	client.once(Events.ClientReady, c => {
		console.log(`Ready! Logged in as ${c.user.tag}`)
		webhook.name = webhookName
		webhook.enabled = true
	})
	await client.login(process.env.DISCORD_TOKEN)

	const rcon = await Rcon.Rcon.connect({
		host: process.env.RCON_HOST, port: process.env.RCON_PORT, password: process.env.RCON_PASSWORD,
	}).then((rc) => {
		rc.send('/say Chat-bot joined')
		const activityStart = Date.now()

		setInterval(async () => {
			const info = await rcon.send('list')
			const presence = new Presence(info, activityStart)

			client.user.setAFK(presence.afk)
			client.user.setStatus(presence.status)
			client.user.setActivity(presence.activity)
		}, 10000)

		client.user.setStatus('idle')
		client.user.setAFK(true)

		console.log('RCON connected!')
		return rc
	})

	client.on(Events.MessageCreate, message => {
		if (message.channelId === process.env.DISCORD_CHANNEL_ID && !message.author.bot && !message.webhookId) {
			const sender = message.author.globalName
			const content = message.content.replace(/\\/g, '').replace(/"/g, '\\"').replace(/(\r\n|\n|\r)/gm, ' ')
			rcon.send(`/tellraw @a [{"text": "<"}, {"text": "${sender}", "color":"${senderColor}"}, {"text": "> ${content}"}]`)
		}
	})
}

main().then(() => {
	console.log('Main ready!')
}).catch(error => {
	console.error('Shutdown with an error', error)
	process.exit(1)
})
