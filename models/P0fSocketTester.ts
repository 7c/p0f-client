import * as net from 'net';
import * as fs from 'fs';
import path from 'path';

function loadTestData16(filename:string='testdata.16.json') { 
  const data = fs.readFileSync(path.join(__dirname, '../assets', filename), 'utf8');
  return data.split('\n').map((line: string) => {
    if (!line) return null;

    let j = JSON.parse(line);
    if (j.status !== 16) return null;
    j.first_seen = new Date(j.first_seen);
    j.last_seen = new Date(j.last_seen);
    return j
  });
}

const randomResponses = {
  16: loadTestData16('testdata.16.json'),
  32: [
    {
      status: 32,
      first_seen: null,
      last_seen: null,
      total_conn: 0,
      uptime_min: 0,
      up_mod_days: 0,
      last_nat: 0,
      last_chg: 0,
      distance: 0,
      bad_sw: 0,
      os_match_q: 0,
      os_name: '',
      os_flavor: '',
      http_name: '',
      http_flavor: '',
      link_type: '',
      language: ''
    }
  ],
  0: [
    {
      status: 0,
      first_seen: null,
      last_seen: null,
      total_conn: 0,
      uptime_min: 0,
      up_mod_days: 0,
      last_nat: 0,
      last_chg: 0,
      distance: 0,
      bad_sw: 0,
      os_match_q: 0,
      os_name: '',
      os_flavor: '',
      http_name: '',
      http_flavor: '',
      link_type: '',
      language: ''
    }
  ]
};

export class P0fSocketTester {
  private server: net.Server;
  private mode: keyof typeof randomResponses;

  constructor(private socketFile: string) {
    this.mode = 16; // Default mode to OK
    this.server = net.createServer(this.handleConnection.bind(this));

    if (fs.existsSync(this.socketFile)) {
      fs.unlinkSync(this.socketFile); // Remove the existing socket file if it exists
    }
    
    this.server.listen(this.socketFile, () => {
      console.log(`P0fSocketTester listening on ${this.socketFile}`);
    });
  }

  private handleConnection(socket: net.Socket): void {
    socket.on('data', () => {
      const response = this.getRandomResponse();
      const buffer = this.buildResponseBuffer(response);
      socket.write(buffer);
      socket.end();
    });
  }

  private getRandomResponse() {
    const responses = randomResponses[this.mode];
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  private buildResponseBuffer(response: any): Buffer {
    const buffer = Buffer.alloc(232);

    buffer.writeUInt32LE(0x50304602, 0); // Magic response dword
    buffer.writeUInt32LE(response.status, 4); // Status

    const writeDate = (date: Date | null, offset: number) => {
      buffer.writeUInt32LE(date ? Math.floor(date.getTime() / 1000) : 0, offset);
    };

    writeDate(response.first_seen, 8);
    writeDate(response.last_seen, 12);
    buffer.writeUInt32LE(response.total_conn, 16);
    buffer.writeUInt32LE(response.uptime_min, 20);
    buffer.writeUInt32LE(response.up_mod_days, 24);
    buffer.writeUInt32LE(response.last_nat, 28);
    buffer.writeUInt32LE(response.last_chg, 32);
    buffer.writeInt16LE(response.distance, 36);
    buffer.writeUInt8(response.bad_sw, 38);
    buffer.writeUInt8(response.os_match_q, 39);
    buffer.write(response.os_name, 40, 32, 'utf8');
    buffer.write(response.os_flavor, 72, 32, 'utf8');
    buffer.write(response.http_name, 104, 32, 'utf8');
    buffer.write(response.http_flavor, 136, 32, 'utf8');
    buffer.write(response.link_type, 168, 32, 'utf8');
    buffer.write(response.language, 200, 32, 'utf8');

    return buffer;
  }

  randomOK() {
    this.mode = 16;
  }

  randomNoMatch() {
    this.mode = 32;
  }

  randomBadQuery() {
    this.mode = 0;
  }

  close() {
    this.server.close(() => {
      if (fs.existsSync(this.socketFile)) {
        fs.unlinkSync(this.socketFile);
      }
      console.log(`P0fSocketTester closed`);
    });
  }
}