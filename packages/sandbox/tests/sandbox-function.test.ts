/* eslint-disable no-console */
import {describe, it, expect, beforeAll, afterAll} from 'vitest'
import {SandboxManager} from '../src/sandbox-manager'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('SandboxManager Function Execution Test', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    await fs.mkdir(testTmpDir, {recursive: true})
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      console.log('[FUNCTION TEST]', ...args)
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
      await fs.rm(testTmpDir, {recursive: true, force: true})
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should execute a function with input and return parsed result', async () => {
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
      links: {text: string; href: string}[]
    }
    expect(result).toBeDefined()
    expect(result.title).toBe('Test Page')
    expect(result.url).toBe('https://test.com/page')
    expect(result.headings).toEqual(['Main Heading', 'Sub Heading'])
    expect(result.links).toEqual([
      {text: 'Example Link', href: 'https://example.com'},
      {text: 'Local Link', href: '/local'}
    ])
  }, 30000)

  it('should handle functions that return null', async () => {
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

    const inputData = {returnNull: true}
    const executionResult = await sandboxManager?.executeFunctionBuffered(
      code,
      [JSON.stringify(inputData)],
      false
    )

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBe(true)
    expect(executionResult!.result).toBe(null)
  }, 15000)

  it('should handle functions that return complex objects', async () => {
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

    const inputData = {test: 'complex object test'}
    const executionResult = await sandboxManager?.executeFunctionBuffered(
      code,
      [JSON.stringify(inputData)],
      false
    )

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBe(true)

    const result = executionResult!.result as {
      input: {test: string}
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
    expect(result.input).toEqual(inputData)
    expect(result.meta.processed).toBe(true)
    expect(result.meta.array).toEqual([1, 2, 3, 'test'])
    expect(result.meta.nested.level1.level2.value).toBe('deep value')
  }, 15000)
})
