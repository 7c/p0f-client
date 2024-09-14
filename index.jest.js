"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const P0fLogfile_1 = require("./models/P0fLogfile");
const p0fsocket = '/var/run/p0f.socket';
const logs = new P0fLogfile_1.P0fLogfile('/tmp/p0f.log');
// this test requires live p0f socket, so adapt the const p0fsocket and logs to be match your p0f instance
// need to rewrite it to be running without live socket with mocked P0fSocketTester
// also need to write tests for api2 responses
describe('p0fClient', () => {
    it('class should throw if socket file is not found', () => {
        expect(() => new index_1.P0fClient('no-file')).toThrow();
    });
    it('class should throw socketfile is not string', () => {
        //@ts-ignore
        expect(() => new index_1.P0fClient([])).toThrow();
        //@ts-ignore
        expect(() => new index_1.P0fClient({})).toThrow();
    });
    describe('query', () => {
        const p0f = new index_1.P0fClient(p0fsocket);
        it('not-existing ip4 shall respond null', async () => {
            const res = await p0f.query('1.2.3.4');
            expect(res).toBeNull();
            if (res)
                expect(res.status).toBe(32 /* StatusCode.NoMatch */);
        });
        it('not-existing ip6 shall respond null', async () => {
            const res = await p0f.query('2001:db8::');
            expect(res).toBeNull();
            if (res)
                expect(res.status).toBe(32 /* StatusCode.NoMatch */);
        });
        it('existing ip4 with mtu', async () => {
            const module = await logs.tailModule('mtu', 1000);
            const randomClient = module.find((m) => m.subj = 'cli');
            // console.log(randomClient)
            const res = await p0f.query(randomClient.cli_ip);
            // console.log(res)
            expect(res).not.toBeNull();
            if (res)
                expect(res.status).toBe(16 /* StatusCode.OK */);
            if (res)
                expect(res.total_conn).toBeGreaterThan(0);
        });
        it('existing ip4 with "host change"', async () => {
            const module = await logs.tailModule('host change', 1000);
            const randomClient = module.find((m) => m.subj = 'cli');
            // console.log(randomClient)
            const res = await p0f.query(randomClient.cli_ip);
            // console.log(res)
            expect(res).not.toBeNull();
            if (res)
                expect(res.status).toBe(16 /* StatusCode.OK */);
        });
    });
});
//# sourceMappingURL=index.jest.js.map