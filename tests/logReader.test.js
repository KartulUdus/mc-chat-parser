const { describe, it, before } = require('node:test')
const assert = require('node:assert')
const { reader } = require('../src/logReader.js')
const { EOL } = require('os');

describe('on data', () => {
	before(() => {
		reader.pattern = new RegExp(`^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2} (.+)$`, 'gm');
	})

	it('should split data if multiple entries are found', async () => {
		const message =
			`will ignore this line${EOL}` +
			`2023-10-20 21:49:22 [Server thread/INFO]: will match${EOL}` +
			` and ignore this${EOL}` +
			`2023-10-21 21:49:22 [ will match again${EOL}` +
			` 2023-10-22 21:49:22 [Server thread/INFO]: but ignore this${EOL}`
		let actual = []

		reader.register('.', (logOutput) => {
			actual.push(logOutput)
		})

		await reader.onData(message)

		assert.deepEqual(actual, [
			`2023-10-20 21:49:22 [Server thread/INFO]: will match`,
			`2023-10-21 21:49:22 [ will match again`
		])
	});

	it('should pass entry to all matching callbacks', async () => {
		const message = '2023-10-20 21:49:22 [Server thread/INFO]: <Socrates2100> test content'
		let calls = 0

		reader.register('\\[Server thread\\/INFO]: <', (logOutput) => {
			assert.strictEqual(logOutput, message)
			calls++
		})

		reader.register('<Socrates2100>', async (logOutput) => {
			assert.strictEqual(logOutput, message)
			calls++
		})

		reader.register('Socrates0000', async () => {
			assert.fail('Should not be called')
		})

		await reader.onData(message)

		assert.strictEqual(2, calls)
	});
});
