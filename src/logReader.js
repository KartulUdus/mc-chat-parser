const TailFile = require('@logdna/tail-file')

const callbacks = {}

const reader = {
    pattern: undefined,
    register: (pattern, callback) => {
        callbacks[pattern] = callback
    },
    onData: async (logOutput) => {
        console.debug('Log entry:', logOutput)
        const logEntries = logOutput.match(reader.pattern)
        if (!logEntries) {
            return
        }

        for (const [pattern, callback] of Object.entries(callbacks)) {
            logEntries.forEach(entry => {
                if (entry.match(pattern)) {
                    callback(entry)
                }
            })
        }
    },
    start: (logFile, timestampPattern) => {
        reader.pattern = new RegExp(`^${timestampPattern} (.+)$`, 'gm');

        new TailFile(logFile, { encoding: 'utf8' })
            .on('data', reader.onData)
            .on('tail_error', (err) => {
                console.error('TailFile had an error!', err)
            })
            .on('error', (err) => {
                console.error('A TailFile stream error was likely encountered', err)
            })
            .start()
            .then(() => {
                console.log(`Found the log file, looking for entries starting with: ${timestampPattern}`)
            })
            .catch((err) => {
                console.error('Cannot start. Does the file exist?', err)
            })
    },
};

module.exports = { reader }
