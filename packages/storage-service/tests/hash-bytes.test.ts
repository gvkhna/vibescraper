import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { hashBytes } from '../src/hash-bytes'

import { readFixture } from './read-fixture'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('sha256 hashBytes', () => {
  it('should compute correct SHA256 hash for image file', () => {
    // Expected hash from sha256sum command
    const expectedHash = '3b852b7faaed217e958c20ddc84e9218e5efb2e31af73970327fffe17cfe7c91'

    // Read the test image file
    const fileBytes = readFixture('image.jpg')

    // Compute hash using our function
    const computedHash = hashBytes(fileBytes)

    // Verify the hash matches
    expect(computedHash).toBe(expectedHash)
  })
})
