## p0f nodejs api client implementation
Based on https://lcamtuf.coredump.cx/p0f3/README but also supports https://github.com/7c/p0f-v3-api2 (patched version of p0f with api2 support)


## Some important comments from the original README
```
  - The maximum number of simultaneous API connections is capped to 20. The
    limit may be adjusted with the -S parameter, but rampant parallelism may
    lead to poorly controlled latency; consider a single query pipeline,
    possibly with prioritization and caching.

  - Cache entries with no activity for more than 120 minutes will be dropped
    even if the cache is nearly empty. The timeout is adjustable with -t, but
    you should not use the API to obtain ancient data; if you routinely need to
    go back hours or days, parse the logs instead of wasting RAM.
```

## Installation
```bash
npm i --save https://github.com/7c/p0f-client
```
## Starting p0f with socket and logs(optional for testing only, otherwise it grows indefinitely)
```bash
./p0f -s /tmp/p0f.socket -o /tmp/p0f.log
```

## Usage
Assume you have started it with `-s` and `-o` flags you can use following code to find a random client from the logfile and query it with p0f

```typescript
import { P0fClient,P0fLogfile } from "p0f-client"

const logs = new P0fLogfile('/tmp/p0f.log')
const p0f = new P0fClient('/tmp/p0f.socket')

async function start() {
    try {
        const module = await logs.tailModule('mtu',1000)
        const randomClient = module.find((m:any) => m.subj='cli')
        const res = await p0f.query(randomClient.cli_ip)
        console.log(res)
    } catch(err) {
        console.log(err)
    }
    process.exit(0)
}

start()
```

and the output should be something like this
```json
{
  status: 16,
  first_seen: 2024-08-19T14:43:52.000Z,
  last_seen: 2024-08-19T14:43:52.000Z,
  total_conn: 1,
  uptime_min: 0,
  up_mod_days: 0,
  last_nat: 0,
  last_chg: 0,
  distance: 12,
  bad_sw: 0,
  os_match_q: 2,
  os_name: 'Windows',
  os_flavor: 'NT kernel',
  http_name: '',
  http_flavor: '',
  link_type: 'Ethernet or modem',
  language: ''
}
```


## Testing
```bash
# optimized for linux
## start p0f with socket and logs
./p0f -s /tmp/p0f.socket -o /tmp/p0f.log
## run tests
npm run test
```

## P0fManager
this manager is designed for high performance queries with fault toleration (todo: caching). Designed to never throw and detecting down times automatically.
```typescript
import { P0fManager } from "p0f-client"
// constructor
// new P0fManager(socketFile: string, socket_timeout: number = 2000)

// methods
// async query(ip: string, query_timeout: number = 100): Promise<tQueryResponse | string>
// public isReady(): boolean
```

## P0fSocketTester
designed for testing the p0f socket, acts as mockup like random respond p0f compatible socket server, you can switch modes with `randomOK`, `randomNoMatch`, `randomBadQuery`, `modeTimeout` methods

```typescript
import { P0fSocketTester,P0fClient } from "p0f-client"

const socketFile = '/tmp/p0f.socket'
const mockSocketServer = new P0fSocketTester(socketFile)
mockSocketServer.randomOK()
const p0f = new P0fClient(socketFile)
await p0f.query('1.2.3.4')
```