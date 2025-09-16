/* eslint-disable no-console */
import {describe, it, expect, beforeAll, afterAll} from 'vitest'
import {SandboxManager} from '../src/sandbox-manager'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('SandboxManager Logging Tests', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    await fs.mkdir(testTmpDir, {recursive: true})
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      console.log('[LOGGING TEST]', ...args)
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

  it('should capture all console log types (log, error, warn, info, debug)', async () => {
    const code = `
      export default function(input) {
        console.log('This is a console.log message')
        console.error('This is a console.error message')
        console.warn('This is a console.warn message')
        console.info('This is a console.info message')
        console.debug('This is a console.debug message')

        return { success: true, processedInput: JSON.parse(input) }
      }
    `

    const input = JSON.stringify({test: 'logging data'})
    const executionResult = await sandboxManager?.executeFunctionBuffered(code, [input], false)

    expect(executionResult).toBeDefined()
    expect('result' in executionResult!).toBe(true)
    expect(executionResult?.result).toEqual({
      success: true,
      processedInput: {test: 'logging data'}
    })

    // Check that we captured all log messages
    const logMessages = executionResult!.messages.filter((msg) => msg.type === 'log')
    expect(logMessages.length).toBeGreaterThanOrEqual(5)

    // Check for each type of log message
    const logs = logMessages.map((msg) => ({kind: msg.kind, log: msg.log}))
    expect(logs).toContainEqual({kind: 'log', log: 'This is a console.log message'})
    expect(logs).toContainEqual({kind: 'error', log: 'This is a console.error message'})
    expect(logs).toContainEqual({kind: 'warn', log: 'This is a console.warn message'})
    expect(logs).toContainEqual({kind: 'info', log: 'This is a console.info message'})
    expect(logs).toContainEqual({kind: 'debug', log: 'This is a console.debug message'})
  }, 15000)

  it('should preserve exact line numbers in syntax errors as if running at CLI', async () => {
    // Code with deliberate syntax error on line 7
    const code = `
export default function(input) {
  console.log('Function starting...')
  const data = JSON.parse(input)
  console.log('Input parsed successfully')

  const malformed = { key: 'unclosed string

  return { data }
}
    `

    const input = JSON.stringify({test: 'syntax error test'})
    const executionResult = await sandboxManager?.executeFunctionBuffered(code, [input], false)

    expect(executionResult).toBeDefined()

    // Should have no result due to syntax error
    expect('result' in executionResult!).toBe(false)

    // Should have exception messages with line numbers
    const exceptionMessages = executionResult!.messages.filter((msg) => msg.type === 'exception')
    expect(exceptionMessages.length).toBeGreaterThan(0)

    // Check that exact line number (9) is preserved in the exception
    const exception = exceptionMessages[0].exception
    const exceptionText = typeof exception === 'string' ? exception : exception.stack || exception.message
    console.log('Syntax error exception text:', exceptionText)

    // Should contain line 9 reference (where the parser detects the syntax error)
    expect(exceptionText).toMatch(/line.*9|:9:/)
  }, 15000)

  it('should preserve exact line numbers in runtime errors with stack trace', async () => {
    // Code that will throw a runtime error on a specific line
    const code = `
export default function(input) {
  console.log('Function execution starting')
  const data = JSON.parse(input)
  console.log('Input successfully parsed:', data)

  // This will cause a runtime error on line 8
  const nullValue = null
  const errorHere = nullValue.nonExistentProperty.access

  return { success: true, data }
}
    `

    const input = JSON.stringify({test: 'runtime error test'})
    const executionResult = await sandboxManager?.executeFunctionBuffered(code, [input], false)

    expect(executionResult).toBeDefined()

    // Should have no result due to runtime error
    expect('result' in executionResult!).toBe(false)

    // Should have exception messages
    const exceptionMessages = executionResult!.messages.filter((msg) => msg.type === 'exception')
    expect(exceptionMessages.length).toBeGreaterThan(0)

    // Check that exact line number (9) is preserved in stack trace
    const exception = exceptionMessages[0].exception
    const exceptionText = typeof exception === 'string' ? exception : exception.stack || exception.message
    console.log('Runtime error exception text:', exceptionText)

    // Should contain line 9 reference (where the null access error occurs)
    expect(exceptionText).toMatch(/line.*9|:9:/)

    // Should also contain stack trace information
    expect(exceptionText.toLowerCase()).toMatch(/error|null|property/)
  }, 15000)

  it('should handle successful execution with logging mixed in', async () => {
    // Code that successfully executes but has various log statements throughout
    const code = `
export default function(input) {
  console.log('=== Function Start ===')

  try {
    const parsedInput = JSON.parse(input)
    console.info('Successfully parsed input:', Object.keys(parsedInput))

    if (parsedInput.shouldWarn) {
      console.warn('Warning: shouldWarn flag is set')
    }

    if (parsedInput.debugMode) {
      console.debug('Debug mode is active')
    }

    const result = {
      status: 'success',
      inputKeys: Object.keys(parsedInput),
      timestamp: Date.now()
    }

    console.log('=== Function Complete ===')
    return result

  } catch (error) {
    console.error('Parsing failed:', error.message)
    return { status: 'error', message: error.message }
  }
}
    `

    const input = JSON.stringify({
      shouldWarn: true,
      debugMode: true,
      data: 'test content'
    })

    const executionResult = await sandboxManager?.executeFunctionBuffered(code, [input], false)

    expect(executionResult).toBeDefined()

    // Should have successful result
    expect('result' in executionResult!).toBe(true)
    const result = executionResult!.result as any
    expect(result.status).toBe('success')
    expect(result.inputKeys).toEqual(['shouldWarn', 'debugMode', 'data'])

    // Should have captured all the log messages
    const logMessages = executionResult!.messages.filter((msg) => msg.type === 'log')
    expect(logMessages.length).toBeGreaterThanOrEqual(5)

    // Verify specific log messages were captured
    const logs = logMessages.map((msg) => ({kind: msg.kind, log: msg.log}))
    expect(logs.some((l) => l.log.includes('=== Function Start ==='))).toBe(true)
    expect(logs.some((l) => l.log.includes('=== Function Complete ==='))).toBe(true)
    expect(logs.some((l) => l.kind === 'warn' && l.log.includes('Warning: shouldWarn'))).toBe(true)
    expect(logs.some((l) => l.kind === 'debug' && l.log.includes('Debug mode'))).toBe(true)
    expect(logs.some((l) => l.kind === 'info' && l.log.includes('Successfully parsed input'))).toBe(true)
  }, 15000)
})
