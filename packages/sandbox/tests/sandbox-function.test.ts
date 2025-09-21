import debug from 'debug'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SandboxManager } from '../src/sandbox-manager'
const log = debug('test')

describe('sandboxManager Function Execution Test', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    await fs.mkdir(testTmpDir, { recursive: true })
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      log('[FUNCTION TEST]', ...args)
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

  it('should handle functions that return empty values', async () => {
    expect.assertions(5)

    const code = `
      export default async function main() {
        return []
      }
    `
    const executionResult = await sandboxManager?.executeFunctionBuffered(code, [], false)

    log('execution result', executionResult)
    const completed = executionResult?.messages.find(
      (msg) => msg.type === 'status' && msg.status === 'completed'
    )

    const resultMessage = executionResult?.messages.find((msg) => msg.type === 'result')
    // console.log('exception', exception)

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBeDefined()
    expect(completed).toBeDefined()
    expect(resultMessage).toBeDefined()
    expect(executionResult?.result).toStrictEqual([])
  })

  it('should handle functions that return nothing', async () => {
    expect.assertions(5)

    const code = `
      export default async function main() {
      }
    `
    const executionResult = await sandboxManager?.executeFunctionBuffered(code, [], false)

    log('execution result', executionResult)
    const completed = executionResult?.messages.find(
      (msg) => msg.type === 'status' && msg.status === 'completed'
    )

    const resultMessage = executionResult?.messages.find((msg) => msg.type === 'result')
    // console.log('exception', exception)

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBeDefined()
    expect(completed).toBeDefined()
    expect(resultMessage).toBeDefined()
    expect(resultMessage?.result).toBeUndefined()
  })

  it('should execute a function with input and return parsed result', async () => {
    expect.assertions(7)

    const code = `
      import * as cheerio from 'cheerio'

      export default function(input) {
        const data = JSON.parse(input)
        const $ = cheerio.load(data.html)

        const result = {
          title: $('title').text(),
          headings: $('h1, h2, h3').map((i, el) => $(el).text()).get(),
          links: $('a').map((i, el) => ({
            text: $(el).text(),
            href: $(el).attr('href')
          })).get(),
          url: data.url
        }

        return result
      }
    `

    const inputData = {
      html: `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Main Heading</h1>
            <h2>Sub Heading</h2>
            <p>Some content</p>
            <a href="https://example.com">Example Link</a>
            <a href="/local">Local Link</a>
          </body>
        </html>
      `,
      url: 'https://test.com/page'
    }

    const executionResult = await sandboxManager?.executeFunctionBuffered(
      code,
      [JSON.stringify(inputData)],
      false
    )

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBe(true)

    const result = executionResult!.result as {
      title: string
      url: string
      headings: string[]
      links: { text: string; href: string }[]
    }

    expect(result).toBeDefined()
    expect(result.title).toBe('Test Page')
    expect(result.url).toBe('https://test.com/page')
    expect(result.headings).toStrictEqual(['Main Heading', 'Sub Heading'])
    expect(result.links).toStrictEqual([
      { text: 'Example Link', href: 'https://example.com' },
      { text: 'Local Link', href: '/local' }
    ])
  }, 30000)

  it('should handle functions that return null', async () => {
    expect.assertions(3)

    const code = `
      export default function(input) {
        const data = JSON.parse(input)

        // Deliberately return null
        if (data.returnNull) {
          return null
        }

        return { processed: true, input: data }
      }
    `

    const inputData = { returnNull: true }
    const executionResult = await sandboxManager?.executeFunctionBuffered(
      code,
      [JSON.stringify(inputData)],
      false
    )

    log('executionResult', executionResult)

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBe(true)
    expect(executionResult!.result).toBeNull()
  }, 15000)

  it('should handle functions that return complex objects', async () => {
    expect.assertions(6)

    const code = `
      export default function(input) {
        const data = JSON.parse(input)

        return {
          input: data,
          meta: {
            processed: true,
            timestamp: Date.now(),
            array: [1, 2, 3, 'test'],
            nested: {
              level1: {
                level2: {
                  value: 'deep value'
                }
              }
            }
          }
        }
      }
    `

    const inputData = { test: 'complex object test' }
    const executionResult = await sandboxManager?.executeFunctionBuffered(
      code,
      [JSON.stringify(inputData)],
      false
    )

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBe(true)

    const result = executionResult!.result as {
      input: { test: string }
      meta: {
        processed: boolean
        timestamp: number
        array: (number | string)[]
        nested: {
          level1: {
            level2: {
              value: string
            }
          }
        }
      }
    }

    expect(result.input).toStrictEqual(inputData)
    expect(result.meta.processed).toBe(true)
    expect(result.meta.array).toStrictEqual([1, 2, 3, 'test'])
    expect(result.meta.nested.level1.level2.value).toBe('deep value')
  }, 15000)
})
