import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils'
import { stringify } from 'safe-stable-stringify'

/** Hash a text string (UTF-8) */
export function hashString(text: string): string {
  return bytesToHex(sha256(utf8ToBytes(text)))
}

/** Hash arbitrary JSON-serialisable data deterministically */
export function hashJson(value: unknown): string | null {
  const json = stringify(value)
  if (json) {
    return hashString(json)
  }
  return null
}
