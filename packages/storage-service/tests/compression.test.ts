/* eslint-disable no-console */
import { Hono } from 'hono'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  type BucketStorageConfig,
  type FilesystemStorageConfig,
  StorageService
} from '../src/storage-service'
import { streamToBytes } from '../src/stream-utils'
import { brotliDecompressBytesSync, gzipDecompressBytesSync } from '../src/zlib-utils'

import { readFixture } from './read-fixture'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('compression - Filesystem', () => {
  let storageService: StorageService
  const tmpDir = path.join(__dirname, '..', 'tmp', 'test-compression-fs')

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true })
    const config: FilesystemStorageConfig = {
      STORAGE_PROVIDER: 'filesystem',
      STORAGE_BASE_PATH: tmpDir
    }
    storageService = new StorageService(config)
  })

  afterAll(async () => {
    await storageService.cleanup()
  })

  describe('br', () => {
    it('br: store/retrieve round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')

      const storeResult = await storageService.store(original, 'br')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      // Retrieve with decompression
      const getResult = await storageService.retrieve(key, 'br')

      expect(getResult.success).toBe(true)

      if (!getResult.success) {
        throw new Error('retrieve failed')
      }

      expect(getResult.data).toStrictEqual(original)

      // Introspection: raw stored bytes should decompress back to original
      const rawResult = await storageService.retrieve(key, false)

      expect(rawResult.success).toBe(true)

      if (!rawResult.success) {
        throw new Error('raw retrieve failed')
      }
      const raw = rawResult.data
      const decomp = brotliDecompressBytesSync(raw)

      expect(decomp).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })

    it('br: stream round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')
      const storeResult = await storageService.store(original, 'br')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      const streamResult = await storageService.stream(key, 'br')

      expect(streamResult.success).toBe(true)

      if (!streamResult.success) {
        throw new Error('stream failed')
      }
      const bytes = await streamToBytes(streamResult.data)

      expect(bytes).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })
  })

  describe('gzip', () => {
    it('gzip: store/retrieve round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')

      const storeResult = await storageService.store(original, 'gzip')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      // Retrieve with decompression
      const getResult = await storageService.retrieve(key, 'gzip')

      expect(getResult.success).toBe(true)

      if (!getResult.success) {
        throw new Error('retrieve failed')
      }

      expect(getResult.data).toStrictEqual(original)

      // Introspection: raw stored bytes should decompress back to original
      const rawResult = await storageService.retrieve(key, false)

      expect(rawResult.success).toBe(true)

      if (!rawResult.success) {
        throw new Error('raw retrieve failed')
      }
      const raw = rawResult.data
      const decomp = gzipDecompressBytesSync(raw)

      expect(decomp).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })

    it('gzip: stream round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')
      const storeResult = await storageService.store(original, 'gzip')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      const streamResult = await storageService.stream(key, 'gzip')

      expect(streamResult.success).toBe(true)

      if (!streamResult.success) {
        throw new Error('stream failed')
      }
      const bytes = await streamToBytes(streamResult.data)

      expect(bytes).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })
  })
})

describe('compression - Bucket (MinIO)', () => {
  let minio: StartedTestContainer | null = null
  let storageService: StorageService
  let app: Hono

  beforeAll(async () => {
    console.log('Starting MinIO container (compression tests)...')
    minio = await new GenericContainer('minio/minio:latest')
      .withCommand(['server', '/data'])
      .withEnvironment({
        MINIO_ROOT_USER: 'minioadmin',
        MINIO_ROOT_PASSWORD: 'minioadmin'
      })
      .withExposedPorts(9000)
      .withWaitStrategy(Wait.forLogMessage(/API:.*/, 1).withStartupTimeout(30000))
      .start()

    const host = minio.getHost()
    const port = minio.getMappedPort(9000)

    // eslint-disable-next-line no-restricted-syntax
    const { S3Client, CreateBucketCommand } = await import('@aws-sdk/client-s3')
    const s3Client = new S3Client({
      endpoint: `http://${host}:${port}`,
      region: 'auto',
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin'
      },
      forcePathStyle: true
    })

    const bucketName = 'test-bucket-compression'
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }))
    } catch (error) {
      console.log('Bucket may already exist:', error)
    }

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
    storageService = new StorageService(config, console.log)

    // Hono app to exercise serve() for bucket
    app = new Hono()
    app.get('/storage/:key', async (c) => {
      const key = c.req.param('key')
      // Encoding passed via query param for test ('br' | 'gzip')
      const enc = (c.req.query('enc') as 'br' | 'gzip' | undefined) ?? 'br'
      return storageService.serve(c, key, { encoding: enc }, {})
    })
  }, 60000)

  afterAll(async () => {
    try {
      await storageService.cleanup()
      if (minio) {
        await minio.stop()
      }
    } catch (error) {
      console.error('Cleanup error (compression tests):', error)
    }
  }, 30000)

  describe('br', () => {
    it('br: store/retrieve round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')
      const storeResult = await storageService.store(original, 'br')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      const getResult = await storageService.retrieve(key, 'br')

      expect(getResult.success).toBe(true)

      if (!getResult.success) {
        throw new Error('retrieve failed')
      }

      expect(getResult.data).toStrictEqual(original)

      // Introspection: raw bytes should decompress back to original
      const rawResult = await storageService.retrieve(key, false)

      expect(rawResult.success).toBe(true)

      if (!rawResult.success) {
        throw new Error('raw retrieve failed')
      }
      const raw = rawResult.data
      const decomp = brotliDecompressBytesSync(raw)

      expect(decomp).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })

    it('br: stream round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')
      const storeResult = await storageService.store(original, 'br')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      const streamResult = await storageService.stream(key, 'br')

      expect(streamResult.success).toBe(true)

      if (!streamResult.success) {
        throw new Error('stream failed')
      }
      const bytes = await streamToBytes(streamResult.data)

      expect(bytes).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })
  })

  describe('gzip', () => {
    it('gzip: store/retrieve round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')
      const storeResult = await storageService.store(original, 'gzip')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      const getResult = await storageService.retrieve(key, 'gzip')

      expect(getResult.success).toBe(true)

      if (!getResult.success) {
        throw new Error('retrieve failed')
      }

      expect(getResult.data).toStrictEqual(original)

      // Introspection: raw bytes should decompress back to original
      const rawResult = await storageService.retrieve(key, false)

      expect(rawResult.success).toBe(true)

      if (!rawResult.success) {
        throw new Error('raw retrieve failed')
      }
      const raw = rawResult.data
      const decomp = gzipDecompressBytesSync(raw)

      expect(decomp).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })

    it('gzip: stream round-trip', async () => {
      expect.hasAssertions()

      const original = readFixture('text.fixture')
      const storeResult = await storageService.store(original, 'gzip')

      expect(storeResult.success).toBe(true)

      if (!storeResult.success) {
        throw new Error('store failed')
      }
      const key = storeResult.data

      const streamResult = await storageService.stream(key, 'gzip')

      expect(streamResult.success).toBe(true)

      if (!streamResult.success) {
        throw new Error('stream failed')
      }
      const bytes = await streamToBytes(streamResult.data)

      expect(bytes).toStrictEqual(original)

      const del = await storageService.delete(key)

      expect(del.success).toBe(true)
    })
  })
})
