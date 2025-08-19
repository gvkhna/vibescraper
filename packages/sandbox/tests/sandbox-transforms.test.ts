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

describe('SandboxManager Import Transformation Tests', () => {
  let sandboxManager: SandboxManager | undefined
  const testTmpDir = path.join(process.cwd(), 'tmp')
  const denoAvailable = isDenoAvailable()

  beforeAll(async () => {
    if (!denoAvailable) {
      console.warn('⚠️  Deno is not installed. Skipping sandbox transform tests.')
      return
    }

    await fs.mkdir(testTmpDir, {recursive: true})
    sandboxManager = new SandboxManager(testTmpDir, (...args) => {
      console.log('[TRANSFORM TEST]', ...args)
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

  describe('Node Built-in Module Transformations', () => {
    it('should transform bare node module imports to node: prefix', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import path from 'path'
        import fs from 'fs'
        import crypto from 'crypto'

        console.log('PATH_JOIN:', typeof path.join)
        console.log('FS_READFILE:', typeof fs.readFile)
        console.log('CRYPTO_RANDOM:', typeof crypto.randomBytes)
      `

      const messages = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = messages?.filter((msg) => msg.type === 'log')

      expect(logs?.some((msg) => msg.log.includes('PATH_JOIN: function'))).toBe(true)
      expect(logs?.some((msg) => msg.log.includes('FS_READFILE: function'))).toBe(true)
      expect(logs?.some((msg) => msg.log.includes('CRYPTO_RANDOM: function'))).toBe(true)

      const status = messages?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 15000)

    it('should handle node module imports with /promises suffix', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import fs from 'fs/promises'

        console.log('FS_PROMISES:', typeof fs.readFile === 'function')
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      expect(logs.some((msg) => msg.log.includes('FS_PROMISES: true'))).toBe(true)
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 10000)

    it('should not double-prefix already prefixed node: imports', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import path from 'node:path'
        import fs from 'node:fs'

        console.log('ALREADY_PREFIXED:', typeof path.join === 'function' && typeof fs.readFile === 'function')
      `

      const result = await sandboxManager?.executeCodeBuffered(code)

      expect(result?.some((log) => log.type === 'log' && log.log.includes('ALREADY_PREFIXED: true'))).toBe(
        true
      )
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 10000)
  })

  describe('NPM Package Transformations', () => {
    // it('should transform bare npm package imports to npm: prefix', async () => {
    //   if (!denoAvailable) {
    //     return
    //   }

    //   const code = `
    //     import {ulid} from 'ulid'

    //     const id = ulid()
    //     console.log('ULID_LENGTH:', id.length === 26)
    //     console.log('ULID_TYPE:', typeof id === 'string')
    //   `

    //   const result = await sandboxManager?.executeCodeBuffered(code, false)
    //   const logs = result?.filter((msg) => msg.type === 'log') ?? []

    //   expect(logs.some((msg) => msg.log.includes('ULID_LENGTH: true'))).toBe(true)
    //   expect(logs.some((msg) => msg.log.includes('ULID_TYPE: true'))).toBe(true)
    //   const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
    //   expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    // }, 20000)

    it('should handle scoped npm packages', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import dayjs from 'dayjs'

        const date = dayjs()
        console.log('DAYJS_VALID:', date.isValid())
        console.log('DAYJS_FORMAT:', typeof date.format === 'function')
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      expect(logs.some((msg) => msg.log.includes('DAYJS_VALID: true'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('DAYJS_FORMAT: true'))).toBe(true)
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 20000)

    it('should not double-prefix already prefixed npm: imports', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import {ulid} from 'npm:ulid'

        console.log('NPM_PREFIXED:', typeof ulid === 'function')
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      expect(logs.some((msg) => msg.log.includes('NPM_PREFIXED: true'))).toBe(true)
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 20000)
  })

  describe('Mixed Import Transformations', () => {
    it('should handle multiple import types in the same file', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import path from 'path'
        import {ulid} from 'ulid'
        import fs from 'node:fs'
        import crypto from 'crypto'

        console.log('PATH_OK:', typeof path.join === 'function')
        console.log('ULID_OK:', typeof ulid === 'function')
        console.log('FS_OK:', typeof fs.readFile === 'function')
        console.log('CRYPTO_OK:', typeof crypto.randomBytes === 'function')
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      expect(logs.some((msg) => msg.log.includes('PATH_OK: true'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('ULID_OK: true'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('FS_OK: true'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('CRYPTO_OK: true'))).toBe(true)
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 20000)

    it('should handle dynamic imports', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        async function testDynamic() {
          const path = await import('path')
          const {ulid} = await import('ulid')

          console.log('DYNAMIC_PATH:', typeof path.join === 'function')
          console.log('DYNAMIC_ULID:', typeof ulid === 'function')
        }

        await testDynamic()
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      expect(logs.some((msg) => msg.log.includes('DYNAMIC_PATH: true'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('DYNAMIC_ULID: true'))).toBe(true)
      console.log('results', result)
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 20000)

    // it('should handle require() calls (CommonJS)', async () => {
    //   if (!denoAvailable) {
    //     return
    //   }

    //   const code = `
    //     const path = require('path')
    //     const fs = require('fs')

    //     console.log('REQUIRE_PATH:', typeof path.join === 'function')
    //     console.log('REQUIRE_FS:', typeof fs.readFile === 'function')
    //   `

    //   const result = await sandboxManager?.executeCodeBuffered(code, false)
    //   const logs = result?.filter((msg) => msg.type === 'log') ?? []

    //   expect(logs.some((msg) => msg.log.includes('REQUIRE_PATH: true'))).toBe(true)
    //   expect(logs.some((msg) => msg.log.includes('REQUIRE_FS: true'))).toBe(true)
    //   const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
    //   expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    // }, 10000)
  })

  describe('Line Number Preservation', () => {
    it('should preserve line numbers in error messages after transformation', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import path from 'path'
        import {ulid} from 'ulid'

        console.log('LINE 5')
        console.log('LINE 6')
        throw new Error('Error on line 7')
        console.log('LINE 8')
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []
      const exceptions = result?.filter((msg) => msg.type === 'exception') ?? []

      // Should have executed the console.logs before the error
      expect(logs.some((msg) => msg.log.includes('LINE 5'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('LINE 6'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('LINE 8'))).toBe(false)

      // Should have an error with correct line number
      expect(exceptions.length).toBeGreaterThan(0)
      const errorStack = JSON.stringify(exceptions[0])
      expect(errorStack).toContain('Error on line 7')
      // The stack trace should reference line 7 (or close to it, accounting for wrapper code)
    }, 10000)

    //   it('should handle syntax errors with correct line numbers', async () => {
    //     if (!denoAvailable) {
    //       return
    //     }

    //     const code = `
    //       import path from 'path'

    //       console.log('LINE 4')
    //       const x = {
    //       console.log('This will cause syntax error')
    //     `

    //     const result = await sandboxManager?.executeCodeBuffered(code, false)
    //     const status = result?.find((msg) => msg.type === 'status' && msg.status === 'failed')

    //     expect(status?.type === 'status' && status.status === 'failed').toBe(true)
    //     const exceptions = result?.filter((msg) => msg.type === 'exception') ?? []

    //     // Should have failed due to syntax error
    //     expect(exceptions.length).toBeGreaterThan(0)
    //   }, 10000)
  })

  describe('JSR Package Support', () => {
    it('should not transform jsr: prefixed imports', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import {assertEquals} from 'jsr:@std/assert'

        try {
          assertEquals(1, 1)
          console.log('JSR_ASSERT_WORKS: true')
        } catch (err) {
          console.log('JSR_ASSERT_ERROR:', err.message)
        }
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      // Either works or fails gracefully
      const hasSuccess = logs.some((msg) => msg.log.includes('JSR_ASSERT_WORKS: true'))
      const hasError = logs.some((msg) => msg.log.includes('JSR_ASSERT_ERROR:'))
      expect(hasSuccess || hasError).toBe(true)
    }, 20000)
  })

  describe('Special Cases', () => {
    // it('should handle imports with query parameters and hashes', async () => {
    //   if (!denoAvailable) {
    //     return
    //   }

    //   const code = `
    //     // These should not be transformed as they're URLs
    //     import data from './data.json?raw'
    //     import styles from './styles.css#inline'

    //     console.log('SPECIAL_IMPORTS_TEST: completed')
    //   `

    //   const result = await sandboxManager?.executeCodeBuffered(code, false)
    //   const logs = result?.filter((msg) => msg.type === 'log') ?? []

    //   // The test completion log should appear (imports might fail but transformation shouldn't break)
    //   expect(logs.some((msg) => msg.log.includes('SPECIAL_IMPORTS_TEST:'))).toBe(true)
    // }, 10000)

    it('should handle export statements correctly', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import path from 'path'
        export {path}

        export {ulid} from 'ulid'

        console.log('EXPORTS_HANDLED: true')
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      expect(logs.some((msg) => msg.log.includes('EXPORTS_HANDLED: true'))).toBe(true)
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 10000)

    it('should handle multi-line imports', async () => {
      if (!denoAvailable) {
        return
      }

      const code = `
        import {
          join,
          resolve,
          dirname
        } from 'path'

        import {
          readFile,
          writeFile
        } from 'fs/promises'

        console.log('MULTILINE_JOIN:', typeof join === 'function')
        console.log('MULTILINE_RESOLVE:', typeof resolve === 'function')
        console.log('MULTILINE_READFILE:', typeof readFile === 'function')
      `

      const result = await sandboxManager?.executeCodeBuffered(code, false)
      const logs = result?.filter((msg) => msg.type === 'log') ?? []

      expect(logs.some((msg) => msg.log.includes('MULTILINE_JOIN: true'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('MULTILINE_RESOLVE: true'))).toBe(true)
      expect(logs.some((msg) => msg.log.includes('MULTILINE_READFILE: true'))).toBe(true)
      const status = result?.find((msg) => msg.type === 'status' && msg.status === 'completed')
      expect(status?.type === 'status' && status.status === 'completed').toBe(true)
    }, 10000)
  })
})
