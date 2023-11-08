import { ActivityType, PresenceStatusData } from 'discord.js'
import { Players } from './service/rcon.js'

export class Presence {

	public afk: boolean
	public status: PresenceStatusData
	public activity: {
		name: string;
		details: string | null;
		state: string;
		type: ActivityType;
		party: { size: number[] };
		timestamp: { start: number; end: number }
	}

	constructor(players: Players, activityStart: number) {
		this.afk = players.current < 1

		if (this.afk) {
			this.status = 'idle'
			this.activity = {
				name: 'Minecraft',
				details: null,
				type: ActivityType.Custom,
				state: 'Waiting for players',
				timestamp: {
					start: activityStart,
					end: Date.now() + 11000,
				},
				party: {
					size: [players.current, players.max],
				},
			}
		}
		else {
			this.status = 'online'
			this.activity = {
				name: players.current < 2 ? players.names : `${players.current} players`,
				details: players.names,
				type: ActivityType.Watching,
				state: `Watching ${players.names}`,
				timestamp: {
					start: activityStart,
					end: Date.now() + 11000,
				},
				party: {
					size: [players.current, players.max],
				},
			}
		}
	}
}
