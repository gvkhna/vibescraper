import { Hono } from 'hono'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type FilesystemStorageConfig, StorageService } from '../src/storage-service'
import { streamToBytes } from '../src/stream-utils'

import { readFixture } from './read-fixture'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('storageService - HTTP Serving', () => {
  let storageService: StorageService
  let app: Hono
  const tmpDir = path.join(__dirname, '..', 'tmp', 'test-storage-http')

  beforeAll(() => {
    // Create tmp directory if it doesn't exist
    fs.mkdirSync(tmpDir, { recursive: true })

    // Initialize storage service with filesystem config
    const config: FilesystemStorageConfig = {
      STORAGE_PROVIDER: 'filesystem',
      STORAGE_BASE_PATH: tmpDir
    }

    storageService = new StorageService(config)

    // Create a Hono app with the storage service
    app = new Hono()
    app.get('/storage/:key', async (c) => {
      const key = c.req.param('key')
      return storageService.serve(c, key, {})
    })
  })

  afterAll(async () => {
    // Cleanup
    await storageService.cleanup()
    // fs.rmSync(tmpDir, {recursive: true, force: true})
  })

  it('should serve stored file via HTTP response', async () => {
    expect.assertions(4)

    // Read the test image file
    const imagePath = path.join(__dirname, '..', 'fixtures', 'image.jpg')
    const fileBuffer = fs.readFileSync(imagePath)
    const originalBytes = new Uint8Array(fileBuffer)

    // Store the file
    const storeResult = await storageService.store(originalBytes)

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('Store failed')
    }

    const key = storeResult.data

    // Create a request to the Hono app
    const req = new Request(`http://localhost/storage/${key}`)
    const res = await app.fetch(req)

    // Check response is successful
    expect(res.status).toBe(200)

    // Get the response body and verify it matches
    const responseBytes = new Uint8Array(await res.arrayBuffer())

    expect(responseBytes).toStrictEqual(originalBytes)

    // Clean up
    const deleteResult = await storageService.delete(key)

    expect(deleteResult.success).toBe(true)
  })

  it('should return 404 for non-existent file when serving', async () => {
    expect.assertions(1)

    // Generate a random key that doesn't exist
    const nonExistentKey = 'd'.repeat(32)

    // Create a request to the Hono app
    const req = new Request(`http://localhost/storage/${nonExistentKey}`)
    const res = await app.fetch(req)

    // Check that we got a 404 response
    expect(res.status).toBe(404)
  })

  it('should handle query parameters for download', async () => {
    expect.assertions(4)

    // Read the test image file
    const imagePath = path.join(__dirname, '..', 'fixtures', 'image.jpg')
    const fileBuffer = fs.readFileSync(imagePath)
    const originalBytes = new Uint8Array(fileBuffer)

    // Store the file
    const storeResult = await storageService.store(originalBytes)

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('Store failed')
    }

    const key = storeResult.data

    // Create a request with download query parameter
    const req = new Request(`http://localhost/storage/${key}?download=1&filename=test.jpg`)
    const res = await app.fetch(req)

    // Check response is successful
    expect(res.status).toBe(200)

    // Check Content-Disposition header for download
    const contentDisposition = res.headers.get('content-disposition')

    expect(contentDisposition).toContain('attachment')

    // Clean up
    const deleteResult = await storageService.delete(key)

    expect(deleteResult.success).toBe(true)
  })

  it('br: serve via HTTP round-trip', async () => {
    expect.assertions(2)

    const original = readFixture('text.fixture')
    const storeResult = await storageService.store(original, 'br')

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('store failed')
    }
    const key = storeResult.data

    const req = new Request(`http://localhost/storage/${key}?enc=br`)
    const res = await app.fetch(req)
    const body = new Uint8Array(await res.arrayBuffer())

    expect(body).toStrictEqual(original)

    await storageService.delete(key)
  })

  // it('gzip: serve via HTTP round-trip', async () => {
  //   expect.assertions(2)

  //   const original = readFixture('text.fixture')
  //   const storeResult = await storageService.store(original, 'gzip')

  //   expect(storeResult.success).toBe(true)

  //   if (!storeResult.success) {
  //     throw new Error('store failed')
  //   }
  //   const key = storeResult.data

  //   const req = new Request(`http://localhost/storage/${key}?enc=gzip`)
  //   const res = await app.fetch(req)
  //   const body = new Uint8Array(await res.arrayBuffer())

  //   expect(body).toStrictEqual(original)

  //   await storageService.delete(key)
  // })
})
