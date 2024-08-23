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
exports.P0fLogfile = void 0;
const fs = __importStar(require("fs"));
class P0fLogfile {
    constructor(filePath) {
        this.filePath = filePath;
        if (typeof filePath !== 'string') {
            throw new Error('File path must be a string');
        }
        if (!fs.existsSync(filePath)) {
            throw new Error(`File ${filePath} does not exist`);
        }
    }
    async tailModule(moduleName, lines = 1000) {
        const results = [];
        const bufferSize = 8192; // Read in chunks of 8KB
        const buffer = Buffer.alloc(bufferSize);
        const fd = fs.openSync(this.filePath, 'r');
        let filePos = fs.statSync(this.filePath).size;
        let remainingLines = lines;
        let partialLine = '';
        while (filePos > 0 && remainingLines > 0) {
            const readSize = Math.min(bufferSize, filePos);
            filePos -= readSize;
            fs.readSync(fd, buffer, 0, readSize, filePos);
            const chunk = buffer.slice(0, readSize).toString('utf-8');
            const linesInChunk = (partialLine + chunk).split('\n');
            if (filePos > 0) {
                partialLine = linesInChunk.shift() || ''; // Keep the first incomplete line
            }
            else {
                partialLine = ''; // No more partial lines when reaching the beginning of the file
            }
            for (let i = linesInChunk.length - 1; i >= 0; i--) {
                const line = linesInChunk[i].trim();
                if (!line || line === '')
                    continue;
                const dateAndRest = line.split('] ');
                if (dateAndRest.length < 2)
                    continue;
                const [datePart, ...rest] = dateAndRest;
                const date = new Date(datePart.replace('[', '').trim());
                if (rest.length === 0 || !rest[0])
                    continue;
                const modPart = rest[0].split('|')[0];
                const modName = modPart.split('=')[1];
                if (modName !== moduleName)
                    continue;
                const entry = { date, mod: modName };
                const fullLine = rest[0].split('|').slice(1);
                for (const part of fullLine) {
                    const [key, value] = part.split('=');
                    if (key && value) {
                        entry[key] = value;
                        if (key === 'cli' || key === 'srv') {
                            const [ip, port] = value.includes('[') ? this.parseIPv6(value) : this.parseIPv4(value);
                            entry[`${key}_ip`] = ip;
                            entry[`${key}_port`] = port ? parseInt(port, 10) : 0;
                        }
                    }
                }
                results.unshift(entry);
                remainingLines--;
                if (remainingLines === 0)
                    break;
            }
        }
        fs.closeSync(fd);
        return results;
    }
    parseIPv4(value) {
        const [ip, port] = value.split('/');
        return [ip, port || '0'];
    }
    parseIPv6(value) {
        const match = value.match(/\[(.*)\]\/(\d+)/);
        if (match) {
            return [match[1], match[2]];
        }
        return [value, '0'];
    }
}
exports.P0fLogfile = P0fLogfile;
//# sourceMappingURL=P0fLogfile.js.map