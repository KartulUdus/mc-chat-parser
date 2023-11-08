import { after, before, describe, it } from 'node:test'
import * as assert from 'node:assert'
import { Rcon } from '../src/service/rcon.js'

import { timeout, host, port, pass } from './config.js'
let rcon: Rcon

describe('integration', { skip: !(host && port && pass), timeout: timeout }, () => {
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
