import { P0fClient, StatusCode} from './index'
import { P0fLogfile } from './models/P0fLogfile'

const p0fsocket='/tmp/p0f.socket'
const logs = new P0fLogfile('/tmp/p0f.log')


describe('p0fClient', () => {
    it('class should throw if socket file is not found', () => {
        expect(() => new P0fClient('no-file')).toThrow()
    })
    it('class should throw socketfile is not string', () => {
        //@ts-ignore
        expect(() => new P0fClient([])).toThrow()
        //@ts-ignore
        expect(() => new P0fClient({})).toThrow()
    })

    describe('query', () => {
        const p0f = new P0fClient(p0fsocket)
        it('not-existing ip4 shall respond NoMatch', async () => {
            const res = await p0f.query('1.2.3.4')
            expect(res.status).toBe(StatusCode.NoMatch)
        })

        it('not-existing ip6 shall respond NoMatch', async () => {
            const res = await p0f.query('2001:db8::')
            expect(res.status).toBe(StatusCode.NoMatch)
        })

        it('existing ip4 with mtu', async () => {
            const module = await logs.tailModule('mtu',1000)
            const randomClient = module.find((m:any) => m.subj='cli')
            // console.log(randomClient)
            const res = await p0f.query(randomClient.cli_ip)
            // console.log(res)
            expect(res.status).toBe(StatusCode.OK)
            expect(res.total_conn).toBeGreaterThan(0)
        })

        it('existing ip4 with "host change"', async () => {
            const module = await logs.tailModule('host change',1000)
            const randomClient = module.find((m:any) => m.subj='cli')
            // console.log(randomClient)
            const res = await p0f.query(randomClient.cli_ip)
            // console.log(res)
            expect(res.status).toBe(StatusCode.OK)
        })
    })
    
})