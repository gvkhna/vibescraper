/* eslint-disable no-console */
import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest'
import {SandboxManager} from '../src/sandbox-manager'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('SandboxManager', () => {
  let sandboxManager: SandboxManager
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeAll(async () => {
    // Ensure tmp directory exists
    await fs.mkdir(testTmpDir, {recursive: true})

    // Create sandbox manager with a simple logger
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      // console.log('[TEST]', ...args)
    })
    // Wait for sandbox to be ready before running tests
    await sandboxManager.waitForReady()
  })

  afterAll(() => {
    // Clean up if needed
    // The sandbox manager will clean up its own files
  })

  it('should execute simple console.log code', async () => {
    const code = `console.log('Hello from sandbox!')`
    const messages = await sandboxManager.executeCodeBuffered(code, false)

    // Check that we got messages
    expect(messages).toBeDefined()
    expect(Array.isArray(messages)).toBe(true)
    expect(messages.length).toBeGreaterThan(0)

    // Find the log message
    const logMessage = messages.find((msg) => msg.type === 'log')
    expect(logMessage).toBeDefined()
    if (logMessage) {
      expect(logMessage.log).toBe('Hello from sandbox!')
    }

    // Check for completion status
    const statusMessage = messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    expect(statusMessage).toBeDefined()
  }, 10000) // 10 second timeout

  it('should execute code with multiple console logs', async () => {
    const code = `
      console.log('First message')
      console.log('Second message')
      console.log('Third message')
    `
    const messages = await sandboxManager.executeCodeBuffered(code, false)

    // Filter log messages
    const logMessages = messages.filter((msg) => msg.type === 'log')
    expect(logMessages.length).toBe(3)

    // Check the content
    expect(logMessages[0].log).toBe('First message')
    expect(logMessages[1].log).toBe('Second message')
    expect(logMessages[2].log).toBe('Third message')
  }, 10000)

  it('should handle async code execution', async () => {
    const code = `
      console.log('Starting async operation')
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Async operation completed')
    `
    const messages = await sandboxManager.executeCodeBuffered(code, false)

    const logMessages = messages.filter((msg) => msg.type === 'log')
    expect(logMessages.length).toBe(2)

    expect(logMessages[0].log).toBe('Starting async operation')
    expect(logMessages[1].log).toBe('Async operation completed')

    // Check completion
    const statusMessage = messages.find((msg) => msg.type === 'status' && msg.status === 'completed')
    expect(statusMessage).toBeDefined()
  }, 10000)

  it('should handle errors in code execution', async () => {
    const code = `
      console.log('Before error')
      throw new Error('Test error')
      console.log('After error - should not appear')
    `
    const messages = await sandboxManager.executeCodeBuffered(code, false)

    // Should have the first log
    const logMessages = messages.filter((msg) => msg.type === 'log')
    expect(logMessages.length).toBe(1)

    expect(logMessages[0].log).toBe('Before error')

    // Should have an exception message
    const exceptionMessage = messages.find((msg) => msg.type === 'exception')
    expect(exceptionMessage).toBeDefined()
    if (exceptionMessage) {
      const exception = exceptionMessage.exception
      if (typeof exception === 'object' && 'message' in exception) {
        expect(exception.message).toContain('Test error')
      }
    }
  }, 10000)

  it('should execute test code when testing flag is true', async () => {
    const code = `
      test('simple test', () => {
        expect(1 + 1).toBe(2)
      })

      test('another test', () => {
        expect('hello').toBe('hello')
      })
    `
    const messages = await sandboxManager.executeCodeBuffered(code, true)

    // Find test messages
    const testMessages = messages.filter((msg) => msg.type === 'test')
    expect(testMessages.length).toBeGreaterThan(0)

    // Check for passed tests
    const passedTests = testMessages.filter((msg) => msg.status === 'passed')
    expect(passedTests.length).toBe(2)

    // Check test names
    const testNames = testMessages.filter((msg) => msg.status === 'passed').map((msg) => msg.name)
    expect(testNames).toContain('simple test')
    expect(testNames).toContain('another test')
  }, 15000)

  it('should handle different console methods', async () => {
    const code = `
      console.log('log message')
      console.info('info message')
      console.warn('warn message')
      console.error('error message')
    `
    const messages = await sandboxManager.executeCodeBuffered(code, false)

    // Check different kinds of log messages
    const logMessage = messages.find((msg) => msg.type === 'log' && msg.kind === 'log')
    const infoMessage = messages.find((msg) => msg.type === 'log' && msg.kind === 'info')
    const warnMessage = messages.find((msg) => msg.type === 'log' && msg.kind === 'warn')
    const errorMessage = messages.find((msg) => msg.type === 'log' && msg.kind === 'error')

    expect(logMessage).toBeDefined()
    expect(infoMessage).toBeDefined()
    expect(warnMessage).toBeDefined()
    expect(errorMessage).toBeDefined()

    if (logMessage?.type === 'log') {
      expect(logMessage.log).toBe('log message')
    }
    if (infoMessage?.type === 'log') {
      expect(infoMessage.log).toBe('info message')
    }
    if (warnMessage?.type === 'log') {
      expect(warnMessage.log).toBe('warn message')
    }
    if (errorMessage?.type === 'log') {
      expect(errorMessage.log).toBe('error message')
    }
  }, 10000)
})
