import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3'
import debug from 'debug'
import { Hono } from 'hono'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type BucketStorageConfig, StorageService } from '../src/storage-service'
import { streamToBytes } from '../src/stream-utils'

import { readFixture } from './read-fixture'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const log = debug('test')

describe('storageService - Bucket (MinIO)', () => {
  let minio: StartedTestContainer | null = null
  let storageService: StorageService
  let app: Hono

  beforeAll(async () => {
    log('Starting MinIO container...')

    // Start MinIO container
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

    log(`MinIO started at ${host}:${port}`)

    // Create S3 client to set up bucket
    const s3Client = new S3Client({
      endpoint: `http://${host}:${port}`,
      region: 'auto',
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin'
      },
      forcePathStyle: true
    })

    // Create test bucket
    const bucketName = 'test-bucket'
    try {
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: bucketName
        })
      )
      log(`Created bucket: ${bucketName}`)
    } catch (error) {
      log('Bucket creation error (may already exist):', error)
    }

    // Initialize storage service with MinIO config
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

    storageService = new StorageService(config, log)

    // Create a Hono app with the storage service
    app = new Hono()
    // Generic route used in earlier tests
    app.get('/storage/:key', async (c) => {
      const key = c.req.param('key')
      return storageService.serve(c, key, {})
    })
    log('Storage service initialized')
  }, 60000) // 1 minute timeout for container setup

  afterAll(async () => {
    log('Cleaning up...')
    try {
      await storageService.cleanup()
      if (minio) {
        await minio.stop()
      }
      log('Cleanup complete')
    } catch (error) {
      log('Cleanup error:', error)
    }
  }, 30000)

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
    const deleteResult = await storageService.deleteKey(key)

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
    const deleteResult = await storageService.deleteKey(key)

    expect(deleteResult.success).toBe(true)
  })
})
