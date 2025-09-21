import debug from 'debug'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SandboxManager } from '../src/sandbox-manager'
const log = debug('test')

describe('sandboxManager Edge Case Returns', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    await fs.mkdir(testTmpDir, { recursive: true })
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      log('[EDGE CASE TEST]', ...args)
    })
    // Wait for sandbox to be ready before running tests
    await sandboxManager.waitForReady()
  })

  afterAll(async () => {
    // Clean up
    if (sandboxManager) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    try {
      await fs.rm(testTmpDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should handle BigInt return', async () => {
    expect.assertions(2)

    const code = `
      export default async function () {
        return 1234567890123456789012345678901234567890n
      }
    `
    const result = await sandboxManager?.executeFunctionBuffered(code, [])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    log('result', result)
    log('exception', exception)

    expect(status).toBeDefined()
    expect(exception).toBeDefined()
  }, 30000)

  it('should handle exception return', async () => {
    expect.assertions(2)

    const code = `
      export default async function () {
        throw new Error('function failed to run')
      }
    `
    const result = await sandboxManager?.executeFunctionBuffered(code, [])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    log('result', result)
    log('exception', exception)

    expect(status).toBeDefined()
    expect(exception).toBeDefined()
  }, 30000)

  it('should handle Function return', async () => {
    expect.assertions(1)

    // TODO: Currently this seems to cause result to be undefined
    // the function is silently being dropped
    // better handle this scenario perhaps with a more appropriate error
    const code = `
      export default async function () {
        return function testFn() { return "hello" }
      }
    `
    const result = await sandboxManager?.executeFunctionBuffered(code, [])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    log('result', result)
    log('exception', exception)

    expect(status).toBeDefined()
  }, 30000)

  it('should handle Symbol return', async () => {
    expect.assertions(1)

    const code = `
      export default async function () {
        return Symbol('edge')
      }
    `
    const result = await sandboxManager?.executeFunctionBuffered(code, [])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    log('result', result)

    expect(status).toBeDefined()
  }, 30000)

  it('should handle Circular object return', async () => {
    expect.assertions(2)

    const code = `
      export default async function () {
        const obj = { foo: "bar" }
        obj.self = obj // circular reference
        return obj
      }
    `
    const result = await sandboxManager?.executeFunctionBuffered(code, [])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    log('result', result)
    log('exception', exception)

    expect(status).toBeDefined()
    expect(exception).toBeDefined()
  }, 30000)

  it('should handle Class instance return', async () => {
    expect.assertions(1)

    const code = `
    export default async function () {
      class Weird {
        constructor() {
          this.x = 42
        }
        get tricky() {
          // Simulate an unexpected runtime error when accessed
          throw new Error("getter explosion")
        }
        toString() {
          return "[Weird instance]"
        }
      }
      return new Weird()
    }
  `
    const result = await sandboxManager?.executeFunctionBuffered(code, [])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    log('result', result)

    expect(status).toBeDefined()
  })
})
