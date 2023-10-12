require('dotenv').config()
const Docker = require('dockerode')
const docker = new Docker()
const container = docker.getContainer(process.env.DOCKER_CONTAINER_NAME)
const { Client, Events, Partials, GatewayIntentBits } = require('discord.js')

const client = new Client({ 	
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})
let parseDocker = false

const readDockerLogs = () => {
  container.logs({ follow: true, stdout: true, stderr: true }, (err, stream) => {
    stream.on('data', (chunk) => {
      const logOutput = chunk.toString('utf8')
			if(logOutput.match(/\[Server thread\/INFO]: </) && parseDocker) {
				console.log('matched', logOutput)
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
  })
}

 const main = () => {
	readDockerLogs(client)
	client.once(Events.ClientReady, c => {
		console.log(`Ready! Logged in as ${c.user.tag}`)
		parseDocker = true
	})
	client.login(process.env.DISCORD_TOKEN)

	client.on(Events.MessageCreate, message => {
		if(message.channelId === process.env.DISCORD_CHANNEL_ID && !message.author.bot){
			const sender = message.author.globalName
			const content = message.content.replace(/\\/g, '').replace(/"/g, '\\"').replace(/(\r\n|\n|\r)/gm, ' ')
			container.exec({Cmd: [`rcon-cli`, `/tellraw @a [{"text": "<${sender}> ${content}"}]`]}, (err, exec) => {
				exec.start()
			})
		}
	})
}
main()
