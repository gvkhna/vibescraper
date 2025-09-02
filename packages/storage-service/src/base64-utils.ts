import {base64} from '@scure/base'

export function encodeBase64(bytes: Uint8Array): string {
  return base64.encode(bytes)
}

export function decodeBase64(encoded: string): Uint8Array {
  return base64.decode(encoded)
}

export function base64ToDataURL(b64: string, contentType: string): string {
  return `data:${contentType};base64,${b64}`
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}
