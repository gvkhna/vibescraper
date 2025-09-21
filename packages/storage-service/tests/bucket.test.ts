/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type BucketStorageConfig, StorageService } from '../src/storage-service'
import { streamToBytes } from '../src/stream-utils'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('storageService - Bucket (MinIO)', () => {
  let minio: StartedTestContainer | null = null
  let storageService: StorageService

  beforeAll(async () => {
    console.log('Starting MinIO container...')

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

    console.log(`MinIO started at ${host}:${port}`)

    // Create S3 client to set up bucket
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

    // Create test bucket
    const bucketName = 'test-bucket'
    try {
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: bucketName
        })
      )
      console.log(`Created bucket: ${bucketName}`)
    } catch (error) {
      console.log('Bucket creation error (may already exist):', error)
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

    storageService = new StorageService(config, console.log)
    console.log('Storage service initialized')
  }, 60000) // 1 minute timeout for container setup

  afterAll(async () => {
    console.log('Cleaning up...')
    try {
      await storageService.cleanup()
      if (minio) {
        await minio.stop()
      }
      console.log('Cleanup complete')
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }, 30000)

  it('should store and retrieve the same file data', async () => {
    expect.assertions(8)

    // Read the test image file
    const imagePath = path.join(__dirname, '..', 'fixtures', 'image.jpg')
    const fileBuffer = fs.readFileSync(imagePath)
    const originalBytes = new Uint8Array(fileBuffer)

    // console.log(`Storing ${originalBytes.length} bytes...`)

    // Store the file
    const storeResult = await storageService.store(originalBytes)

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('Store failed')
    }

    const key = storeResult.data

    expect(key).toBeDefined()

    expect(key.length).toBeGreaterThan(0)

    // console.log(`Stored with key: ${key}`)

    // Retrieve the file using the key
    const getResult = await storageService.retrieve(key)

    expect(getResult.success).toBe(true)

    if (!getResult.success) {
      throw new Error('Get failed')
    }

    const retrievedBytes = getResult.data

    expect(retrievedBytes).toBeDefined()

    // Verify we get the same data back
    expect(retrievedBytes).toStrictEqual(originalBytes)
    expect(retrievedBytes).toHaveLength(originalBytes.length)

    console.log(`Retrieved ${retrievedBytes.length} bytes successfully`)

    // Clean up the test file
    const deleteResult = await storageService.delete(key)

    expect(deleteResult.success).toBe(true)

    console.log('File deleted successfully')
  })

  it('should return NOT_FOUND error for non-existent file', async () => {
    expect.assertions(4)

    // Generate a random key that doesn't exist
    const nonExistentKey = 'a'.repeat(32) // Valid key format but doesn't exist

    // Try to retrieve the non-existent file
    const result = await storageService.retrieve(nonExistentKey)

    // Verify we get a NOT_FOUND error
    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error).toBe('NOT_FOUND')
      expect(result.message).toContain('File not found')
      expect(result.message).toContain(nonExistentKey)
    }
    console.log('NOT_FOUND error handled correctly for getBlob')
  })

  it('should return NOT_FOUND error when deleting non-existent file', async () => {
    expect.assertions(4)

    // Generate a random key that doesn't exist
    const nonExistentKey = 'b'.repeat(32) // Valid key format but doesn't exist

    // Try to delete the non-existent file
    const result = await storageService.delete(nonExistentKey)

    // Verify delete returns NOT_FOUND error
    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error).toBe('NOT_FOUND')
      expect(result.message).toContain('File not found')
      expect(result.message).toContain(nonExistentKey)
    }
    console.log('NOT_FOUND error handled correctly for deleteBlob')
  })

  it('should reject invalid data when storing', async () => {
    expect.assertions(8)

    // Test with null/undefined
    // @ts-expect-error - Testing runtime validation
    const nullResult = await storageService.store(null)

    expect(nullResult.success).toBe(false)

    if (!nullResult.success) {
      expect(nullResult.message).toContain('No data provided')
    }

    // Test with wrong type (not a Uint8Array)
    // @ts-expect-error - Testing runtime validation
    const stringResult = await storageService.store('not a buffer')

    expect(stringResult.success).toBe(false)

    if (!stringResult.success) {
      expect(stringResult.message).toContain('must be a Uint8Array')
    }

    // Test with wrong type (plain array)
    // @ts-expect-error - Testing runtime validation
    const arrayResult = await storageService.store([1, 2, 3])

    expect(arrayResult.success).toBe(false)

    if (!arrayResult.success) {
      expect(arrayResult.message).toContain('must be a Uint8Array')
    }

    // Test with empty Uint8Array
    const emptyResult = await storageService.store(new Uint8Array(0))

    expect(emptyResult.success).toBe(false)

    if (!emptyResult.success) {
      expect(emptyResult.message).toContain('Cannot store empty data')
    }

    console.log('Input validation working correctly')
  })

  it('should store and retrieve file as stream', async () => {
    expect.assertions(9)

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

    expect(key).toBeDefined()

    expect(key.length).toBeGreaterThan(0)

    // Retrieve the file as a stream
    const streamResult = await storageService.stream(key)

    expect(streamResult.success).toBe(true)

    if (!streamResult.success) {
      throw new Error('Get stream failed')
    }

    const stream = streamResult.data

    expect(stream).toBeInstanceOf(ReadableStream)

    // Read the stream using modern Web Streams API
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        if (value) {
          expect(value).toBeInstanceOf(Uint8Array)

          chunks.push(value)
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Combine chunks into single array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const retrievedBytes = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      retrievedBytes.set(chunk, offset)
      offset += chunk.length
    }

    // Verify we get the same data back
    expect(retrievedBytes).toStrictEqual(originalBytes)
    expect(retrievedBytes).toHaveLength(originalBytes.length)

    console.log('Stream retrieval working correctly')

    // Clean up
    const deleteResult = await storageService.delete(key)

    expect(deleteResult.success).toBe(true)
  })

  it('should return NOT_FOUND error for stream of non-existent file', async () => {
    expect.assertions(4)

    // Generate a random key that doesn't exist
    const nonExistentKey = 'c'.repeat(32) // Valid key format but doesn't exist

    // Try to retrieve stream for non-existent file
    const result = await storageService.stream(nonExistentKey)

    // Verify we get a NOT_FOUND error
    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error).toBe('NOT_FOUND')
      expect(result.message).toContain('File not found')
      expect(result.message).toContain(nonExistentKey)
    }
    console.log('NOT_FOUND error handled correctly for getBlobStream')
  })

  it('should work with streamToBytes utility', async () => {
    expect.assertions(6)

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

    // Retrieve the file as a stream
    const streamResult = await storageService.stream(key)

    expect(streamResult.success).toBe(true)

    if (!streamResult.success) {
      throw new Error('Get stream failed')
    }

    // Use the streamToBytes utility
    const retrievedBytes = await streamToBytes(streamResult.data)

    // Verify we get the same data back
    expect(retrievedBytes).toBeInstanceOf(Uint8Array)
    expect(retrievedBytes).toStrictEqual(originalBytes)
    expect(retrievedBytes).toHaveLength(originalBytes.length)

    console.log('streamToBytes utility working correctly')

    // Clean up
    const deleteResult = await storageService.delete(key)

    expect(deleteResult.success).toBe(true)
  })
})
