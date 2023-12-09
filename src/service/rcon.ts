import { Rcon as RconClient } from 'rcon-client'

export interface Players {
	current: number;
	names: string;
	max: number
}

export class Rcon {

	private readonly senderColor: string
	private readonly host: string
	private readonly port: number
	private readonly password: string
	private client: RconClient | null

	constructor(host: string, port: number, password: string, senderColor: string) {
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

	getPlayers() : Promise<Players> {
		if (!this.client) {
			return Promise.reject(new Error('Rcon is not initialized'))
		}

		return this.client.send('list').then(info => {
			const online = info.match(/There are (\d+) of a max of (\d+) players online:(.*)/)
			if (!online) {
				throw new Error(`Rcon /list output has unexpected format: ${info}`)
			}

			return {
				current: parseInt(online[1]),
				max: parseInt(online[2]),
				names: parseInt(online[1]) > 0 ? online[3] : '',
			}
		})
	}

	send(sender: string, message: string) {
		if (!this.client) {
			return Promise.reject(new Error('Rcon is not initialized'))
		}

		return this.client.send(`/tellraw @a [{"text": "<"}, {"text": "${sender}", "color":"${this.senderColor}"}, {"text": "> ${message}"}]`)
	}
}
