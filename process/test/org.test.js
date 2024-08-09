import { test } from 'node:test'
import * as assert from 'node:assert'
import AoLoader from '@permaweb/ao-loader'
import fs from 'fs'

const wasm = fs.readFileSync('./process.wasm')
const options = { format: "wasm64-unknown-emscripten-draft_2024_02_15" }

// Helper function to parse the JSON output
function parseOutput(output) {
    try {
        return JSON.parse(output.data)
    } catch (error) {
        console.error("Error parsing output:", output.data)
        return output.data // Return raw data if parsing fails
    }
}

// Helper function to initialize the process and perform an action
async function initAndPerformAction(initTags, actionMsg) {
    console.log("\n--- Initializing new test ---")
    console.log("Init Tags:", initTags)
    console.log("Action Message:", JSON.stringify(actionMsg, null, 2))

    const handle = await AoLoader(wasm, options)
    const env = {
        Process: {
            Id: 'AOS',
            Owner: 'FOOBAR',
            Tags: [
                { name: 'Name', value: 'TestDAO' }
            ]
        }
    }

    const initMsg = {
        Target: 'AOS',
        From: 'FOOBAR',
        Owner: 'FOOBAR',
        ['Block-Height']: "1000",
        Id: "init123",
        Module: "WOOPAWOOPA",
        Tags: [
            { name: 'Action', value: 'Init' },
            ...initTags
        ],
        Data: 'Initializing'
    }

    console.log("Sending init message...")
    const { Memory } = await handle(null, initMsg, env)
    console.log("Init complete. Sending action message...")
    const result = await handle(Memory, actionMsg, env)
    console.log("Action complete. Raw output:", result.Output)
    return result.Output
}

test('DAO Initialization and Basic Operations', async (t) => {
    await t.test('Initialize DAO with custom parameters', async () => {
        console.log("\n=== Test: Initialize DAO with custom parameters ===")
        const initTags = [
            { name: 'Name', value: 'MyCustomDAO' },
            { name: 'Ticker', value: 'MCD' },
            { name: 'UniqueID', value: 'custom-dao-123' }
        ]
        const actionMsg = {
            From: 'AOS',
            Target: 'AOS',
            Owner: 'AOS',
            Tags: [
                { name: 'Action', value: 'Info' }
            ],
            Data: 'Get DAO Info'
        }
        const result = await initAndPerformAction(initTags, actionMsg)
        console.log("Assertion: Output should contain correct DAO info")
        console.log("Output:", result.data)
        assert.ok(result.data.includes("Name: MyCustomDAO Ticker: MCD"), "Output does not contain expected DAO info")
        console.log("Test completed successfully")
    })

    await t.test('Initialize DAO with default parameters', async () => {
        console.log("\n=== Test: Initialize DAO with default parameters ===")
        const initTags = [] // No custom tags
        const actionMsg = {
            From: 'AOS',
            Target: 'AOS',
            Owner: 'AOS',
            Tags: [
                { name: 'Action', value: 'Info' }
            ],
            Data: 'Get DAO Info'
        }
        const result = await initAndPerformAction(initTags, actionMsg)
        console.log("Assertion: Output should contain default DAO info")
        console.log("Output:", result.data)
        assert.ok(result.data.includes("Name: DAO Token Ticker: DAO"), "Output does not contain expected default DAO info")
        console.log("Test completed successfully")
    })

    await t.test('Check initial balance', async () => {
        console.log("\n=== Test: Check initial balance ===")
        const initTags = [
            { name: 'Name', value: 'BalanceCheckDAO' },
            { name: 'Ticker', value: 'BCD' },
            { name: 'UniqueID', value: 'balance-check-123' }
        ]
        const actionMsg = {
            From: 'AOS',
            Target: 'AOS',
            Owner: 'AOS',
            Tags: [
                { name: 'Action', value: 'Balance' }
            ],
            Data: 'Check Balance'
        }
        const result = await initAndPerformAction(initTags, actionMsg)
        console.log("Assertion: Output should show correct initial balance")
        console.log("Output:", result.data)
        assert.ok(result.data.includes("Your balance is 10000000000000 BCD"), "Output does not show correct initial balance")
        console.log("Test completed successfully")
    })

    await t.test('Get Balances (as member)', async () => {
        console.log("\n=== Test: Get Balances (as member) ===")
        const initTags = []
        const actionMsg = {
            From: 'AOS',
            Target: 'AOS',
            Owner: 'AOS',
            Tags: [
                { name: 'Action', value: 'GetBalances' }
            ],
            Data: 'Get Balances'
        }
        const result = await initAndPerformAction(initTags, actionMsg)
        console.log("Assertion: Output should contain balance information")
        const parsedResult = parseOutput(result)
        console.log("Parsed Result:", parsedResult)
        assert.strictEqual(parsedResult.AOS, "10000000000000", "AOS balance is not correct")
        console.log("Test completed successfully")
    })

    await t.test('Get Balances (as non-member)', async () => {
        console.log("\n=== Test: Get Balances (as non-member) ===")
        const initTags = []
        const actionMsg = {
            From: 'NON_MEMBER',
            Target: 'AOS',
            Owner: 'NON_MEMBER',
            Tags: [
                { name: 'Action', value: 'GetBalances' }
            ],
            Data: 'Get Balances'
        }
        const result = await initAndPerformAction(initTags, actionMsg)
        console.log("Assertion: Output should show unauthorized message")
        console.log("Output:", result.data)
        assert.ok(result.data.includes("Unauthorized: Only members can get balances"), "Output does not show unauthorized message")
        console.log("Test completed successfully")
    })

    console.log("\n=== All tests completed ===")
})