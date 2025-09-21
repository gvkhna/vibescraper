import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex } from '@noble/hashes/utils'

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function shortid<T = string>(length = 6): T {
  const byteCount = Math.ceil(length / 2)
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(byteCount))
  return bytesToHex(bytes).slice(0, length) as unknown as T
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const LETTERS_DIGITS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function getRandomChar(alphabet: string): string {
  const rand = globalThis.crypto.getRandomValues(new Uint8Array(1))[0]
  return alphabet[rand % alphabet.length]
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function alphanumericShortPublicId<T = string>(length = 12): T {
  if (length < 1) {
    throw new Error('Length must be at least 1')
  }

  const first = getRandomChar(LETTERS)
  let rest = ''
  for (let i = 1; i < length; i++) {
    rest += getRandomChar(LETTERS_DIGITS)
  }
  return (first + rest) as unknown as T
}

function fromHash(hash: Uint8Array, length: number): string {
  let output = ''
  let offset = 0

  // First character = letter
  output += LETTERS[hash[offset++] % LETTERS.length]

  for (let i = 1; i < length; i++) {
    output += LETTERS_DIGITS[hash[offset++ % hash.length] % LETTERS_DIGITS.length]
  }

  return output
}

export function deterministicUrlSafeHash(input: string, length = 12): string {
  const hash = sha256(new TextEncoder().encode(input))
  return fromHash(hash, length)
}
