import {Buffer} from 'node:buffer'
import debug from 'debug'
// import fromBase64 from 'core-js-pure/actual/typed-array/from-base64'
// import toBase64 from 'core-js-pure/actual/typed-array/to-base64'
// TODO: Use es-shim https://github.com/es-shims/es-arraybuffer-base64
const log = debug('app:binary-utils')

// interface PolyfilledUint8ArrayConstructor {
//   fromBase64?: (base64: string) => Uint8Array
// }
// interface PolyfilledUint8Array {
//   toBase64?: () => string
// }

export type BinarySource = Buffer | ArrayBufferLike | ArrayBufferView | ArrayLike<number>

export function bufferToBytes(buffer: BinarySource): Uint8Array {
  // 1. Already a Uint8Array?  Return a *copy* so callers can mutate safely.
  if (buffer instanceof Uint8Array) {
    return new Uint8Array(buffer)
  } else if (ArrayBuffer.isView(buffer)) {
    // 2. Any other view (DataView, Int32Array, Node Buffer…)
    return new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength // preserves the original slice
    )
  } else if (buffer instanceof ArrayBuffer || buffer instanceof SharedArrayBuffer) {
    // 3. Raw ArrayBuffer / SharedArrayBuffer
    return new Uint8Array(buffer)
  } else {
    // 4. Fallback for plain Array-likes (rare)
    return Uint8Array.from(buffer)
  }
}

export function bufferToFile(buffer: BinarySource, name: string, mimeType: string): File {
  const bytes = bufferToBytes(buffer)
  return new File([bytes as never], name, {type: mimeType})
}

export function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer | SharedArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteLength + bytes.byteOffset)
}

export function bytesToBlob(bytes: Uint8Array, mimeType: string): Blob {
  return new Blob([bytes as never], {type: mimeType})
}

export async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return bufferToBytes(await blob.arrayBuffer())
}

export function bytesToFile(bytes: Uint8Array, {name, mimeType}: {name: string; mimeType: string}): File {
  return new File([bytes as never], name, {type: mimeType})
}

export function fileToBytes(file: File): Promise<Uint8Array> {
  return blobToBytes(file)
}

export function base64ToDataURL(b64: string, contentType: string): string {
  return `data:${contentType};base64,${b64}`
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function base64ToBytes(base64: string): Uint8Array | null {
  // log('frombase64', fromBase64)
  try {
    // const Ctor = Uint8Array as typeof Uint8Array & {fromBase64?: (base64: string) => Uint8Array}
    // if (typeof Ctor.fromBase64 === 'function') {
    //   return Ctor.fromBase64(base64)
    // } else {
    //   // fallback to polyfill
    //   return fromBase64(base64)
    // }
    // Uint8Array.fromBase64(base64)
    if (typeof Buffer !== 'undefined') {
      // Node or Deno with Node compatibility
      return Uint8Array.from(Buffer.from(base64, 'base64'))
    } else if (typeof globalThis.atob !== 'undefined') {
      // Browser
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const binary = globalThis.atob(base64)
      const len = binary.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    } else {
      throw new Error('Base64 decoding not supported in this environment')
    }
  } catch (e) {
    log('Base64 decoding to buffer not supported', e)
    return null
  }
}

export function bytesToBase64(bytes: Uint8Array): string | null {
  try {
    // const typeOverride = bytes as PolyfilledUint8Array
    // // Uint8Array.prototype.toBase64(data)
    // if (typeof typeOverride.toBase64 === 'function') {
    //   return typeOverride.toBase64()
    // } else {
    //   // fallback to polyfill
    //   return toBase64(bytes)
    // }
    if (typeof Buffer !== 'undefined') {
      // Node or Deno with Node compat
      return Buffer.from(bytes).toString('base64')
    } else if (typeof globalThis.btoa !== 'undefined') {
      // Browser
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      return globalThis.btoa(binary)
    } else {
      throw new Error('Base64 encoding not supported in this environment')
    }
  } catch (e) {
    log('Base64 encoding a buffer not supported', e)
    return null
  }
}

// -- google web dev article about encoding emoji
// https://web.dev/articles/base64-encoding

// From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
// function base64ToBytes(base64) {
//   const binString = atob(base64)
//   return Uint8Array.from(binString, (m) => m.codePointAt(0))
// }

// // From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
// function bytesToBase64(bytes) {
//   const binString = String.fromCodePoint(...bytes)
//   return btoa(binString)
// }

// // Quick polyfill since Firefox and Opera do not yet support isWellFormed().
// // encodeURIComponent() throws an error for lone surrogates, which is essentially the same.
// function isWellFormed(str) {
//   if (typeof str.isWellFormed != 'undefined') {
//     // Use the newer isWellFormed() feature.
//     return str.isWellFormed()
//   } else {
//     // Use the older encodeURIComponent().
//     try {
//       encodeURIComponent(str)
//       return true
//     } catch (error) {
//       return false
//     }
//   }
// }

// const validUTF16String = 'hello⛳❤️🧀'
// const partiallyInvalidUTF16String = 'hello⛳❤️🧀\uDE75'

// if (isWellFormed(validUTF16String)) {
//   // This will work. It will print:
//   // Encoded string: [aGVsbG/im7PinaTvuI/wn6eA]
//   const validUTF16StringEncoded = bytesToBase64(new TextEncoder().encode(validUTF16String))
//   console.log(`Encoded string: [${validUTF16StringEncoded}]`)

//   // This will work. It will print:
//   // Decoded string: [hello⛳❤️🧀]
//   const validUTF16StringDecoded = new TextDecoder().decode(base64ToBytes(validUTF16StringEncoded))
//   console.log(`Decoded string: [${validUTF16StringDecoded}]`)
// } else {
//   // Not reached in this example.
// }

// if (isWellFormed(partiallyInvalidUTF16String)) {
//   // Not reached in this example.
// } else {
//   // This is not a well-formed string, so we handle that case.
//   console.log(`Cannot process a string with lone surrogates: [${partiallyInvalidUTF16String}]`)
// }
