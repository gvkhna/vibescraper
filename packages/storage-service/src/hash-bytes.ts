import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex } from '@noble/hashes/utils'

/** Hash a Uint8Array and return lowercase hex */
export function hashBytes(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes))
}
