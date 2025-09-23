import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'

/** Hash a Uint8Array and return lowercase hex */
export function hashBytes(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes))
}
