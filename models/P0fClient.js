"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.P0fClient = void 0;
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
const net_1 = require("net");
class P0fClient {
    constructor(socketPath = '/tmp/p0f.socket', timeout = 2000) {
        if (typeof socketPath !== 'string' || fs.existsSync(socketPath) === false) {
            throw new Error('Invalid socket path.');
        }
        this.socketPath = socketPath;
        this.timeout = timeout;
    }
    async query(ip) {
        if (!(0, net_1.isIPv4)(ip) && !(0, net_1.isIPv6)(ip)) {
            throw new Error('Invalid IP address.');
        }
        const queryBuffer = this.buildQueryBuffer(ip);
        return new Promise((resolve, reject) => {
            const client = net.createConnection({ path: this.socketPath }, () => {
                client.write(queryBuffer);
            });
            client.setTimeout(this.timeout);
            client.on('data', (data) => {
                const result = this.parseResponse(data);
                resolve(result);
                client.end();
            });
            client.on('timeout', () => {
                reject(new Error('Socket connection timed out.'));
                client.destroy();
            });
            client.on('error', (err) => {
                reject(err);
            });
            client.on('end', () => {
                reject(new Error('Socket connection ended.'));
                // console.log(`>>END`)
            });
        });
    }
    buildQueryBuffer(ip) {
        const buffer = Buffer.alloc(21);
        buffer.writeUInt32LE(0x50304601, 0); // Magic dword
        buffer.writeUInt8((0, net_1.isIPv4)(ip) ? 4 : 6, 4); // Address type
        const ipBuffer = (0, net_1.isIPv4)(ip) ? Buffer.from(ip.split('.').map(Number)) : Buffer.from(ip.split(':').map((segment) => parseInt(segment, 16)));
        ipBuffer.copy(buffer, 5);
        return buffer;
    }
    parseResponse(data) {
        const status = data.readUInt32LE(4);
        let version = data.readUInt8(8);
        let last_mtu = -1;
        let last_freq = -1;
        let offset = 0;
        if (version === 2) {
            last_mtu = data.readUInt16LE(9);
            last_freq = data.readDoubleLE(11);
            offset = 1 + 2 + 8; // version2 of api response
        }
        else {
            offset = 0;
            version = 1; // original version
        }
        const result = {
            version,
            status,
            first_seen: this.toDate(data.readUInt32LE(offset + 8)),
            last_seen: this.toDate(data.readUInt32LE(offset + 12)),
            total_conn: data.readUInt32LE(offset + 16),
            uptime_min: data.readUInt32LE(offset + 20),
            up_mod_days: data.readUInt32LE(offset + 24),
            last_nat: data.readUInt32LE(offset + 28),
            last_chg: data.readUInt32LE(offset + 32),
            distance: data.readInt16LE(offset + 36),
            bad_sw: data.readUInt8(offset + 38),
            os_match_q: data.readUInt8(offset + 39),
            os_name: data.toString('utf8', offset + 40, 72).replace(/\0.*$/g, ''),
            os_flavor: data.toString('utf8', offset + 72, 104).replace(/\0.*$/g, ''),
            http_name: data.toString('utf8', offset + 104, 136).replace(/\0.*$/g, ''),
            http_flavor: data.toString('utf8', offset + 136, 168).replace(/\0.*$/g, ''),
            link_type: data.toString('utf8', offset + 168, 200).replace(/\0.*$/g, ''),
            language: data.toString('utf8', offset + 200, 232).replace(/\0.*$/g, ''),
            last_mtu,
            last_freq
        };
        // if (result.status !== Status.OK) {
        //   throw new Error('p0f returned a status indicating an issue with the query.');
        // }
        return result;
    }
    toDate(unixTime) {
        return unixTime ? new Date(unixTime * 1000) : null;
    }
}
exports.P0fClient = P0fClient;
//# sourceMappingURL=P0fClient.js.map