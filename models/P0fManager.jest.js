"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const P0fManager_1 = require("./P0fManager");
const fs_1 = __importDefault(require("fs"));
const tools_1 = require("./../inc/tools");
const P0fSocketTester_1 = require("./P0fSocketTester");
const index_1 = require("../index");
const test_socket_file1 = `/tmp/p0f.test.${Date.now()}.socket`;
const testSocketServer1File = '/tmp/p0ftest1.socket';
const testSocketServer2File = '/tmp/p0ftest2.socket';
const testSocketServer1 = new P0fSocketTester_1.P0fSocketTester(testSocketServer1File);
const testSocketClient = new index_1.P0fClient(testSocketServer1File);
beforeAll(async () => {
    fs_1.default.writeFileSync(test_socket_file1, '');
    await (0, tools_1.wait)(0.25);
});
describe('P0fManager with P0fSocketTester', () => {
    it('basic OK response', async () => {
        testSocketServer1.randomOK();
        expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16);
    });
    it('basic NoMatch response', async () => {
        testSocketServer1.randomNoMatch();
        expect(await testSocketClient.query('1.2.3.4')).toBeNull();
    });
    it('basic BadQuery response', async () => {
        testSocketServer1.randomBadQuery();
        expect(await testSocketClient.query('1.0.0.0')).toHaveProperty('status', 0);
    });
    it('first query must fail because of how P0fManager works', async () => {
        const testSocketServer2 = new P0fSocketTester_1.P0fSocketTester(testSocketServer2File);
        await (0, tools_1.wait)(0.25);
        const manager = new P0fManager_1.P0fManager(testSocketServer2File);
        testSocketServer2.randomOK();
        expect(await manager.query('1.2.3.4')).toBe('not-ready');
        // but second query should work after a short delay
        await (0, tools_1.wait)(0.25);
        expect(await manager.query('1.2.3.4')).toHaveProperty('status', 16);
        expect(await manager.query('5.0.0.0')).toHaveProperty('status', 16);
        expect(await manager.query('5.0.0.1')).toHaveProperty('status', 16);
    });
    it('start querying then server switches to not-ready', async () => {
        const testSocketServer3 = new P0fSocketTester_1.P0fSocketTester(testSocketServer2File);
        await (0, tools_1.wait)(0.25);
        const manager = new P0fManager_1.P0fManager(testSocketServer2File);
        testSocketServer3.randomOK();
        expect(await manager.query('1.2.3.4')).toBe('not-ready');
        await (0, tools_1.wait)(0.25);
        for (let i = 0; i < 10; i++)
            expect(await manager.query('1.2.3.4')).toHaveProperty('status', 16);
        testSocketServer3.modeTimeout();
        expect(manager.isReady()).toBe(true);
        // first response will be an exception which will trigger not Ready
        expect(await manager.query('1.2.3.4')).toBe('exception');
        expect(manager.isReady()).toBe(false);
        expect(await manager.query('1.2.3.4')).toBe('not-ready');
        expect(manager.isReady()).toBe(false);
    });
    it('measuring timeouts and detection scenario1', async () => {
        const testSocketServer3 = new P0fSocketTester_1.P0fSocketTester(testSocketServer2File);
        testSocketServer3.randomOK();
        const manager = new P0fManager_1.P0fManager(testSocketServer2File);
        let started = Date.now();
        // first query should be not-ready within <10ms
        await manager.query('1.2.3.4', 100);
        expect(Date.now() - started).toBeLessThan(10);
        await manager.query('1.2.3.4', 100);
        // second query should also be not-ready because Manager did not have time to recognize 'ready' state
        expect(Date.now() - started).toBeLessThan(10);
        // lets wait to give it time
        await (0, tools_1.wait)(0.25);
        // now it should be ready
        expect(manager.isReady()).toBe(true);
    });
    it('measuring timeouts and detection scenario2', async () => {
        const testSocketServer3 = new P0fSocketTester_1.P0fSocketTester(testSocketServer2File);
        testSocketServer3.randomOK();
        const manager = new P0fManager_1.P0fManager(testSocketServer2File);
        // manager requires a query to detect ready state
        await manager.query('1.2.3.4', 100);
        await (0, tools_1.wait)(0.25);
        expect(manager.isReady()).toBe(true);
        // now we should be able to query very rapidly
        for (let i = 0; i < 50; i++) {
            let started = Date.now();
            await manager.query('1.2.3.4', 100);
            expect(Date.now() - started).toBeLessThan(50);
        }
    });
    it('manager requires a query to detect ready-state', async () => {
        const testSocketServer3 = new P0fSocketTester_1.P0fSocketTester(testSocketServer2File);
        testSocketServer3.randomOK();
        const manager = new P0fManager_1.P0fManager(testSocketServer2File);
        // manager requires a query to detect ready state
        await (0, tools_1.wait)(0.35);
        expect(manager.isReady()).toBe(false);
    });
});
describe('P0fManager basics', () => {
    it('initiating not existing socket-file should not throw', () => {
        expect(() => new P0fManager_1.P0fManager('no-file')).not.toThrow();
        expect(() => new P0fManager_1.P0fManager('')).not.toThrow();
        //@ts-ignore
        expect(() => new P0fManager_1.P0fManager([])).not.toThrow();
    });
    it('isReady should respond false if file does not exist', () => {
        const manager = new P0fManager_1.P0fManager('no-file');
        expect(manager.isReady()).toBe(false);
    });
    it('isReady should respond false if socketfile is not valid', () => {
        const manager = new P0fManager_1.P0fManager(test_socket_file1);
        expect(manager.isReady()).toBe(false);
    });
    it('query should respond with no-socket-connection if socketfile is not valid', async () => {
        const manager = new P0fManager_1.P0fManager(test_socket_file1);
        // first query will always return not-ready
        expect(await manager.query('1.2.3.4')).toBe('not-ready');
        await (0, tools_1.wait)(0.25);
        // second query will also fail because the initiation of first query was not successful
        expect(await manager.query('3.4.5.6')).toBe('not-ready');
    });
});
//# sourceMappingURL=P0fManager.jest.js.map