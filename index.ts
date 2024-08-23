import * as net from 'net';
import * as fs from 'fs';
import { isIPv4, isIPv6 } from 'net';

export const enum StatusCode {
  BadQuery = 0x00,
  OK = 0x10,
  NoMatch = 0x20
}

export type tQueryResponse = {
  status: StatusCode;
  first_seen: Date | null;
  last_seen: Date | null;
  total_conn: number;
  uptime_min: number;
  up_mod_days: number;
  last_nat: number;
  last_chg: number;
  distance: number;
  bad_sw: number;
  os_match_q: number;
  os_name: string;
  os_flavor: string;
  http_name: string;
  http_flavor: string;
  link_type: string;
  language: string;
};

export class P0fClient {
  private socketPath: string;
  private timeout: number;

  constructor(socketPath: string='/tmp/p0f.socket', timeout: number = 2000) {
    if (typeof socketPath !== 'string' || fs.existsSync(socketPath) === false) {
      throw new Error('Invalid socket path.');
    }
    this.socketPath = socketPath;
    this.timeout = timeout;
  }

  async query(ip: string): Promise<tQueryResponse> {
    if (!isIPv4(ip) && !isIPv6(ip)) {
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
    });
  }

  private buildQueryBuffer(ip: string): Buffer {
    const buffer = Buffer.alloc(21);
    buffer.writeUInt32LE(0x50304601, 0); // Magic dword
    buffer.writeUInt8(isIPv4(ip) ? 4 : 6, 4); // Address type

    const ipBuffer = isIPv4(ip) ? Buffer.from(ip.split('.').map(Number)) : Buffer.from(ip.split(':').map((segment) => parseInt(segment, 16)));
    ipBuffer.copy(buffer, 5);

    return buffer;
  }

  private parseResponse(data: Buffer): tQueryResponse {
    const status = data.readUInt32LE(4) as StatusCode;
    
    const result: tQueryResponse = {
      status,
      first_seen: this.toDate(data.readUInt32LE(8)),
      last_seen: this.toDate(data.readUInt32LE(12)),
      total_conn: data.readUInt32LE(16),
      uptime_min: data.readUInt32LE(20),
      up_mod_days: data.readUInt32LE(24),
      last_nat: data.readUInt32LE(28),
      last_chg: data.readUInt32LE(32),
      distance: data.readInt16LE(36),
      bad_sw: data.readUInt8(38),
      os_match_q: data.readUInt8(39),
      os_name: data.toString('utf8', 40, 72).replace(/\0.*$/g, ''),
      os_flavor: data.toString('utf8', 72, 104).replace(/\0.*$/g, ''),
      http_name: data.toString('utf8', 104, 136).replace(/\0.*$/g, ''),
      http_flavor: data.toString('utf8', 136, 168).replace(/\0.*$/g, ''),
      link_type: data.toString('utf8', 168, 200).replace(/\0.*$/g, ''),
      language: data.toString('utf8', 200, 232).replace(/\0.*$/g, '')
    };

    // if (result.status !== Status.OK) {
    //   throw new Error('p0f returned a status indicating an issue with the query.');
    // }

    return result;
  }

  private toDate(unixTime: number): Date | null {
    return unixTime ? new Date(unixTime * 1000) : null;
  }
}
