const { describe, it, before, after } = require('node:test')
const assert = require('node:assert')
const Rcon = require('../src/service/rcon')
const { join } = require('path')

require('dotenv').config({ path: join(__dirname, '.env') })
const host = process.env.RCON_HOST
const port = process.env.RCON_PORT
const pass = process.env.RCON_PASSWORD
let rcon = null

describe('integration', { skip: !(host && port && pass) }, () => {
	before(async () => {
		rcon = new Rcon(host, port, pass, '#2CBAA8')
		await rcon.initialize()
	})

	after(async () => await rcon.terminate())

	it('should get player info', async () => {
		const { current, max, names } = await rcon.getPlayers()

		assert.equal(max > 0, true)

		if (current > 0) {
			assert.notEqual(names, '')
		}

		console.log(`Currently online:${names}`)
	})

	it('should send message', async () => {
		let passed = false

		await rcon.send('testing', 'if message is visible in game')
			.then(() => { passed = true })
			.catch(error => { assert.fail(`Sending failed with ${error}`) })

		assert.equal(passed, true)
	})
})
