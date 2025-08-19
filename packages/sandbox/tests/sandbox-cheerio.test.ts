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

describe('SandboxManager Cheerio Test', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')
  const denoAvailable = isDenoAvailable()

  beforeAll(async () => {
    if (!denoAvailable) {
      console.warn('⚠️  Deno is not installed. Skipping sandbox cheerio test.')
      return
    }

    await fs.mkdir(testTmpDir, {recursive: true})
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      console.log('[CHEERIO TEST]', ...args)
    })

    // Give it time to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000))
  })

  afterAll(async () => {
    // Clean up
    if (sandboxManager) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    try {
      await fs.rm(testTmpDir, {recursive: true, force: true})
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should import and use cheerio successfully', async () => {
    if (!denoAvailable) {
      return
    }

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
