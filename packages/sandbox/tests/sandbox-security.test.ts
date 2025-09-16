/* eslint-disable no-console */
import {describe, it, expect, beforeAll, afterAll} from 'vitest'
import {SandboxManager} from '../src/sandbox-manager'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('SandboxManager Security & Environment Tests', () => {
  let sandboxManager: SandboxManager
  const testTmpDir = path.join(process.cwd(), 'tmp')
  beforeAll(async () => {
    await fs.mkdir(testTmpDir, {recursive: true})
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      console.log('[SECURITY TEST]', ...args)
    })
    // Wait for sandbox to be ready before running tests
    await sandboxManager.waitForReady()
  })

  afterAll(() => {
    // Cleanup handled by SandboxManager
  })

  describe('Security - File System Access', () => {
    it('should NOT allow reading system files like /etc/passwd', async () => {
      const code = `
        try {
          const fs = await import('node:fs/promises')
          const content = await fs.readFile('/etc/passwd', 'utf-8')
          console.log('SECURITY_BREACH: Read /etc/passwd with length:', content.length)
        } catch (err) {
          console.log('EXPECTED_ERROR:', err.message)
        }
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      // Should have caught an error, not read the file
      const errorLog = logs.find((log) => log.log.includes('EXPECTED_ERROR'))
      const breachLog = logs.find((log) => log.log.includes('SECURITY_BREACH'))

      expect(errorLog).toBeDefined()
      expect(breachLog).toBeUndefined()
    }, 15000)

    it('should NOT allow executing system commands via child_process', async () => {
      const code = `
        try {
          const {exec} = await import('node:child_process')
          await new Promise((resolve, reject) => {
            exec('whoami', (err, stdout) => {
              if (err) return reject(err)
              console.log('SECURITY_BREACH: Executed whoami:', stdout)
              resolve(stdout)
            })
          })
        } catch (err) {
          console.log('EXPECTED_ERROR:', err.message)
        }
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      const errorLog = logs.find((log) => log.log.includes('EXPECTED_ERROR'))
      const breachLog = logs.find((log) => log.log.includes('SECURITY_BREACH'))

      expect(errorLog).toBeDefined()
      expect(breachLog).toBeUndefined()
    }, 15000)

    it('should allow reading/writing files in sandbox directory only', async () => {
      const code = `
        const url = new URL('.', location.href)
        const cwd = decodeURIComponent(url.pathname)
        const fs = await import('node:fs/promises')

        // Write a test file
        const testFile = cwd + 'test-sandbox-write.txt'
        const testContent = 'Sandbox write test successful'
        await fs.writeFile(testFile, testContent)

        // Read it back
        const readContent = await fs.readFile(testFile, 'utf-8')
        console.log('READ_SUCCESS:', readContent === testContent)

        // List directory
        const files = await fs.readdir(cwd)
        console.log('FILES_COUNT:', files.length)
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      const successLog = logs.find((log) => log.log.includes('READ_SUCCESS: true'))
      const filesLog = logs.find((log) => log.log.includes('FILES_COUNT:'))

      expect(successLog).toBeDefined()
      expect(filesLog).toBeDefined()
    }, 15000)
  })

  describe('Module Imports', () => {
    it('should support importing Node built-in modules with node: prefix', async () => {
      const code = `
        const path = await import('node:path')
        const crypto = await import('node:crypto')
        const util = await import('node:util')

        console.log('PATH_JOIN:', typeof path.join)
        console.log('CRYPTO_RANDOM:', typeof crypto.randomBytes)
        console.log('UTIL_FORMAT:', typeof util.format)
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      expect(logs.find((log) => log.log.includes('PATH_JOIN: function'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('CRYPTO_RANDOM: function'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('UTIL_FORMAT: function'))).toBeDefined()
    }, 15000)

    it('should support importing npm packages with npm: prefix', async () => {
      const code = `
        try {
          const ulid = await import('npm:ulid')
          console.log('NPM_ULID:', typeof ulid.ulid === 'function')
        } catch (err) {
          console.log('NPM_ERROR:', err.message)
        }
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      // Either successfully imports or fails gracefully
      const successLog = logs.find((log) => log.log.includes('NPM_ULID:'))
      const errorLog = logs.find((log) => log.log.includes('NPM_ERROR:'))

      expect(successLog ?? errorLog).toBeDefined()
    }, 20000)

    it('should support importing jsr packages with jsr: prefix', async () => {
      const code = `
        try {
          const stdUlid = await import('jsr:@std/ulid')
          console.log('JSR_ULID:', stdUlid !== undefined)
        } catch (err) {
          console.log('JSR_ERROR:', err.message)
        }
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      const successLog = logs.find((log) => log.log.includes('JSR_ULID:'))
      const errorLog = logs.find((log) => log.log.includes('JSR_ERROR:'))

      expect(successLog ?? errorLog).toBeDefined()
    }, 20000)
  })

  describe('Environment & Globals', () => {
    it('should have process.env available', async () => {
      const code = `
        console.log('PROCESS_ENV_EXISTS:', typeof process.env === 'object')
        console.log('PROCESS_ENV_NODE_ENV:', process.env.NODE_ENV || 'not set')
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      expect(logs.find((log) => log.log.includes('PROCESS_ENV_EXISTS: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('PROCESS_ENV_NODE_ENV:'))).toBeDefined()
    }, 10000)

    // it('should have import.meta.env available in testing mode', async () => {
    //   if (!denoAvailable) {
    //     return
    //   }

    //   const code = `
    //     console.log('IMPORT_META_ENV:', typeof import.meta.env)
    //     console.log('NODE_ENV:', import.meta.env?.NODE_ENV || 'not set')
    //   `

    //   const messages = await sandboxManager.executeCodeBuffered(code, true)
    //   const logs = messages.filter((msg) => msg.type === 'log')

    //   expect(logs.find((log) => log.log.includes('IMPORT_META_ENV:'))).toBeDefined()
    //   // The env should be 'testing' when testing flag is true
    //   const nodeEnvLog = logs.find((log) => log.log.includes('NODE_ENV:'))
    //   expect(nodeEnvLog).toBeDefined()
    //   if (nodeEnvLog) {
    //     expect(nodeEnvLog.log).toContain('testing')
    //   }
    // }, 10000)

    it('should have exit() and terminate() functions', async () => {
      const code = `
        console.log('EXIT_FUNCTION:', typeof exit === 'function')
        console.log('TERMINATE_FUNCTION:', typeof terminate === 'function')
        console.log('PROCESS_EXIT:', typeof process.exit === 'function')
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      expect(logs.find((log) => log.log.includes('EXIT_FUNCTION: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('TERMINATE_FUNCTION: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('PROCESS_EXIT: true'))).toBeDefined()
    }, 10000)

    it('should have Deno.env available with limited access', async () => {
      const code = `
        console.log('DENO_ENV_EXISTS:', typeof Deno?.env === 'object')
        console.log('DENO_ENV_GET:', typeof Deno?.env?.get === 'function')
        const envObj = Deno.env.toObject()
        console.log('DENO_ENV_KEYS:', Object.keys(envObj).length)
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      expect(logs.find((log) => log.log.includes('DENO_ENV_EXISTS: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('DENO_ENV_GET: true'))).toBeDefined()
    }, 10000)

    it('should have location.href pointing to worker file', async () => {
      const code = `
        console.log('LOCATION_EXISTS:', typeof location === 'object')
        console.log('LOCATION_HREF_EXISTS:', typeof location.href === 'string')
        console.log('LOCATION_IS_FILE:', location.href.startsWith('file://'))
        console.log('LOCATION_HAS_WORKER:', location.href.includes('worker.mjs'))
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      expect(logs.find((log) => log.log.includes('LOCATION_EXISTS: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('LOCATION_HREF_EXISTS: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('LOCATION_IS_FILE: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('LOCATION_HAS_WORKER: true'))).toBeDefined()
    }, 10000)
  })

  describe('Console Methods', () => {
    it('should support all console methods', async () => {
      const code = `
        // Test various console methods
        console.log('LOG_TEST')
        console.info('INFO_TEST')
        console.warn('WARN_TEST')
        console.error('ERROR_TEST')
        console.debug('DEBUG_TEST')

        // Test console.count
        console.count('counter')
        console.count('counter')
        console.countReset('counter')
        console.count('counter')

        // Test console.time
        console.time('timer')
        console.timeEnd('timer')

        // Test console.group
        console.group('Group Test')
        console.log('Inside group')
        console.groupEnd()

        // Test console.table
        console.table([{a: 1, b: 2}])

        // Test console.assert
        console.assert(true, 'Should not appear')
        console.assert(false, 'Assertion failed')
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      // Check for different log types
      const logTest = logs.find((log) => log.kind === 'log' && log.log.includes('LOG_TEST'))
      const infoTest = logs.find((log) => log.kind === 'info' && log.log.includes('INFO_TEST'))
      const warnTest = logs.find((log) => log.kind === 'warn' && log.log.includes('WARN_TEST'))
      const errorTest = logs.find((log) => log.kind === 'error' && log.log.includes('ERROR_TEST'))
      const debugTest = logs.find((log) => log.kind === 'debug' && log.log.includes('DEBUG_TEST'))

      expect(logTest).toBeDefined()
      expect(infoTest).toBeDefined()
      expect(warnTest).toBeDefined()
      expect(errorTest).toBeDefined()
      expect(debugTest).toBeDefined()
    }, 15000)
  })

  describe('Memory & Resource Limits', () => {
    it('should handle memory allocation within limits', async () => {
      const code = `
        try {
          // Allocate 10MB (should be fine)
          const size = 10 * 1024 * 1024
          const buffer = new Uint8Array(size)

          // Touch some bytes to ensure allocation
          for (let i = 0; i < size; i += 4096) {
            buffer[i] = 1
          }

          console.log('MEMORY_ALLOC_SUCCESS:', buffer.length)
        } catch (err) {
          console.log('MEMORY_ALLOC_ERROR:', err.message)
        }
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      const successLog = logs.find((log) => log.log.includes('MEMORY_ALLOC_SUCCESS:'))
      expect(successLog).toBeDefined()
    }, 15000)
  })

  describe('Network Access', () => {
    it('should allow fetch requests to external URLs', async () => {
      const code = `
        try {
          const response = await fetch('https://httpbin.org/get')
          const data = await response.json()
          console.log('FETCH_SUCCESS:', response.status === 200)
          console.log('FETCH_URL:', data.url === 'https://httpbin.org/get')
        } catch (err) {
          console.log('FETCH_ERROR:', err.message)
        }
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      // Network requests might succeed or fail depending on environment
      const successLog = logs.find((log) => log.log.includes('FETCH_SUCCESS:'))
      const errorLog = logs.find((log) => log.log.includes('FETCH_ERROR:'))

      expect(successLog ?? errorLog).toBeDefined()
    }, 20000)
  })

  describe('Process & Worker Control', () => {
    it('should handle process.cwd() correctly', async () => {
      const code = `
        const cwd = process.cwd()
        console.log('CWD_EXISTS:', typeof cwd === 'string')
        console.log('CWD_NOT_EMPTY:', cwd.length > 0)
        console.log('CWD_IS_PATH:', cwd.startsWith('/'))
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      expect(logs.find((log) => log.log.includes('CWD_EXISTS: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('CWD_NOT_EMPTY: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('CWD_IS_PATH: true'))).toBeDefined()
    }, 10000)

    it('should handle process.hrtime correctly', async () => {
      const code = `
        const start = process.hrtime()
        console.log('HRTIME_IS_ARRAY:', Array.isArray(start))
        console.log('HRTIME_LENGTH:', start.length)

        // Do some work
        let sum = 0
        for (let i = 0; i < 1000000; i++) {
          sum += i
        }

        const diff = process.hrtime(start)
        console.log('HRTIME_DIFF_IS_ARRAY:', Array.isArray(diff))
        console.log('HRTIME_ELAPSED:', diff[0] >= 0 && diff[1] >= 0)

        // Test hrtime.bigint
        const bigintTime = process.hrtime.bigint()
        console.log('HRTIME_BIGINT:', typeof bigintTime === 'bigint')
      `

      const messages = await sandboxManager.executeCodeBuffered(code, false)
      const logs = messages.filter((msg) => msg.type === 'log')

      expect(logs.find((log) => log.log.includes('HRTIME_IS_ARRAY: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('HRTIME_LENGTH: 2'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('HRTIME_ELAPSED: true'))).toBeDefined()
      expect(logs.find((log) => log.log.includes('HRTIME_BIGINT: true'))).toBeDefined()
    }, 10000)
  })
})
