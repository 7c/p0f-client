import * as fs from 'fs';

export class P0fLogfile {
  constructor(private filePath: string) {
    if (typeof filePath !== 'string') {
      throw new Error('File path must be a string');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} does not exist`);
    }
  }

  async tailModule(moduleName: string, lines: number = 1000): Promise<any[]> {
    const results: any[] = [];
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
      } else {
        partialLine = ''; // No more partial lines when reaching the beginning of the file
      }
  
      for (let i = linesInChunk.length - 1; i >= 0; i--) {
        const line = linesInChunk[i].trim();
        if (!line || line === '') continue;
  
        const dateAndRest = line.split('] ');
        if (dateAndRest.length < 2) continue;
  
        const [datePart, ...rest] = dateAndRest;
        const date = new Date(datePart.replace('[', '').trim());
        
        if (rest.length === 0 || !rest[0]) continue;
  
        const modPart = rest[0].split('|')[0];
        const modName = modPart.split('=')[1];
        if (modName !== moduleName) continue;
  
        const entry: any = { date, mod: modName };
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
        if (remainingLines === 0) break;
      }
    }
  
    fs.closeSync(fd);
    return results;
  }

  private parseIPv4(value: string): [string, string] {
    const [ip, port] = value.split('/');
    return [ip, port || '0'];
  }

  private parseIPv6(value: string): [string, string] {
    const match = value.match(/\[(.*)\]\/(\d+)/);
    if (match) {
      return [match[1], match[2]];
    }
    return [value, '0'];
  }
}