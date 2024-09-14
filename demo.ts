import net from 'net'
import { P0fClient,P0fLogfile } from './index'

const logs = new P0fLogfile('/tmp/p0f.log')
const p0f = new P0fClient('/var/run/p0f.socket')

function readIP() {
    const args = process.argv[2]
    if(!args) return null
    if(!net.isIPv4(args) && !net.isIPv6(args)) {
        console.log('Please provide a valid IP address.')
        process.exit(1)
    }
    return args
}

async function start() {
    try {
        let ip = readIP()
        if (ip===null) {
            console.log(`... opening logs`)
            const module = await logs.tailModule('mtu',1000)
            console.log(`... logs opened`)
            const randomClient = module.find((m:any) => m.subj='cli')
            console.log(randomClient)
            ip = randomClient.cli_ip
        }
        const res = await p0f.query(ip as string)
        console.log(res)
    } catch(err) {
        console.log(err)
    }
    process.exit(0)
}

start()