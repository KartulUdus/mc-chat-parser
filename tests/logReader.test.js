const { describe, it } = require('node:test')
const assert = require('node:assert')
const { reader } = require('../src/logReader.js')
const { EOL } = require('os');

describe('on data', () => {
    it('should split data if multiple entries are found', async () => {
        const message =
            `will ignore this line${EOL}` +
            `2023-10-20 21:49:22 [Server thread/INFO]: will match${EOL}` +
            ` but also include this line${EOL}` +
            `2023-10-21 21:49:22 [ will match again${EOL}` +
            ` 2023-10-22 21:49:22 [Server thread/INFO]: and this${EOL}`
        let actual = []

        reader.register('will ignore this line', (logOutput) => {
            assert.fail('Should have been ignored')
        })

        reader.register('.*', (logOutput) => {
            actual.push(logOutput)
        })

        await reader.onData(message)

        assert.deepEqual(actual, [
            `[Server thread/INFO]: will match${EOL} but also include this line`,
            `[ will match again${EOL} 2023-10-22 21:49:22 [Server thread/INFO]: and this`
        ])
    });

    it('should pass entry to all matching callbacks', async () => {
        const message = '2023-10-20 21:49:22 [Server thread/INFO]: <Socrates2100> test content'
        let calls = 0

        reader.register('\\[Server thread\\/INFO]: <', (logOutput) => {
            assert.strictEqual(logOutput, '[Server thread/INFO]: <Socrates2100> test content')
            calls++
        })

        reader.register('<Socrates2100>', async (logOutput) => {
            assert.strictEqual(logOutput, '[Server thread/INFO]: <Socrates2100> test content')
            calls++
        })

        reader.register('Socrates0000', async (logOutput) => {
            assert.fail('Should not be called')
        })

        await reader.onData(message)

        assert.strictEqual(2, calls)
    });
});

// TODO: test file reading
// describe('start', () => {
//     it('should read file if found', () => {
//         assert.fail('not implemented')
//     });
//     it('should throw error, if file not found', () => {
//         assert.fail('not implemented')
//     });
// });
