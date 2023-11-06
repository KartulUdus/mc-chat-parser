const { ActivityType } = require('discord.js')

class Presence {
	constructor({ current, max, names }, activityStart) {
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
				name: current < 2 ? names : `${current} players`,
				details: names,
				type: ActivityType.Watching,
				state: `Watching ${names}`,
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
