"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const index_1 = require("./index");
const logs = new index_1.P0fLogfile('/tmp/p0f.log');
const p0f = new index_1.P0fClient('/var/run/p0f.socket');
function readIP() {
    const args = process.argv[2];
    if (!args)
        return null;
    if (!net_1.default.isIPv4(args) && !net_1.default.isIPv6(args)) {
        console.log('Please provide a valid IP address.');
        process.exit(1);
    }
    return args;
}
async function start() {
    try {
        let ip = readIP();
        if (ip === null) {
            console.log(`... opening logs`);
            const module = await logs.tailModule('mtu', 1000);
            console.log(`... logs opened`);
            const randomClient = module.find((m) => m.subj = 'cli');
            console.log(randomClient);
            ip = randomClient.cli_ip;
        }
        const res = await p0f.query(ip);
        console.log(res);
    }
    catch (err) {
        console.log(err);
    }
    process.exit(0);
}
start();
//# sourceMappingURL=demo.js.map