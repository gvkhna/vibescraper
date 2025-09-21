import { Hono } from 'hono'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { serveStream } from '../src/serve-stream'
import {
  type BucketStorageConfig,
  type FilesystemStorageConfig,
  StorageService
} from '../src/storage-service'
import { streamToBytes } from '../src/stream-utils'
import { brotliCompressBytesSync, gzipCompressBytesSync } from '../src/zlib-utils'

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
    // Generic route used in earlier tests
    app.get('/storage/:key', async (c) => {
      const key = c.req.param('key')
      return storageService.serve(c, key, {})
    })

    // Compression-aware route for filesystem provider
    // Default (no enc query): transparently decompress (based on ":algo")
    // Override (?enc=br|gzip): preserve encoding and set header
    app.get('/fs/:algo/:key', async (c) => {
      const key = c.req.param('key')
      const algo = c.req.param('algo') as 'br' | 'gzip'
      const encOverride = c.req.query('enc') as 'br' | 'gzip' | undefined
      if (encOverride) {
        const streamRes = await storageService.stream(key, false)
        if (!streamRes.success) {
          return c.notFound()
        }
        return serveStream(c, streamRes.data, { encoding: algo }, { download: false, inline: true })
      }
      const streamRes = await storageService.stream(key, algo)
      if (!streamRes.success) {
        return c.notFound()
      }
      return serveStream(c, streamRes.data, {}, { download: false, inline: true })
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
    const originalBytes = readFixture('image.jpg')

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
    const originalBytes = readFixture('image.jpg')

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
    expect.assertions(5)

    const original = readFixture('text.fixture')
    const storeResult = await storageService.store(original, 'br')

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('store failed')
    }
    const key = storeResult.data

    // Default: transparently decompressed (no Content-Encoding header)
    {
      const req = new Request(`http://localhost/fs/br/${key}`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBeNull()

      const body = new Uint8Array(await res.arrayBuffer())

      expect(body).toStrictEqual(original)
    }

    // Override: preserve encoding and set header
    {
      const req = new Request(`http://localhost/fs/br/${key}?enc=br`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBe('br')

      const body = new Uint8Array(await res.arrayBuffer())
      const manuallyCompressed = brotliCompressBytesSync(original)

      expect(body).toStrictEqual(manuallyCompressed)
    }

    await storageService.delete(key)
  })

  it('gzip: serve via HTTP round-trip', async () => {
    expect.assertions(5)

    const original = readFixture('text.fixture')
    const storeResult = await storageService.store(original, 'gzip')

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('store failed')
    }
    const key = storeResult.data

    // Default: transparently decompressed (no Content-Encoding header)
    {
      const req = new Request(`http://localhost/fs/gzip/${key}`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBeNull()

      const body = new Uint8Array(await res.arrayBuffer())

      expect(body).toStrictEqual(original)
    }

    // Override: preserve encoding and set header
    {
      const req = new Request(`http://localhost/fs/gzip/${key}?enc=gzip`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBe('gzip')

      const body = new Uint8Array(await res.arrayBuffer())
      const manuallyCompressed = gzipCompressBytesSync(original)

      expect(body).toStrictEqual(manuallyCompressed)
    }

    await storageService.delete(key)
  })
})

