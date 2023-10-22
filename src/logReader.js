const TailFile = require('@logdna/tail-file')

const logFile = process.env.LOG_FILE || '/logs/latest.log'
const timestampPattern = process.env.TIMESTAMP_PATTERN || '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'; //todo: default to just the time
const splitPattern = new RegExp(`^${timestampPattern} `, 'gm');
const callbacks = {}

const reader = {
    register: (pattern, callback) => {
        callbacks[pattern] = callback
    },
    onData: async (logOutput) => {
        console.log('Log entry:', logOutput)
        const logEntries = logOutput.split(splitPattern).map(x => x.trim()).filter(x => x !== '');

        if (!logOutput.match(`^${timestampPattern}`)) {
            logEntries.shift()
        }

        for (const [pattern, callback] of Object.entries(callbacks)) {
            logEntries.forEach(entry => {
                if (entry.match(pattern)) {
                    callback(entry)
                }
            })
        }
    },
    start: () => {
        new TailFile(logFile, { encoding: 'utf8' })
            .on('data', this.onData)
            .on('tail_error', (err) => {
                console.error('TailFile had an error!', err)
            })
            .on('error', (err) => {
                console.error('A TailFile stream error was likely encountered', err)
            })
            .start()
            .then(() => {
                console.log('Found the log file')
            })
            .catch((err) => {
                console.error('Cannot start. Does the file exist?', err)
            })
    },
};

module.exports = { reader }
