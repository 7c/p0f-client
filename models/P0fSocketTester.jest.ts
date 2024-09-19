import { wait } from '@root/inc/tools'
import { P0fSocketTester } from './P0fSocketTester'
import { P0fClient } from '../index'



beforeAll(async () => {
    
})

describe('P0fSocketTester', () => {

    let testSocketServer: P0fSocketTester
    let testSocketClient: P0fClient

    beforeEach(async () => {
        const testSocketServerFile = `/tmp/p0ftest.${Date.now()}.socket`
        testSocketServer = new P0fSocketTester(testSocketServerFile)
        testSocketClient = new P0fClient(testSocketServerFile)
        await wait(0.25)
    })

    it('should respond with 16(OK) if no status is set (default)', async () => {
        expect(testSocketServer['mode']).toBe(16)
    })

    it('mode:OK (16) should always respond with a random value', async () => {
        testSocketServer.randomOK()
        for (let i = 0; i < 100; i++) {
            expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16)
            await wait(0.01)
        }
    })

    it('mode:NoMatch (32) should always respond with a random value', async () => {
        testSocketServer.randomNoMatch()
        for (let i = 0; i < 1000; i++) {
            expect(await testSocketClient.query('0.0.1.2')).toBe(null)
        }
    })

    it('it should be possible to switch between modes', async () => {
        testSocketServer.randomOK()
        expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16)
        testSocketServer.randomNoMatch()
        expect(await testSocketClient.query('4.5.6.7')).toBe(null)
        testSocketServer.randomBadQuery()
        expect(await testSocketClient.query('7.8.9.0')).toHaveProperty('status', 0)
    })

    it('mode:timeout should work as expected', async () => {
        testSocketServer.modeTimeout()
        await expect(testSocketClient.query('1.2.3.4')).rejects.toThrow()
        // switch back
        testSocketServer.randomOK()
        expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16)
    })

    


})