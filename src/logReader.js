const TailFile = require('@logdna/tail-file')
const logFile = process.env.LOG_FILE || '/logs/latest.log'

const reader = {
    callbacks: {},
    register: (pattern, callback) => {
        this.callbacks[pattern] = callback
    },
    start: () => {
        new TailFile(logFile, { encoding: 'utf8' }).on('data', async (logOutput) => {
            console.log('log entry:', logOutput)
            for (const [pattern, callback] of Object.entries(this.callbacks)) {
                if (logOutput.match(pattern)) {
                    callback(logOutput)
                }
            }
        }).on('tail_error', (err) => {
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
