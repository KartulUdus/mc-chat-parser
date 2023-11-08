import { after, before, describe, it } from 'node:test'
import { EOL, tmpdir } from 'os'
import { join } from 'path'
import { URL } from 'url'
import { appendFile, mkdtemp, rmdir, unlink } from 'node:fs/promises'
import { PathLike } from 'fs'
import * as assert from 'node:assert'
import { LogReader } from '../src/service/logReader.js'

import { timeout } from './config.js'
let reader: LogReader

describe('on data', { timeout: timeout }, () => {
	before(() => {
		reader = new LogReader(
			join(new URL('.', import.meta.url).pathname, '..', 'README.md'),
			'\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
		)
	})

	it('should split data if multiple entries are found', async () => {
		const message =
			`will ignore this line${EOL}` +
			`2023-10-20 21:49:22 [Server thread/INFO]: will match${EOL}` +
			` and ignore this${EOL}` +
			`2023-10-21 21:49:22 [ will match again${EOL}` +
			` 2023-10-22 21:49:22 [Server thread/INFO]: but ignore this${EOL}`
		const actual: string[] = []

		reader.register('.', (logOutput) => {
			actual.push(logOutput)
		})

		reader.onData(message)

		assert.deepEqual(actual, [
			'2023-10-20 21:49:22 [Server thread/INFO]: will match',
			'2023-10-21 21:49:22 [ will match again',
		])
	})

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

		reader.onData(message)

		assert.strictEqual(2, calls)
	})
})

describe('on start follow file', { timeout: timeout }, () => {
	let tempPath: PathLike
	let tempFile: PathLike

	before(async () => {
		tempPath = await mkdtemp(join(tmpdir(), 'temp-'))
		tempFile = join(tempPath, 'temp.log')

		reader = new LogReader(
			tempFile,
			'\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
		)
	})

	after(async () => {
		await reader.terminate()
		await unlink(tempFile)
		await rmdir(tempPath)
	})

	it('Should pass new entries to callback when written to file', async () => {
		const actual: string[] = []

		await appendFile(tempFile, `2023-10-20 21:49:22 [Server thread/INFO]: this is too soon${EOL}`)

		await reader.initialize()
		reader.register('.', (logOutput) => {
			actual.push(logOutput)
		})

		await appendFile(tempFile, `2023-10-20 21:49:22 [Server thread/INFO]: will match${EOL}`)
		await appendFile(tempFile, `2023-10-21 21:49:22 [ will match again${EOL}`)

		setTimeout(() => {
			assert.deepEqual(actual, [
				'2023-10-20 21:49:22 [Server thread/INFO]: will match',
				'2023-10-21 21:49:22 [ will match again',
			])
		}, 2000)
	})
})
