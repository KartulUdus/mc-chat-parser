import { Presence } from './presence.js'
import { LogReader } from './service/logReader.js'
import { DiscordClient } from './service/discordClient.js'
import { Rcon } from './service/rcon.js'

import {
	logFile, timestampPattern,
	rconHost, rconPort, rconPassword, senderColor,
	discordToken, channelId, webhookName, loginTimeout,
} from './config.js'

const reader = new LogReader(logFile, timestampPattern)
const rcon = new Rcon(rconHost, rconPort, rconPassword, senderColor)
const discord = new DiscordClient(discordToken, channelId, webhookName, loginTimeout)

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
		const matches = logOutput.match(/<\w+>/)
		if (!matches) {
			return
		}
		const sender = matches[0].replace(/[<>]/g, '')
		const content = logOutput.substring(logOutput.indexOf('>') + 1)
		discord.send(sender, content)
	})

	discord.onMessage(message => {
		const sender = message.author.displayName
		const content = message.content
			.replace(/\\/g, '')
			.replace(/"/g, '\\"')
			.replace(/(\r\n|\n|\r)/gm, ' ')

		rcon.send(sender, content)
	})
}

const terminateServices = async () => {
	for (const service of services) {
		console.debug(`Terminating ${service.constructor.name}`)
		await service.terminate().catch(e => {
			console.error(`Failed to terminate ${service.constructor.name}`, e)
		})
	}
}

process.on('SIGTERM', async () => {
	console.log('Received SIGTERM signal. Gracefully shutting down...')
	await terminateServices()
	process.exit(0)
})

process.on('SIGINT', async () => {
	console.log('Received SIGINT signal. Gracefully shutting down...')
	await terminateServices()
	process.exit(0)
})

process.on('uncaughtException', async (error) => {
	console.error('Uncaught Exception. Exiting...', error)
	await terminateServices()
	process.exit(1)
})

main().then(() => console.log('Bot started'))
