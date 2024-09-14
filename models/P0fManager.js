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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.P0fManager = void 0;
const debug_1 = __importDefault(require("debug"));
const fs = __importStar(require("fs"));
const tools_1 = require("../inc/tools");
const index_1 = require("../index");
const dbg = (0, debug_1.default)('p0f-manager');
const isJestRunning = typeof jest !== 'undefined';
dbg.enabled = isJestRunning;
class P0fManager {
    constructor(socketPath = '/tmp/p0f.socket', socket_timeout = 2000) {
        this.socketPath = socketPath;
        this.socket_timeout = socket_timeout;
        this.client = undefined;
        this.is_ready = false;
        dbg(`INIT: socketPath: ${socketPath} socket_timeout: ${socket_timeout}`);
    }
    getClient() {
        dbg(`getClient()`);
        if (!fs.existsSync(this.socketPath)) {
            dbg(`socketPath does not exist`);
            return null;
        }
        try {
            if (!this.client) {
                dbg(`getClient(): creating new P0fClient`);
                this.client = new index_1.P0fClient(this.socketPath, this.socket_timeout);
            }
            dbg(`getClient(): returning client`);
            return this.client;
        }
        catch (err) {
            if (err instanceof Error)
                dbg(`getClient(): error: ${err.message}`);
            return null;
        }
    }
    async do_query(client, ip, query_timeout = 100) {
        try {
            dbg(`do_query(${ip})`);
            const res = await (0, tools_1.promiseTimeout)(query_timeout, client.query(ip));
            this.is_ready = true;
            dbg(`do_query(${ip}): res: ${JSON.stringify(res)}`);
            return res !== null && res !== void 0 ? res : null;
        }
        catch (err) {
            this.is_ready = false;
            dbg(`do_query(${ip}): error: ${err}`);
            if (err instanceof Error)
                return err.message;
            return 'exception';
        }
    }
    async query(ip, query_timeout = 100) {
        dbg('query()');
        const client = this.getClient();
        if (!client) {
            dbg('query(): no-socket-connection');
            return 'no-socket-connection';
        }
        if (!this.is_ready) {
            dbg('query(): not-ready');
            // if not ready, try to reconnect but respond quickly, because we do not know when it will be ready
            this.do_query(client, ip, 50).then((res) => { }).catch((err) => { });
            return 'not-ready';
        }
        dbg('query(): ready');
        return this.do_query(client, ip, query_timeout);
    }
    isReady() {
        return this.is_ready;
    }
}
exports.P0fManager = P0fManager;
//# sourceMappingURL=P0fManager.js.map