import {xchacha20poly1305} from '@noble/ciphers/chacha'
import {utf8ToBytes, bytesToUtf8} from '@noble/ciphers/utils'
import {blake2b} from '@noble/hashes/blake2'
import {randomBytes} from '@noble/ciphers/webcrypto'
import {PRIVATE_VARS} from '@/vars.private'
import {base64ToBytes, bytesToBase64} from './binary-utils'
import debug from 'debug'
import {sha256} from '@noble/hashes/sha2'
import {bytesToHex} from '@noble/hashes/utils'

const log = debug('app:crypto-helper')

export function createHashSha256(buffer: Uint8Array): string {
  // noble-hashes returns Uint8Array; convert to hex
  return bytesToHex(sha256(buffer))
  // return Buffer.from(sha256(buffer)).toString('hex')
  // return Buffer.from(sha256(new Uint8Array(buffer))).toString('hex')
}

/**
 * Build a 64-bit signed integer suitable for pg_advisory_xact_lock.
 *
 * • Same (userId, slug, amount, currency)  → same key every time
 * • Different input                         → astronomically unlikely to collide
 */
export function makeAdvisoryLockKey(plain: string): bigint {
  const utf8 = new TextEncoder().encode(plain)

  // 2. 256-bit hash → Uint8Array(32)
  const digest = sha256(utf8)

  // 3. Take the first 8 bytes → 64-bit unsigned bigint
  let key = 0n
  for (let i = 0; i < 8; i++) {
    key = (key << 8n) | BigInt(digest[i])
  }

  // 4. Cast to **signed** 64-bit so it fits pg_advisory_xact_lock
  return BigInt.asIntN(64, key)
}

/**
 * Convert a string to an encryption key
 * Using BLAKE2b (256-bit) as a modern, secure hash function - faster than SHA-3 and as secure
 */
const getKeyFromSecret = (secret: string): Uint8Array => {
  // Use BLAKE2b with 32 bytes (256 bits) output
  return blake2b(utf8ToBytes(secret), {dkLen: 32})
}

/**
 * Encrypt a string
 * Using XChaCha20-Poly1305 - modern AEAD (Authenticated Encryption with Associated Data) cipher
 * that provides strong security, high performance, and is resistant to timing attacks
 */
export const encrypt = async (text: string): Promise<string> => {
  try {
    if (!PRIVATE_VARS.CRYPT_SECRET_KEY) {
      throw new Error('Cannot securely encrypt ciphertext, no crypto secret key found!')
    }

    const key = getKeyFromSecret(PRIVATE_VARS.CRYPT_SECRET_KEY)

    // XChaCha20-Poly1305 uses a 24-byte nonce
    const nonce = randomBytes(24)

    // Create cipher instance
    const cipher = xchacha20poly1305(key, nonce)

    const encrypted = cipher.encrypt(utf8ToBytes(text))
    // Encrypt and authenticate

    // Combine nonce and encrypted data for storage
    const combined = new Uint8Array(nonce.length + encrypted.length)
    combined.set(nonce)
    combined.set(encrypted, nonce.length)

    // Convert to base64 for storage
    const base64Str = bytesToBase64(combined)
    if (!base64Str) {
      throw new Error('Failed to encode encrypted data in base64')
    }
    return base64Str
  } catch (error) {
    log('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt a string
 */
export const decrypt = async (encryptedBase64: string): Promise<string> => {
  try {
    // Convert from base64
    const encryptedData = base64ToBytes(encryptedBase64)

    if (!encryptedData) {
      throw new Error('Decryption failed: Unable to decode base64 string')
    }

    // Extract nonce (first 24 bytes) and ciphertext
    const nonce = encryptedData.slice(0, 24)
    const ciphertext = encryptedData.slice(24)

    if (!PRIVATE_VARS.CRYPT_SECRET_KEY) {
      throw new Error('Cannot securely decrypt ciphertext, no crypto secret key found!')
    }

    // Get the key
    const key = getKeyFromSecret(PRIVATE_VARS.CRYPT_SECRET_KEY)

    // Create cipher instance
    const cipher = xchacha20poly1305(key, nonce)

    // Decrypt and verify authentication
    const decrypted = cipher.decrypt(ciphertext)

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!decrypted) {
      throw new Error('Decryption failed: Authentication failed')
    }

    // Convert back to string
    return bytesToUtf8(decrypted)
  } catch (error) {
    log('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}
