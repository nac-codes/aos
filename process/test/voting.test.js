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
        throw error
    }
}

// Helper function to initialize the process and perform an action
async function initAndPerformAction(initData, actionMsg) {
    console.log("\n--- Initializing new test ---")
    console.log("Init Data:", initData)
    console.log("Action Message:", JSON.stringify(actionMsg, null, 2))

    const handle = await AoLoader(wasm, options)
    const env = {
        Process: {
            Id: 'AOS',
            Owner: 'FOOBAR',
            Tags: [
                { name: 'Name', value: 'DAO Token' }
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
            { name: 'Action', value: 'Init' }
        ],
        Data: initData
    }

    console.log("Sending init message...")
    const { Memory } = await handle(null, initMsg, env)
    console.log("Init complete. Sending action message...")
    const result = await handle(Memory, actionMsg, env)
    console.log("Action complete. Raw output:", result.Output)
    const parsedResult = parseOutput(result.Output)
    console.log("Parsed result:", JSON.stringify(parsedResult, null, 2))
    return parsedResult
}

test('DAO Token Voting Mechanism', async (t) => {
    await t.test('Request Add Member (Member)', async () => {
        console.log("\n=== Test: Request Add Member (Member) ===")
        const initData = 'hello'
        const actionMsg = {
            From: 'AOS',
            Target: 'AOS',
            Owner: 'AOS',
            Id: 'request123',
            Tags: [
                { name: 'Action', value: 'RequestAddMember' },
                { name: 'Member_To_Add', value: 'NEW_MEMBER' }
            ],
            Data: 'hello'
        }
        const result = await initAndPerformAction(initData, actionMsg)
        console.log("Assertion: action should be 'RequestSubmitted'")
        assert.equal(result.action, 'RequestSubmitted')
        console.log("Assertion: data should contain success message")
        assert.equal(result.data.message, 'Request to add new member submitted successfully')
        console.log("Test completed successfully")
    })

    await t.test('Request Add Member (Non-Member)', async () => {
        console.log("\n=== Test: Request Add Member (Non-Member) ===")
        const initData = 'hi'
        const actionMsg = {
            From: 'NOT A MEMBER',
            Target: 'AOS',
            Owner: 'NOT A MEMBER',
            Id: 'BAD_REQUEST',
            Tags: [
                { name: 'Action', value: 'RequestAddMember' },
                { name: 'Member_To_Add', value: 'ANOTHER_NEW_MEMBER' }
            ],
            Data: 'hello'
        }
        const result = await initAndPerformAction(initData, actionMsg)
        console.log("Assertion: action should be 'Error'")
        assert.equal(result.action, 'Error')
        console.log("Assertion: data should contain unauthorized message")
        assert.equal(result.data, 'Unauthorized: Only members can request to add new members')
        console.log("Test completed successfully")
    })

    await t.test('Reqeust Check', async () => {
        console.log("\n=== Test: Vote on Request (Member) ===")
        
        const handle = await AoLoader(wasm, options)
        const env = {
            Process: {
                Id: 'AOS',
                Owner: 'FOOBAR',
                Tags: [
                    { name: 'Name', value: 'DAO Token' }
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
                { name: 'Action', value: 'Init' }
            ],
            Data: 'hello'
        }

        console.log("Sending init message...")
        const { Memory } = await handle(null, initMsg, env)

        const setUpMsg = {
            From: 'AOS',
            Target: 'AOS',
            Owner: 'AOS',
            Id: 'request123',
            Tags: [
                { name: 'Action', value: 'RequestAddMember' },
                { name: 'Member_To_Add', value: 'NEW_MEMBER' }
            ],
            Data: 'hello'
        }

        const result2 = await handle(Memory, setUpMsg, env)
        console.log("Result2: ", result2.Output)

        const actionMsg = {
            From: 'AOS',
            Target: 'AOS',
            Owner: 'AOS',
            Tags: [
                { name: 'Action', value: 'GetAddRequests' },
            ],
            Data: 'hello'
        }

        const result3 = await handle(result2.Memory, actionMsg, env)
        console.log("Result3: ", result3.Output)
        assert.equal(parseOutput(result3.Output).action,"AddRequestsList")
    })

    // await t.test('Vote on Request (Non-Member)', async () => {
    //     console.log("\n=== Test: Vote on Request (Non-Member) ===")
    //     const initData = 'Send({Target = ao.id, Action = "RequestAddMember", Member_To_Add = "NEW_MEMBER"})'
    //     const actionMsg = {
    //         From: 'NOT A MEMBER',
    //         Target: 'AOS',
    //         Owner: 'NOT A MEMBER',
    //         Tags: [
    //             { name: 'Action', value: 'VoteOnRequest' },
    //             { name: 'RequestId', value: 'init123' },
    //             { name: 'Vote', value: 'yes' }
    //         ],
    //         Data: 'hello'
    //     }
    //     const result = await initAndPerformAction(initData, actionMsg)
    //     console.log("Assertion: action should be 'Error'")
    //     assert.equal(result.action, 'Error')
    //     console.log("Assertion: data should contain error message")
    //     assert.equal(result.data, 'You must have a positive balance to vote')
    //     console.log("Test completed successfully")
    // })

    // await t.test('Get Add Requests (Member)', async () => {
    //     console.log("\n=== Test: Get Add Requests (Member) ===")
    //     const initData = 'Send({Target = ao.id, Action = "RequestAddMember", Member_To_Add = "NEW_MEMBER"})'
    //     const actionMsg = {
    //         From: 'AOS',
    //         Target: 'AOS',
    //         Owner: 'AOS',
    //         Tags: [
    //             { name: 'Action', value: 'GetAddRequests' }
    //         ],
    //         Data: 'hello'
    //     }
    //     const result = await initAndPerformAction(initData, actionMsg)
    //     console.log("Assertion: action should be 'AddRequestsList'")
    //     assert.equal(result.action, 'AddRequestsList')
    //     console.log("Assertion: data should be a valid JSON")
    //     assert.doesNotThrow(() => JSON.parse(JSON.stringify(result.data)))
    //     console.log("Current add requests:", JSON.stringify(result.data, null, 2))
    //     console.log("Test completed successfully")
    // })

    // await t.test('Get Add Requests (Non-Member)', async () => {
    //     console.log("\n=== Test: Get Add Requests (Non-Member) ===")
    //     const initData = 'Send({Target = ao.id, Action = "RequestAddMember", Member_To_Add = "NEW_MEMBER"})'
    //     const actionMsg = {
    //         From: 'NOT A MEMBER',
    //         Target: 'AOS',
    //         Owner: 'NOT A MEMBER',
    //         Tags: [
    //             { name: 'Action', value: 'GetAddRequests' }
    //         ],
    //         Data: 'hello'
    //     }
    //     const result = await initAndPerformAction(initData, actionMsg)
    //     console.log("Assertion: action should be 'Error'")
    //     assert.equal(result.action, 'Error')
    //     console.log("Assertion: data should contain unauthorized message")
    //     assert.equal(result.data, 'Unauthorized: Only members can view add requests')
    //     console.log("Test completed successfully")
    // })

    console.log("\n=== All tests completed ===")
})