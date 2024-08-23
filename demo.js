"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const P0fLogfile_1 = require("./models/P0fLogfile");
const logs = new P0fLogfile_1.P0fLogfile('/tmp/p0f.log');
const p0f = new index_1.P0fClient('/tmp/p0f.socket');
async function start() {
    try {
        console.log(`... opening logs`);
        const module = await logs.tailModule('mtu', 1000);
        console.log(`... logs opened`);
        const randomClient = module.find((m) => m.subj = 'cli');
        console.log(randomClient);
        const res = await p0f.query(randomClient.cli_ip);
        console.log(res);
    }
    catch (err) {
        console.log(err);
    }
    process.exit(0);
}
start();
//# sourceMappingURL=demo.js.map