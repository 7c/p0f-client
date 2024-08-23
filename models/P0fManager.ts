import debug from 'debug';
import * as fs from 'fs';
import { promiseTimeout } from '../inc/tools';
import { P0fClient, tQueryResponse } from '../index';
const dbg = debug('p0f-manager')
dbg.enabled = true

export class P0fManager {
    client?: P0fClient = undefined
    is_ready: boolean = false

    constructor(private readonly socketPath: string = '/tmp/p0f.socket', 
                private readonly socket_timeout: number = 2000) {
            dbg(`INIT: socketPath: ${socketPath} socket_timeout: ${socket_timeout}`)
    }

    private getClient() {
        dbg(`getClient()`)
        if (!fs.existsSync(this.socketPath)) {
            dbg(`socketPath does not exist`)
            return null
        }

        try {
            if (!this.client) {
                dbg(`getClient(): creating new P0fClient`)
                this.client = new P0fClient(this.socketPath, this.socket_timeout)
            }
            dbg(`getClient(): returning client`)
            return this.client
        } catch (err) {
            if (err instanceof Error) dbg(`getClient(): error: ${err.message}`)
            return null
        }
    }

    private async do_query(client: P0fClient, ip: string, query_timeout: number = 100): Promise<tQueryResponse | string> {
        try {
            dbg(`do_query(${ip})`)
            const res = await promiseTimeout(query_timeout, client.query(ip))
            this.is_ready = true
            dbg(`do_query(${ip}): res: ${JSON.stringify(res)}`)
            return res
        }
        catch (err) {
            this.is_ready = false
            dbg(`do_query(${ip}): error: ${err}`)
            if (err instanceof Error) return err.message
            return 'exception'
        }
    }

    async query(ip: string, query_timeout: number = 100): Promise<tQueryResponse | string> {
        dbg('query()')
        const client = this.getClient()
        if (!client) {
            dbg('query(): no-socket-connection')
            return 'no-socket-connection'
        }

        if (!this.is_ready) {
            dbg('query(): not-ready')
            // if not ready, try to reconnect but respond quickly, because we do not know when it will be ready
            this.do_query(client, ip, 50).then((res) => { }).catch((err) => { })
            return 'not-ready'
        }

        dbg('query(): ready')
        return this.do_query(client, ip, query_timeout)
    }

    public isReady(): boolean {
        return this.is_ready
    }
}



