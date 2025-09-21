import debug from 'debug'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SandboxManager } from '../src/sandbox-manager'
const log = debug('test')

describe('sandboxManager Cheerio Test', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    await fs.mkdir(testTmpDir, { recursive: true })
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      log('[CHEERIO TEST]', ...args)
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

  it('should import and use cheerio successfully', async () => {
    expect.assertions(3)

    const code = `
      import * as cheerio from 'cheerio'

      const html = '<div class="test">Hello World</div>'
      const $ = cheerio.load(html)

      console.log('CHEERIO_LOADED:', typeof cheerio.load === 'function')
      console.log('CHEERIO_TEXT:', $('.test').text())
    `

    const result = await sandboxManager?.executeCodeBuffered(code, false)
    const logs = result?.filter((msg) => msg.type === 'log') ?? []

    expect(logs.some((msg) => msg.log.includes('CHEERIO_LOADED: true'))).toBe(true)
    expect(logs.some((msg) => msg.log.includes('CHEERIO_TEXT: Hello World'))).toBe(true)

    const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
  }, 30000)
})
