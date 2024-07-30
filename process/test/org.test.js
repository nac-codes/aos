import { test } from 'node:test'
import * as assert from 'node:assert'
import AoLoader from '@permaweb/ao-loader'
import fs from 'fs'

const wasm = fs.readFileSync('./process.wasm')
const options = { format: "wasm64-unknown-emscripten-draft_2024_02_15" }

test('org', async () => {
    const handle = await AoLoader(wasm, options)
    const env = {
      Process: {
        Id: 'AOS',
        Owner: 'FOOBAR',
        Tags: [
          { name: 'Name', value: 'Thomas' }
        ]
      }
    }
    const msg = {
        Target: 'AOS',
        From: 'FOOBAR',
        Owner: 'FOOBAR',
        ['Block-Height']: "1000",
        Id: "1234xyxfoo",
        Module: "WOOPAWOOPA",
        Tags: [
            { name: 'Action', value: 'Init' }
        ],
        Data: 'hello'
    }

    const { Memory } = await handle(null, msg, env)
    // ---
    const getInfo = {
        From: 'FRED',
        Target: 'AOS',
        Owner: 'FRED',
        Tags: [
            { name: 'Action', value: 'Info' }
        ],
        Data: 'hello'
    }
    const result = await handle(Memory, getInfo, env)
    console.log(result.Output)
    // handled once
    assert.equal(result.Output.data, 'FRED DAO Token DAO 12')

    const getBalance = {
        From: 'AOS',
        Target: 'AOS',
        Owner: 'AOS',
        Tags: [
            { name: 'Action', value: 'Balance' }
        ],
        Data: 'hello'
    }

    const result2 = await handle(Memory, getBalance, env)
    console.log(result2.Output)
    // handled once
    assert.equal(result2.Output.data, 'Your balance is 10000000000000 DAO')

    const getBalances = {
        From: 'AOS',
        Target: 'AOS',
        Owner: 'AOS',
        Tags: [
            { name: 'Action', value: 'GetBalances' }
        ],
        Data: 'hello'
    }

    const result3 = await handle(Memory, getBalances, env)
    console.log(result3.Output)
    assert.equal(result3.Output.data, '{"AOS":"10000000000000"}')

    const getBalances2 = {
        From: 'NOT A MEMBER',
        Target: 'AOS',
        Owner: 'NOT A MEMBER',
        Tags: [
            { name: 'Action', value: 'GetBalances' }
        ],
        Data: 'hello'
    }

    const result4 = await handle(Memory, getBalances2, env)
    console.log(result4.Output)
    assert.equal(result4.Output.data, 'Unauthorized: Only members can get balances')

})