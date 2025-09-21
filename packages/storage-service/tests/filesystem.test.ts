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

describe('storageService - Filesystem', () => {
  let storageService: StorageService
  const tmpDir = path.join(__dirname, '..', 'tmp', 'test-storage')

  beforeAll(() => {
    // Create tmp directory if it doesn't exist
    fs.mkdirSync(tmpDir, { recursive: true })

    // Initialize storage service with filesystem config
    const config: FilesystemStorageConfig = {
      STORAGE_PROVIDER: 'filesystem',
      STORAGE_BASE_PATH: tmpDir
    }

    storageService = new StorageService(config)
  })

  afterAll(async () => {
    // Cleanup
    await storageService.cleanup()

    // Optionally remove tmp directory after tests
    // fs.rmSync(tmpDir, {recursive: true, force: true})
  })

  it('should store and retrieve the same file data', async () => {
    expect.assertions(10)

    // Read the test image file
    const originalBytes = readFixture('image.jpg')

    // Store the file
    const storeResult = await storageService.store(originalBytes)

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('Store failed')
    }

    const key = storeResult.data

    expect(key).toBeDefined()
    expect(key.length).toBeGreaterThan(0)

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

    // Verify the file exists in the filesystem with the expected structure
    const expectedPath = storageService.keyToPath(key)
    const fullPath = path.join(tmpDir, expectedPath)

    expect(fs.existsSync(fullPath)).toBe(true)

    // Clean up the test file
    const deleteResult = await storageService.delete(key)

    expect(deleteResult.success).toBe(true)
    expect(fs.existsSync(fullPath)).toBe(false)
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
  })

  it('should store and retrieve file as stream', async () => {
    expect.hasAssertions()

    // Read the test image file
    const originalBytes = readFixture('image.jpg')

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
  })

  it('should work with streamToBytes utility', async () => {
    expect.assertions(6)

    // Read the test image file
    const originalBytes = readFixture('image.jpg')

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

    // Clean up
    const deleteResult = await storageService.delete(key)

    expect(deleteResult.success).toBe(true)
  })

  it('should store File objects with metadata extraction', async () => {
    expect.assertions(13)

    // Read the test image file
    const imagePath = path.join(__dirname, '..', 'fixtures', 'image.jpg')
    const fileBuffer = fs.readFileSync(imagePath)

    // Create a File-like object (since we're in Node.js, we'll create a compatible object)
    const file = new File([fileBuffer], 'test-image.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    })

    // Store the file using the convenience method
    const storeResult = await storageService.storeFile(file)

    expect(storeResult.success).toBe(true)

    if (!storeResult.success) {
      throw new Error('Store file failed')
    }

    const metadata = storeResult.data

    // Verify metadata
    expect(metadata.key).toBeDefined()

    expect(metadata.key.length).toBeGreaterThan(0)

    expect(metadata.filename).toBe('test-image.jpg')
    expect(metadata.filesize).toBe(fileBuffer.length)
    expect(metadata.mimeType).toBe('image/jpeg')
    expect(metadata.hash).toBeDefined()

    expect(metadata.hash.length).toBeGreaterThan(0)

    expect(metadata.hash).toHaveLength(64) // SHA256 hash is 64 hex chars
    expect(metadata.lastModified).toBeInstanceOf(Date)

    // Verify we can retrieve the file using the key
    const getResult = await storageService.retrieve(metadata.key)

    expect(getResult.success).toBe(true)

    if (!getResult.success) {
      throw new Error('Get failed')
    }

    const retrievedBytes = getResult.data

    expect(retrievedBytes).toHaveLength(fileBuffer.length)

    // Clean up
    const deleteResult = await storageService.delete(metadata.key)

    expect(deleteResult.success).toBe(true)
  })
})
