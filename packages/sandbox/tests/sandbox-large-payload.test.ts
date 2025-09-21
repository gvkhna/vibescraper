import debug from 'debug'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SandboxManager } from '../src/sandbox-manager'
const log = debug('test')

describe('sandboxManager Large Payload Test', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    await fs.mkdir(testTmpDir, { recursive: true })
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      log('[LARGE PAYLOAD TEST]', ...args)
    })
    // Wait for sandbox to be ready before running tests
    await sandboxManager.waitForReady()
  })

  afterAll(async () => {
    // Cleanup like other tests do
    try {
      await fs.rm(testTmpDir, { recursive: true, force: true })
    } catch (e) {
      log('Failed to cleanup test tmp directory:', e)
    }
  })

  it('should handle large payloads with multiple arguments', async () => {
    expect.assertions(2)

    // Create test data: one large string to trigger file IPC, plus other args
    const largeString = 'x'.repeat(10000) // 10KB - exceeds 8KB threshold
    const secondArg = { test: 'object', value: 42 }
    const thirdArg = [1, 2, 3, 'test']

    log('Test inputs:')
    log('  - Arg 1: Large string, length:', largeString.length)
    log('  - Arg 2: Object:', JSON.stringify(secondArg))
    log('  - Arg 3: Array:', JSON.stringify(thirdArg))

    // Simple function that returns all arguments back
    const code = `
      export default async function testFunction(large, obj, arr) {
        console.log('Function received:')
        console.log('  - Arg 1 length:', large.length)
        console.log('  - Arg 2:', JSON.stringify(obj))
        console.log('  - Arg 3:', JSON.stringify(arr))
        return {
          firstArg: large,
          secondArg: obj,
          thirdArg: arr
        }
      }
    `

    const executionResult = await sandboxManager!.executeFunctionBuffered(
      code,
      [largeString, secondArg, thirdArg],
      false
    )

    // Simple expectations: we got back what we sent
    expect(executionResult).toBeDefined()

    const result = executionResult.result as any

    log('Test outputs:')
    log('  - Result exists:', result !== undefined)
    log('  - Arg 1 returned, length:', result?.firstArg?.length)
    log('  - Arg 2 returned:', JSON.stringify(result?.secondArg))
    log('  - Arg 3 returned:', JSON.stringify(result?.thirdArg))
    log('  - Large payload round-trip successful:', result?.firstArg === largeString)

    expect(result).toStrictEqual({
      firstArg: largeString,
      secondArg: secondArg,
      thirdArg: thirdArg
    })
  }, 7500)
})
