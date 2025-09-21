import { validateDataAgainstSchema, validatePrimaryKeyItemSchema } from '@vibescraper/json-schemas'
import { SandboxManager } from '@vibescraper/sandbox'
import debug from 'debug'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import type { JsonValue } from 'type-fest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import crawlerScript from './crawler.mjs?raw'
import extractorScript from './extractor.mjs?raw'
import page1Fixture from './fixtures/1758402723-page-1.clean.fixture?raw'
import page2Fixture from './fixtures/1758402723-page-2.clean.fixture?raw'
import page3Fixture from './fixtures/1758402723-page-3.clean.fixture?raw'
import page4Fixture from './fixtures/1758402723-page-4.clean.fixture?raw'
import page5Fixture from './fixtures/1758402723-page-5.clean.fixture?raw'
import schemaJson from './schema.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const log = debug('test')

describe('news.ycombinator.com', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    fs.mkdirSync(testTmpDir, { recursive: true })
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      log('yc', ...args)
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
      // await fs.rm(testTmpDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('valid schema passes all requirements', () => {
    const result = validatePrimaryKeyItemSchema(schemaJson)

    expect(result.success).toBe(true)
  })

  it('should extract first page', async () => {
    expect.assertions(4)

    const result = await sandboxManager?.executeFunctionBuffered(extractorScript, [page1Fixture, ''], false)
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []

    log('result', result)

    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    expect(result?.result).toBeDefined()

    let validData = false

    if (Array.isArray(result?.result)) {
      for (const data of result.result) {
        const valid = validateDataAgainstSchema(schemaJson, data as JsonValue)
        if (!valid.success) {
          validData = false
          log('validation error', valid.message)
          log('validation item', data)
          break
        }
        validData = true
      }
    }

    expect(Array.isArray(result?.result) && result.result.length === 30).toBe(true)
    expect(validData).toBe(true)
  }, 30000)

  it('should extract second page', async () => {
    expect.assertions(4)

    const result = await sandboxManager?.executeFunctionBuffered(extractorScript, [page2Fixture, ''], false)
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []

    log('result', result)

    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    expect(result?.result).toBeDefined()

    let validData = false

    if (Array.isArray(result?.result)) {
      for (const data of result.result) {
        const valid = validateDataAgainstSchema(schemaJson, data as JsonValue)
        if (!valid.success) {
          validData = false
          log('validation error', valid.message)
          log('validation item', data)
          break
        }
        validData = true
      }
    }

    expect(Array.isArray(result?.result) && result.result.length === 29).toBe(true)
    expect(validData).toBe(true)
  }, 30000)

  it('should crawl to initial page', async () => {
    expect.assertions(2)

    const result = await sandboxManager?.executeFunctionBuffered(crawlerScript, [])
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []

    log('result', result)

    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)

    expect(
      Array.isArray(result?.result) &&
        typeof result.result[0] === 'string' &&
        result.result[0] === 'https://news.ycombinator.com/'
    ).toBe(true)
  }, 30000)

  it('should crawl to second page from first page', async () => {
    expect.assertions(3)

    const result = await sandboxManager?.executeFunctionBuffered(crawlerScript, [page1Fixture])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []
    log('result', result)
    log('exception', exception)

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    expect(result?.result).toBeDefined()

    expect(
      Array.isArray(result?.result) &&
        typeof result.result[0] === 'string' &&
        result.result[0] === 'https://news.ycombinator.com/?p=2'
    ).toBe(true)
  })

  it('should crawl to third page from second page', async () => {
    expect.assertions(3)

    const result = await sandboxManager?.executeFunctionBuffered(crawlerScript, [page2Fixture])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []
    log('result', result)
    log('exception', exception)

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    expect(result?.result).toBeDefined()

    expect(
      Array.isArray(result?.result) &&
        typeof result.result[0] === 'string' &&
        result.result[0] === 'https://news.ycombinator.com/?p=3'
    ).toBe(true)
  })

  it('should crawl to fourth page from third page', async () => {
    expect.assertions(3)

    const result = await sandboxManager?.executeFunctionBuffered(crawlerScript, [page3Fixture])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []
    log('result', result)
    log('exception', exception)

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    expect(result?.result).toBeDefined()

    expect(
      Array.isArray(result?.result) &&
        typeof result.result[0] === 'string' &&
        result.result[0] === 'https://news.ycombinator.com/?p=4'
    ).toBe(true)
  })

  it('should crawl to fifth page from fourth page', async () => {
    expect.assertions(3)

    const result = await sandboxManager?.executeFunctionBuffered(crawlerScript, [page4Fixture])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []
    log('result', result)
    log('exception', exception)

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    expect(result?.result).toBeDefined()

    expect(
      Array.isArray(result?.result) &&
        typeof result.result[0] === 'string' &&
        result.result[0] === 'https://news.ycombinator.com/?p=5'
    ).toBe(true)
  })

  it('should stop crawling at fifth page', async () => {
    expect.assertions(3)

    const result = await sandboxManager?.executeFunctionBuffered(crawlerScript, [page5Fixture])
    const status = result?.messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    const exception = result?.messages.find((msg) => msg.type === 'exception')
    const logs = result?.messages.filter((msg) => msg.type === 'log') ?? []
    log('result', result)
    log('exception', exception)

    expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    expect(result?.result).toBeDefined()

    expect(result?.result).toStrictEqual([])
  })
})
