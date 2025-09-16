/* eslint-disable no-console */
import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {SandboxManager} from '../src/sandbox-manager'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('SandboxManager Crash Recovery Tests', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')

  beforeEach(async () => {
    await fs.mkdir(testTmpDir, {recursive: true})
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      console.log('[RECOVERY TEST]', ...args)
    })
    // Wait for sandbox to be ready before running tests
    await sandboxManager.waitForReady()
  })

  afterEach(async () => {
    // Clean up the sandbox manager
    if (sandboxManager) {
      // Give time for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    // Clean up temp directory
    try {
      await fs.rm(testTmpDir, {recursive: true, force: true})
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should recover after timeout and allow subsequent executions', async () => {
    // First, cause a timeout with an infinite loop
    const infiniteLoopCode = `
      console.log('STARTING_INFINITE_LOOP')
      let i = 0
      while (true) {
        i++
        if (i % 1000000000 === 0) {
          console.log('LOOP_ITERATION:', i / 1000000000)
        }
      }
      console.log('SHOULD_NOT_REACH')
    `

    const messages1 = await sandboxManager?.executeCodeBuffered(infiniteLoopCode, false)

    // Check that we got the starting log and timeout status
    const startLog = messages1?.find(
      (msg) => msg.type === 'log' && msg.log.includes('STARTING_INFINITE_LOOP')
    )
    const shouldNotReach = messages1?.find(
      (msg) => msg.type === 'log' && msg.log.includes('SHOULD_NOT_REACH')
    )
    const timeoutStatus = messages1?.find((msg) => msg.type === 'status' && msg.status === 'timeout')

    expect(startLog).toBeDefined()
    expect(shouldNotReach).toBeUndefined()
    expect(timeoutStatus).toBeDefined()

    // Wait a bit for the worker to restart
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Now test that the sandbox can execute code again after recovery
    const simpleCode = `
      console.log('WORKER_RECOVERED: true')
      console.log('SIMPLE_MATH:', 2 + 2)
    `

    const messages2 = await sandboxManager?.executeCodeBuffered(simpleCode)
    const recoveryLog = messages2?.find(
      (msg) => msg.type === 'log' && msg.log.includes('WORKER_RECOVERED: true')
    )
    const mathLog = messages2?.find((msg) => msg.type === 'log' && msg.log.includes('SIMPLE_MATH: 4'))
    const completedStatus = messages2?.find((msg) => msg.type === 'status' && msg.status === 'completed')

    expect(recoveryLog).toBeDefined()
    expect(mathLog).toBeDefined()
    expect(completedStatus).toBeDefined()
  }, 45000) // 45 second timeout for the entire test

  it('should recover after memory exhaustion and allow subsequent executions', async () => {
    // First, try to exhaust memory
    const memoryExhaustCode = `
      console.log('STARTING_MEMORY_EXHAUSTION')
      try {
        const arrays = []
        const CHUNK = 50_000_000 // 50 million items per chunk

        // Try to allocate way more than 256MB limit
        for (let i = 0; i < 100; i++) {
          arrays.push(new Array(CHUNK).fill(i))
          if (i % 10 === 0) {
            console.log('ALLOCATED_CHUNKS:', i)
          }
        }

        console.log('MEMORY_EXHAUSTION_COMPLETE:', arrays.length)
      } catch (err) {
        console.log('MEMORY_ERROR:', err.message)
      }
    `

    const messages1 = await sandboxManager?.executeCodeBuffered(memoryExhaustCode)

    // Check that we started the memory exhaustion
    const startLog = messages1?.find(
      (msg) => msg.type === 'log' && msg.log.includes('STARTING_MEMORY_EXHAUSTION')
    )
    expect(startLog).toBeDefined()

    // Should either get a memory error or complete/fail status
    const memoryError = messages1?.find((msg) => msg.type === 'log' && msg.log.includes('MEMORY_ERROR:'))
    const failStatus = messages1?.find(
      (msg) => msg.type === 'status' && (msg.status === 'failed' || msg.status === 'timeout')
    )
    const completeStatus = messages1?.find((msg) => msg.type === 'status' && msg.status === 'completed')

    // We expect some kind of termination
    expect(memoryError ?? failStatus ?? completeStatus).toBeDefined()

    // Wait a bit for the worker to restart if it crashed
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Now test that the sandbox can execute code again after recovery
    const simpleCode = `
      console.log('WORKER_RECOVERED_FROM_MEMORY: true')
      const smallArray = new Array(100).fill(42)
      console.log('SMALL_ARRAY_LENGTH:', smallArray.length)
    `

    const messages2 = await sandboxManager?.executeCodeBuffered(simpleCode, false)
    const recoveryLog = messages2?.find(
      (msg) => msg.type === 'log' && msg.log.includes('WORKER_RECOVERED_FROM_MEMORY: true')
    )
    const arrayLog = messages2?.find(
      (msg) => msg.type === 'log' && msg.log.includes('SMALL_ARRAY_LENGTH: 100')
    )
    const completedStatus2 = messages2?.find((msg) => msg.type === 'status' && msg.status === 'completed')

    expect(recoveryLog).toBeDefined()
    expect(arrayLog).toBeDefined()
    expect(completedStatus2).toBeDefined()
  }, 45000) // 45 second timeout for the entire test

  it('should handle uncaught exceptions and allow recovery', async () => {
    // First, cause an uncaught exception
    const exceptionCode = `
      console.log('BEFORE_EXCEPTION')
      throw new Error('Intentional uncaught exception for testing')
      console.log('AFTER_EXCEPTION')
    `

    const messages1 = await sandboxManager?.executeCodeBuffered(exceptionCode, false)

    // Check that we got the before log but not after
    const beforeLog = messages1?.find((msg) => msg.type === 'log' && msg.log.includes('BEFORE_EXCEPTION'))
    const afterLog = messages1?.find((msg) => msg.type === 'log' && msg.log.includes('AFTER_EXCEPTION'))
    const exceptionMsg = messages1?.find(
      (msg) =>
        msg.type === 'exception' && JSON.stringify(msg.exception).includes('Intentional uncaught exception')
    )

    expect(beforeLog).toBeDefined()
    expect(afterLog).toBeUndefined()
    expect(exceptionMsg).toBeDefined()

    // Wait a bit for recovery
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Now test that the sandbox can execute code again
    const simpleCode = `
      console.log('WORKER_RECOVERED_FROM_EXCEPTION: true')
      try {
        throw new Error('Caught error')
      } catch (e) {
        console.log('CAUGHT_ERROR:', e.message)
      }
    `

    const messages2 = await sandboxManager?.executeCodeBuffered(simpleCode, false)
    const recoveryLog = messages2?.find(
      (msg) => msg.type === 'log' && msg.log.includes('WORKER_RECOVERED_FROM_EXCEPTION: true')
    )
    const caughtLog = messages2?.find(
      (msg) => msg.type === 'log' && msg.log.includes('CAUGHT_ERROR: Caught error')
    )
    const completedStatus = messages2?.find((msg) => msg.type === 'status' && msg.status === 'completed')

    expect(recoveryLog).toBeDefined()
    expect(caughtLog).toBeDefined()
    expect(completedStatus).toBeDefined()
  }, 45000) // 45 second timeout for the entire test
})
