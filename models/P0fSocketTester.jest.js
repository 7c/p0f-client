"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("@root/inc/tools");
const P0fSocketTester_1 = require("./P0fSocketTester");
const index_1 = require("../index");
const testSocketServerFile = '/tmp/p0ftest.socket';
const testSocketServer = new P0fSocketTester_1.P0fSocketTester(testSocketServerFile);
const testSocketClient = new index_1.P0fClient(testSocketServerFile);
beforeAll(async () => {
    await (0, tools_1.wait)(0.25);
    expect(testSocketServer).toBeDefined();
    expect(testSocketClient).toBeDefined();
});
describe('P0fSocketTester', () => {
    it('should respond with 16(OK) if no status is set (default)', async () => {
        expect(testSocketServer['mode']).toBe(16);
    });
    it('mode:OK (16) should always respond with a random value', async () => {
        testSocketServer.randomOK();
        for (let i = 0; i < 100; i++) {
            expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16);
            await (0, tools_1.wait)(0.01);
        }
    });
    it('mode:NoMatch (32) should always respond with a random value', async () => {
        testSocketServer.randomNoMatch();
        for (let i = 0; i < 1000; i++) {
            expect(await testSocketClient.query('0.0.1.2')).toHaveProperty('status', 32);
        }
    });
    it('it should be possible to switch between modes', async () => {
        testSocketServer.randomOK();
        expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16);
        testSocketServer.randomNoMatch();
        expect(await testSocketClient.query('4.5.6.7')).toHaveProperty('status', 32);
        testSocketServer.randomBadQuery();
        expect(await testSocketClient.query('7.8.9.0')).toHaveProperty('status', 0);
    });
    it('mode:timeout should work as expected', async () => {
        testSocketServer.modeTimeout();
        await expect(testSocketClient.query('1.2.3.4')).rejects.toThrow();
        // switch back
        testSocketServer.randomOK();
        expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16);
    });
});
//# sourceMappingURL=P0fSocketTester.jest.js.map