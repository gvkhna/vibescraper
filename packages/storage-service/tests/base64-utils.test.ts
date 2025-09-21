import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { decodeBase64, encodeBase64 } from '../src/base64-utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('base64-utils', () => {
  it('should handle round-trip encoding/decoding of image file', () => {
    // Read the test image file
    const imagePath = path.join(__dirname, '..', 'fixtures', 'image.jpg')
    const fileBuffer = fs.readFileSync(imagePath)
    const originalBytes = new Uint8Array(fileBuffer)

    // Encode to base64
    const encoded = encodeBase64(originalBytes)

    // Decode back to bytes
    const decodedBytes = decodeBase64(encoded)

    // Verify we get the exact same data back
    expect(decodedBytes).toStrictEqual(originalBytes)
    expect(decodedBytes).toHaveLength(originalBytes.length)
  })
})
