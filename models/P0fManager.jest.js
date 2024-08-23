"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const P0fManager_1 = require("./P0fManager");
const fs_1 = __importDefault(require("fs"));
const tools_1 = require("./../inc/tools");
const test_socket_file1 = `/tmp/p0f.test.${Date.now()}.socket`;
beforeAll(() => {
    fs_1.default.writeFileSync(test_socket_file1, '');
});
describe('P0fManager', () => {
    it('initiating not existing socket-file should not throw', () => {
        expect(() => new P0fManager_1.P0fManager('no-file')).not.toThrow();
        expect(() => new P0fManager_1.P0fManager('')).not.toThrow();
        //@ts-ignore
        expect(() => new P0fManager_1.P0fManager([])).not.toThrow();
    });
    it('isReady should responde false if file is not existing', () => {
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