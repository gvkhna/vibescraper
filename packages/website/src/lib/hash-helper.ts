import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils'
import { stringify } from 'safe-stable-stringify'

/** Hash a Uint8Array and return lowercase hex */
export const hashBytes = (bytes: Uint8Array): string => bytesToHex(sha256(bytes))

/** Hash a text string (UTF‑8) */
export const hashString = (text: string): string => hashBytes(utf8ToBytes(text))

/** Hash arbitrary JSON‐serialisable data deterministically */
export function hashJson(value: unknown): string | null {
  // Basic approach: JSON.stringify.  If you need field‑order stability
  // for object literals created by humans, use a "stable stringify" lib.
  const json = stringify(value)
  if (json) {
    return hashString(json)
  }
  return null
}
