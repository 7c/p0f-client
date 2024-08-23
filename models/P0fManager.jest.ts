import { P0fManager } from './P0fManager'
import fs from 'fs'
import { wait } from './../inc/tools'

const test_socket_file1 = `/tmp/p0f.test.${Date. now()}.socket`

beforeAll(() => {
    fs.writeFileSync(test_socket_file1, '')
})

describe('P0fManager', () => {
    it('initiating not existing socket-file should not throw', () => {
        expect(() => new P0fManager('no-file')).not.toThrow()
        expect(() => new P0fManager('')).not.toThrow()
        //@ts-ignore
        expect(() => new P0fManager([])).not.toThrow()
    })

    it('isReady should responde false if file is not existing', () => {
        const manager = new P0fManager('no-file')
        expect(manager.isReady()).toBe(false)
    })

    it('isReady should respond false if socketfile is not valid', () => {
        const manager = new P0fManager(test_socket_file1)
        expect(manager.isReady()).toBe(false)
    })

    it('query should respond with no-socket-connection if socketfile is not valid', async () => {
        const manager = new P0fManager(test_socket_file1)
        // first query will always return not-ready
        expect(await manager.query('1.2.3.4')).toBe('not-ready')
        await wait(0.25)
        // second query will also fail because the initiation of first query was not successful
        expect(await manager.query('3.4.5.6')).toBe('not-ready')
    })
})