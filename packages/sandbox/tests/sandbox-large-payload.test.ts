/* eslint-disable no-console */
import {describe, it, expect, beforeAll, afterAll} from 'vitest'
import {SandboxManager} from '../src/sandbox-manager'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'
import {execSync} from 'node:child_process'

// Check if Deno is available before running tests
function isDenoAvailable(): boolean {
  try {
    execSync('deno --version', {encoding: 'utf8'})
    return true
  } catch {
    return false
  }
}

describe('SandboxManager Large Payload Test', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')
  const denoAvailable = isDenoAvailable()

  beforeAll(async () => {
    if (!denoAvailable) {
      console.warn('⚠️  Deno is not installed. Skipping sandbox large payload test.')
      return
    }

    await fs.mkdir(testTmpDir, {recursive: true})
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      console.log('[LARGE PAYLOAD TEST]', ...args)
    })
    // Wait for sandbox to be ready before running tests
    await sandboxManager.waitForReady()
  })

  afterAll(async () => {
    // Cleanup like other tests do
    try {
      await fs.rm(testTmpDir, {recursive: true, force: true})
    } catch (e) {
      console.error('Failed to cleanup test tmp directory:', e)
    }
  })

  it('should handle large payloads with multiple arguments', async () => {
    if (!denoAvailable || !sandboxManager) {
      console.log('Skipping test - Deno not available or sandbox not initialized')
      return
    }

    // Create test data: one large string to trigger file IPC, plus other args
    const largeString = 'x'.repeat(10000) // 10KB - exceeds 8KB threshold
    const secondArg = {test: 'object', value: 42}
    const thirdArg = [1, 2, 3, 'test']

    console.log('Test inputs:')
    console.log('  - Arg 1: Large string, length:', largeString.length)
    console.log('  - Arg 2: Object:', JSON.stringify(secondArg))
    console.log('  - Arg 3: Array:', JSON.stringify(thirdArg))

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

    const executionResult = await sandboxManager.executeFunctionBuffered(
      code,
      [largeString, secondArg, thirdArg],
      false
    )

    // Simple expectations: we got back what we sent
    expect(executionResult).toBeDefined()

    const result = executionResult.result as any

    console.log('Test outputs:')
    console.log('  - Result exists:', result !== undefined)
    console.log('  - Arg 1 returned, length:', result?.firstArg?.length)
    console.log('  - Arg 2 returned:', JSON.stringify(result?.secondArg))
    console.log('  - Arg 3 returned:', JSON.stringify(result?.thirdArg))
    console.log('  - Large payload round-trip successful:', result?.firstArg === largeString)

    expect(result).toEqual({
      firstArg: largeString,
      secondArg: secondArg,
      thirdArg: thirdArg
    })
  }, 7500)
})
