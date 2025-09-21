import {
  brotliCompress,
  brotliCompressSync,
  brotliDecompress,
  brotliDecompressSync,
  constants,
  gunzip,
  gunzipSync,
  gzip,
  gzipSync
} from 'node:zlib'

export type CompressionParam = 'max' | 'min' | 'default' | number

/**
 * Compress bytes using Brotli and return Uint8Array
 */
export function brotliCompressBytesSync(
  input: Uint8Array,
  quality: CompressionParam = 'default'
): Uint8Array {
  let q = constants.BROTLI_DEFAULT_QUALITY
  switch (quality) {
    case 'max':
      q = constants.BROTLI_MAX_QUALITY
      break
    case 'min':
      q = constants.BROTLI_MIN_QUALITY
      break
    default:
      if (typeof quality === 'number' && quality > 0 && quality < 12) {
        q = quality
      }
  }
  const buffer = brotliCompressSync(input, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: q
    }
  })
  return new Uint8Array(buffer)
}

/** Async Brotli compression (Promise<Uint8Array>) */
export function brotliCompressBytes(
  input: Uint8Array,
  quality: CompressionParam = 'default'
): Promise<Uint8Array> {
  let q = constants.BROTLI_DEFAULT_QUALITY
  switch (quality) {
    case 'max':
      q = constants.BROTLI_MAX_QUALITY
      break
    case 'min':
      q = constants.BROTLI_MIN_QUALITY
      break
    default:
      if (typeof quality === 'number' && quality > 0 && quality < 12) {
        q = quality
      }
  }
  return new Promise((resolve, reject) => {
    brotliCompress(
      input,
      {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: q
        }
      },
      (err, buffer) => {
        if (err) {
          reject(err)
          return
        }
        resolve(new Uint8Array(buffer))
      }
    )
  })
}

/** Sync Brotli decompression */
export function brotliDecompressBytesSync(input: Uint8Array): Uint8Array {
  const buffer = brotliDecompressSync(input)
  return new Uint8Array(buffer)
}

/** Async Brotli decompression */
export function brotliDecompressBytes(input: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    brotliDecompress(input, (err, buffer) => {
      if (err) {
        reject(err)
        return
      }
      resolve(new Uint8Array(buffer))
    })
  })
}

/** Sync Gzip compression */
export function gzipCompressBytesSync(input: Uint8Array, level: CompressionParam = 'default'): Uint8Array {
  let l = constants.Z_DEFAULT_LEVEL
  switch (level) {
    case 'max':
      l = constants.Z_BEST_COMPRESSION
      break
    case 'min':
      l = constants.Z_MIN_LEVEL
      break
    default:
      if (typeof level === 'number' && level > 0 && level < 10) {
        l = level
      }
  }
  const buffer = gzipSync(input, { level: l })
  return new Uint8Array(buffer)
}

/** Async Gzip compression */
export function gzipCompressBytes(
  input: Uint8Array,
  level: CompressionParam = 'default'
): Promise<Uint8Array> {
  let l = constants.Z_DEFAULT_LEVEL
  switch (level) {
    case 'max':
      l = constants.Z_BEST_COMPRESSION
      break
    case 'min':
      l = constants.Z_MIN_LEVEL
      break
    default:
      if (typeof level === 'number' && level > 0 && level < 10) {
        l = level
      }
  }
  return new Promise((resolve, reject) => {
    gzip(input, { level: l }, (err, buffer) => {
      if (err) {
        reject(err)
        return
      }
      resolve(new Uint8Array(buffer))
    })
  })
}

/** Sync Gzip decompression */
export function gzipDecompressBytesSync(input: Uint8Array): Uint8Array {
  const buffer = gunzipSync(input)
  return new Uint8Array(buffer)
}

/** Async Gzip decompression */
export function gzipDecompressBytes(input: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    gunzip(input, (err, buffer) => {
      if (err) {
        reject(err)
        return
      }
      resolve(new Uint8Array(buffer))
    })
  })
}
