const TailFile = require('@logdna/tail-file')

class LogReader {
	constructor(logFile, timestampPattern) {
		this.logFile = logFile
		this.callbacks = {}
		this.timestampPattern = timestampPattern
		this.pattern = new RegExp(`^${timestampPattern} (.+)$`, 'gm')
		this.initialized = false

		this.tailFile = new TailFile(this.logFile, { encoding: 'utf8' })
			.on('data', (logOutput) => this.onData(logOutput))
			.on('tail_error', (error) => {
				console.error('TailFile had an error!', error)
			})
			.on('error', (error) => {
				console.error('A TailFile stream error was likely encountered', error)
				throw error
			})
	}

	initialize() {
		if (this.initialized) {
			return Promise.reject(new Error('Log reader is already initialized'))
		}

		return this.tailFile.start()
			.then(() => {
				console.log(`Found the log file ${this.logFile}, looking for entries starting with: ${this.timestampPattern}`)
				this.initialized = true
			})
			.catch((error) => {
				console.error(`Cannot start. Does the file ${this.logFile} exist?`, error)
				throw error
			})
	}

	terminate() {
		if (!this.initialized) {
			return Promise.resolve()
		}
		return this.tailFile.quit()
	}

	onData(logOutput) {
		console.debug('Log entry:', logOutput)
		const logEntries = logOutput.match(this.pattern)
		if (!logEntries) {
			return
		}

		for (const [pattern, callback] of Object.entries(this.callbacks)) {
			logEntries.forEach(entry => {
				if (entry.match(pattern)) {
					callback(entry)
				}
			})
		}
	}

	register(pattern, callback) {
		this.callbacks[pattern] = callback
	}
}

module.exports = LogReader
