import { P0fClient,P0fLogfile } from './index'

const logs = new P0fLogfile('/tmp/p0f.log')
const p0f = new P0fClient('/var/run/p0f.socket')

async function start() {
    try {
        console.log(`... opening logs`)
        const module = await logs.tailModule('mtu',1000)
        console.log(`... logs opened`)
        const randomClient = module.find((m:any) => m.subj='cli')
        console.log(randomClient)
        const res = await p0f.query(randomClient.cli_ip)
        console.log(res)
    } catch(err) {
        console.log(err)
    }
    process.exit(0)
}

start()