require('dotenv').config()
const { Client, Events, Partials, GatewayIntentBits, ActivityType } = require('discord.js')
const TailFile = require('@logdna/tail-file')
const Rcon = require('rcon-client')
const { webhookHandler } = require('./webhookSend.js')

let parseDocker = false
const senderColor = process.env.SENDER_COLOR || '#2CBAA8'
const logFile = process.env.LOG_FILE || 'latest.log'

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

const readDockerLogs = () => {
	new TailFile(`/logs/${logFile}`, { encoding: 'utf8' }).on('data', async (logOutput) => {
		console.log('log entry:', logOutput)
		if (logOutput.match(/\[Server thread\/INFO]: </) && parseDocker) {
			const message = logOutput.substring(logOutput.indexOf('>') + 1)
			const user = logOutput.match(/<\w+>/)[0].replace(/[<>]/g, '')
			await webhookHandler(client, message, user, process.env.DISCORD_CHANNEL_ID)
		}
	})
	.on('tail_error', (err) => {
		console.error('TailFile had an error!', err)
	})
	.on('error', (err) => {
		console.error('A TailFile stream error was likely encountered', err)
	})
	.start()
	.then(() => {
		console.log('Found the log file')
	})
	.catch((err) => {
		console.error('Cannot start. Does the file exist?', err)
	})
}

const main = async () => {
	readDockerLogs(client)
	client.once(Events.ClientReady, c => {
		console.log(`Ready! Logged in as ${c.user.tag}`)
		parseDocker = true
	})
	await client.login(process.env.DISCORD_TOKEN)

	const rcon = await Rcon.Rcon.connect({
		host: process.env.RCON_HOST, port: process.env.RCON_PORT, password: process.env.RCON_PASSWORD,
	}).then((rc) => {
		rc.send('/say Chat-bot joined')
		const activityStart = Date.now()

		setInterval(async () => {
			const info = await rcon.send('list')
			const online = info.match(/There are (\d+) of a max of (\d+) players online:(.*)/)
			const current = parseInt(online[1])
			const max = parseInt(online[2])
			const afk = current < 1
			client.user.setAFK(afk)

			if (afk) {
				client.user.setStatus('idle')
				client.user.setActivity({
					name: 'Minecraft',
					type: ActivityType.Custom,
					state: 'Waiting for players',
					timestamp: {
						start: activityStart,
						end: Date.now() + 11000,
					},
					party: {
						size: [current, max],
					},
				})
			}
			else {
				client.user.setStatus('online')
				client.user.setActivity({
					name: current < 2 ? online[3] : `${current} players`,
					details: `${online[3]}`,
					type: ActivityType.Watching,
					state: `Watching ${online[3]}`,
					timestamp: {
						start: activityStart,
						end: Date.now() + 11000,
					},
					party: {
						size: [current, max],
					},
				})
			}
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
