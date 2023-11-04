const { Rcon: RconClient } = require('rcon-client')

class Rcon {
	constructor(host, port, password, senderColor) {
		this.host = host
		this.port = port
		this.password = password
		this.senderColor = senderColor
		this.client = null
	}

	async initialize() {
		if (this.client) {
			return Promise.reject(new Error('Rcon is already initialized'))
		}

		return RconClient.connect({
			host: this.host, port: this.port, password: this.password,
		}).then(client => {
			this.client = client
			client.send('/say Chat-bot joined')
			console.log('RCON connected!')
			return client
		})
	}

	terminate() {
		if (!this.client) {
			return Promise.resolve()
		}
		return this.client.end().then(() => {
			console.log('RCON disconnected!')
		})
	}

	getPlayers() {
		return this.client.send('list').then(info => {
			const online = info.match(/There are (\d+) of a max of (\d+) players online:(.*)/)
			return {
				current: parseInt(online[1]),
				max: parseInt(online[2]),
				names: parseInt(online[1]) > 0 ? online[3] : '',
			}
		})
	}

	send(sender, message) {
		return this.client.send(`/tellraw @a [{"text": "<"}, {"text": "${sender}", "color":"${this.senderColor}"}, {"text": "> ${message}"}]`)
	}
}

module.exports = Rcon