describe('storageService - HTTP Serving (Bucket MinIO)', () => {
  let storageService: StorageService
  let app: Hono
  let minio: import('testcontainers').StartedTestContainer | null = null

  beforeAll(async () => {
    // Start MinIO
    const { GenericContainer, Wait } = await import('testcontainers')
    minio = await new GenericContainer('minio/minio:latest')
      .withCommand(['server', '/data'])
      .withEnvironment({ MINIO_ROOT_USER: 'minioadmin', MINIO_ROOT_PASSWORD: 'minioadmin' })
      .withExposedPorts(9000)
      .withWaitStrategy(Wait.forLogMessage(/API:.*/, 1).withStartupTimeout(30000))
      .start()

    const host = minio.getHost()
    const port = minio.getMappedPort(9000)

    // Ensure bucket exists
    // eslint-disable-next-line no-restricted-syntax
    const { S3Client, CreateBucketCommand } = await import('@aws-sdk/client-s3')
    const s3Client = new S3Client({
      endpoint: `http://${host}:${port}`,
      region: 'auto',
      credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
      forcePathStyle: true
    })
    const bucketName = 'test-bucket-http-serving'
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }))
    } catch {}

    const config: BucketStorageConfig = {
      STORAGE_PROVIDER: 'bucket',
      STORAGE_BUCKET_NAME: bucketName,
      STORAGE_ENDPOINT: `http://${host}:${port}`,
      STORAGE_REGION: 'us-east-1',
      STORAGE_ACCESS_KEY_ID: 'minioadmin',
      STORAGE_SECRET_ACCESS_KEY: 'minioadmin',
      STORAGE_FORCE_PATH_STYLE: true,
      STORAGE_CACHE_CONTROL_HEADER: 'public, max-age=31536000'
    }
    storageService = new StorageService(config)

    app = new Hono()
    // Compression-aware route for bucket provider (same semantics as filesystem version)
    app.get('/s3/:algo/:key', async (c) => {
      const key = c.req.param('key')
      const algo = c.req.param('algo') as 'br' | 'gzip'
      const encOverride = c.req.query('enc') as 'br' | 'gzip' | undefined
      if (encOverride) {
        const streamRes = await storageService.stream(key, false)
        if (!streamRes.success) {
          return c.notFound()
        }
        return import('../src/serve-stream').then(({ serveStream }) =>
          serveStream(c, streamRes.data, { encoding: algo }, { download: false, inline: true })
        )
      }
      const streamRes = await storageService.stream(key, algo)
      if (!streamRes.success) {
        return c.notFound()
      }
      return import('../src/serve-stream').then(({ serveStream }) =>
        serveStream(c, streamRes.data, {}, { download: false, inline: true })
      )
    })
  }, 60000)

  afterAll(async () => {
    await storageService.cleanup()
    if (minio) {
      await minio.stop()
    }
  }, 30000)

  it('br: serve via HTTP round-trip (bucket)', async () => {
    expect.assertions(5)

    const original = readFixture('text.fixture')
    const storeResult = await storageService.store(original, 'br')

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('store failed')
    }
    const key = storeResult.data

    // Default: transparently decompressed
    {
      const req = new Request(`http://localhost/s3/br/${key}`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBeNull()

      const body = new Uint8Array(await res.arrayBuffer())

      expect(body).toStrictEqual(original)
    }

    // Override: preserve encoding with header
    {
      const req = new Request(`http://localhost/s3/br/${key}?enc=br`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBe('br')

      const body = new Uint8Array(await res.arrayBuffer())
      const manuallyCompressed = brotliCompressBytesSync(original)

      expect(body).toStrictEqual(manuallyCompressed)
    }

    await storageService.delete(key)
  })

  it('gzip: serve via HTTP round-trip (bucket)', async () => {
    expect.assertions(5)

    const original = readFixture('text.fixture')
    const storeResult = await storageService.store(original, 'gzip')

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('store failed')
    }
    const key = storeResult.data

    // Default: transparently decompressed
    {
      const req = new Request(`http://localhost/s3/gzip/${key}`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBeNull()

      const body = new Uint8Array(await res.arrayBuffer())

      expect(body).toStrictEqual(original)
    }

    // Override: preserve encoding with header
    {
      const req = new Request(`http://localhost/s3/gzip/${key}?enc=gzip`)
      const res = await app.fetch(req)

      expect(res.headers.get('content-encoding')).toBe('gzip')

      const body = new Uint8Array(await res.arrayBuffer())
      const manuallyCompressed = gzipCompressBytesSync(original)

      expect(body).toStrictEqual(manuallyCompressed)
    }

    await storageService.delete(key)
  })
})
