const Presence = require('./presence')
const LogReader = require('./service/logReader')
const DiscordClient = require('./service/discordClient')
const Rcon = require('./service/rcon')

const {
	logFile, timestampPattern,
	rconHost, rconPort, rconPassword, senderColor,
	discordToken, channelId, webhookName,
} = require('./config')

const reader = new LogReader(logFile, timestampPattern)
const rcon = new Rcon(rconHost, rconPort, rconPassword, senderColor)
const discord = new DiscordClient(discordToken, channelId, webhookName)

const services = [reader, rcon, discord]

const main = async () => {
	for (const service of services) {
		console.debug(`Initializing ${service.constructor.name}`)
		await service.initialize()
	}

	const ready = Date.now()

	setInterval(async () => {
		const players = await rcon.getPlayers()
		const presence = new Presence(players, ready)
		discord.setPresence(presence)
	}, 10000)

	reader.register('\\[Server thread\\/INFO]: <', logOutput => {
		const sender = logOutput.match(/<\w+>/)[0].replace(/[<>]/g, '')
		const content = logOutput.substring(logOutput.indexOf('>') + 1)
		discord.send(sender, content)
	})

	discord.onMessage(message => {
		const sender = message.author.globalName
		const content = message.content.replace(/\\/g, '').replace(/"/g, '\\"').replace(/(\r\n|\n|\r)/gm, ' ')
		rcon.send(sender, content)
	})
}

process.on('uncaughtException', async (error) => {
	console.error('Uncaught Exception:', error)

	for (const service of services) {
		console.debug(`Terminating ${service.constructor.name}`)
		await service.terminate().catch(e => {
			console.error(`Failed to terminate ${service.constructor.name}`, e)
		})
	}

	process.exit(1)
})

main().then(() => console.log('Bot started'))
