import { after, before, describe, it } from 'node:test'
import * as assert from 'node:assert'
import { DiscordClient } from '../src/service/discordClient.js'
import { Presence } from '../src/presence.js'

import { timeout, token, channelId, webhookName } from './config.js'
let discord: DiscordClient

describe('integration', { skip: !(token && channelId && webhookName), timeout: timeout }, () => {
	before(async () => {
		discord = new DiscordClient(token, channelId, webhookName, 60000)
		await discord.initialize().catch(error => {
			console.error(error)
			assert.fail('Failed to initialize discord')
		})
	})

	after(async () => await discord.terminate())

	it('should set presence', async () => {
		const presence = new Presence({ current: 2, max: 5, names: 'test1, test2' }, Date.now())
		const clientPresence = discord.setPresence(presence)

		assert.equal(clientPresence.status, 'online')
		assert.equal(clientPresence.activities[0].state, 'Watching test1, test2')
	})

	it('should send message', async () => {
		const status = await discord.send('Socrates2100', 'test message')

		assert.equal(status, 204)
	})
})
