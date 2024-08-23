import { P0fManager } from './P0fManager'
import fs from 'fs'
import { wait } from './../inc/tools'
import { P0fSocketTester } from './P0fSocketTester'
import { P0fClient } from '../index'

const test_socket_file1 = `/tmp/p0f.test.${Date. now()}.socket`

const testSocketServer1File = '/tmp/p0ftest1.socket'
const testSocketServer2File = '/tmp/p0ftest2.socket'
const testSocketServer1: P0fSocketTester = new P0fSocketTester(testSocketServer1File)

const testSocketClient: P0fClient = new P0fClient(testSocketServer1File)

beforeAll(() => {
    fs.writeFileSync(test_socket_file1, '')
})

describe('P0fManager with P0fSocketTester', () => {
    it('basic OK response', async () => {
        testSocketServer1.randomOK()
        expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 16)
    })

    it('basic NoMatch response', async () => {
        testSocketServer1.randomNoMatch()
        expect(await testSocketClient.query('1.2.3.4')).toHaveProperty('status', 32)
    })

    it('basic BadQuery response', async () => {
        testSocketServer1.randomBadQuery()
        expect(await testSocketClient.query('1.0.0.0')).toHaveProperty('status', 0)
    })

    it('first query must fail because of how P0fManager works', async () => {
        const testSocketServer2 = new P0fSocketTester(testSocketServer2File)
        await wait(0.25)
        const manager = new P0fManager(testSocketServer2File)
        testSocketServer2.randomOK()
        expect(await manager.query('1.2.3.4')).toBe('not-ready')
        // but second query should work after a short delay
        await wait(0.25)
        expect(await manager.query('1.2.3.4')).toHaveProperty('status', 16)
        expect(await manager.query('5.0.0.0')).toHaveProperty('status', 16)
        expect(await manager.query('5.0.0.1')).toHaveProperty('status', 16)
    })

    it('start querying then server switches to not-ready', async () => {
        const testSocketServer3 = new P0fSocketTester(testSocketServer2File)
        await wait(0.25)
        const manager = new P0fManager(testSocketServer2File)
        testSocketServer3.randomOK()
        expect(await manager.query('1.2.3.4')).toBe('not-ready')
        await wait(0.25)
        for(let i=0; i<10; i++) expect(await manager.query('1.2.3.4')).toHaveProperty('status', 16)
        testSocketServer3.modeTimeout()
        expect(manager.isReady()).toBe(true)
        // first response will be an exception which will trigger not Ready
        expect(await manager.query('1.2.3.4')).toBe('exception')
        expect(manager.isReady()).toBe(false)
        expect(await manager.query('1.2.3.4')).toBe('not-ready')
        expect(manager.isReady()).toBe(false)
    })
})

describe('P0fManager basics', () => {
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