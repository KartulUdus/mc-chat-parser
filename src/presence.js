const { ActivityType } = require('discord.js')

class Presence {
	constructor(info, activityStart) {
		const online = info.match(/There are (\d+) of a max of (\d+) players online:(.*)/)
		const current = parseInt(online[1])
		const max = parseInt(online[2])

		this.afk = current < 1

		if (this.afk) {
			this.status = 'idle'
			this.activity = {
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
			}
		}
		else {
			this.status = 'online'
			this.activity = {
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
			}
		}
	}
}

module.exports = Presence
