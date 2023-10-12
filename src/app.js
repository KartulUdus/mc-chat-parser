require('dotenv').config()
const { Client, Events, Partials, GatewayIntentBits } = require('discord.js')
const TailFile = require('@logdna/tail-file')
const Rcon = require('rcon-client')

let parseDocker = false
const senderColor = process.env.SENDER_COLOR || '#2CBAA8'

const client = new Client({ 	
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

const readDockerLogs = () => {
	new TailFile('/latest.log', {encoding: 'utf8'}).on('data', (logOutput) => {
		console.log('log entry:', logOutput)
		if(logOutput.match(/\[Server thread\/INFO]: </) && parseDocker) {
			const message = logOutput.substring(logOutput.indexOf('>') + 1)
			const user = logOutput.match(/<\w+>/)[0].replace(/[<>]/g, '')
			const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID)
			channel.send({
				embeds: [{
					description: message,
					author: {
						name: user,
						icon_url: `https://minotar.net/helm/${user}/150.png`
					}
				}]
			})
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
		host: process.env.RCON_HOST, port: process.env.RCON_PORT, password: process.env.RCON_PASSWORD
	}).then((rcon) => {
		console.log('RCON connected!')
		rcon.send(`/say Chat-bot joined`)
		return rcon
    })

	client.on(Events.MessageCreate, message => {
		if(message.channelId === process.env.DISCORD_CHANNEL_ID && !message.author.bot){
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
