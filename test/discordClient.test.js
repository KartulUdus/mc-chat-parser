const { describe, it, before, after } = require('node:test')
const assert = require('node:assert')
const { join } = require('path')
const DiscordClient = require('../src/service/discordClient')
const Presence = require('../src/presence')

require('dotenv').config({ path: join(__dirname, '.env') })
const token = process.env.DISCORD_TOKEN
const channelId = process.env.DISCORD_CHANNEL_ID
const webhookName = process.env.WEBHOOK_NAME || 'mc-chat-parser'
let discord = null

describe('integration', { skip: !(token && channelId && webhookName), timeout: 30000 }, () => {
	before(async () => {
		discord = new DiscordClient(token, channelId, webhookName)
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
