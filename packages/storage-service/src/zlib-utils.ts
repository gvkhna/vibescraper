import { Duplex, Readable } from 'node:stream'
import {
  brotliCompress,
  brotliCompressSync,
  type BrotliDecompress,
  brotliDecompress,
  brotliDecompressSync,
  type BrotliOptions,
  constants,
  createBrotliDecompress,
  createGunzip,
  type Gunzip,
  gunzip,
  gunzipSync,
  gzip,
  gzipSync,
  type ZlibOptions
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

class BrotliTransformStream<T extends Uint8Array> implements TransformStream<T, T> {
  public readonly readable: ReadableStream<T>
  public readonly writable: WritableStream<T>

  private readonly node: BrotliDecompress

  constructor(options?: BrotliOptions) {
    const decompress = createBrotliDecompress(options)
    const pair = Duplex.toWeb(decompress) as ReadableWritablePair<T>
    this.readable = pair.readable
    this.writable = pair.writable
    this.node = decompress

    // this.readable = new ReadableStream<T>({
    //   start(controller) {
    //     decompress.on('data', (chunk: T) => {
    //       controller.enqueue(chunk)
    //     })
    //     decompress.on('end', () => {
    //       controller.close()
    //     })
    //     decompress.on('error', (err: unknown) => {
    //       controller.error(err)
    //     })
    //   }
    // })

    // this.writable = new WritableStream<T>({
    //   write(chunk: T) {
    //     // Node zlib transform streams accept Buffer/Uint8Array
    //     decompress.write(chunk)
    //   },
    //   close() {
    //     decompress.end()
    //   },
    //   abort(reason) {
    //     // Best-effort: convert to Error for destroy
    //     const err = reason instanceof Error ? reason : new Error(String(reason))
    //     decompress.destroy(err)
    //   }
    // })
  }
  destroy(error?: Error) {
    this.node.destroy(error)
  }
}

/**
 * Streaming Brotli decompression.
 * Accepts a Web ReadableStream<Uint8Array> and returns a Web ReadableStream<Uint8Array>.
 */
export function brotliDecompressStream<T extends Uint8Array>(
  input: ReadableStream<T>,
  options?: BrotliOptions
): ReadableStream<T> {
  return input.pipeThrough(new BrotliTransformStream<T>(options))
}

class GzipTransformStream<T extends Uint8Array> implements TransformStream<T, T> {
  public readonly readable: ReadableStream<T>
  public readonly writable: WritableStream<T>

  private readonly node: Gunzip

  constructor(options?: ZlibOptions) {
    const decompress = createGunzip(options)
    const pair = Duplex.toWeb(decompress) as ReadableWritablePair<T>
    this.readable = pair.readable
    this.writable = pair.writable
    this.node = decompress

    // this.readable = new ReadableStream<T>({
    //   start(controller) {
    //     decompress.on('data', (chunk: T) => {
    //       controller.enqueue(chunk)
    //     })
    //     decompress.on('end', () => {
    //       controller.close()
    //     })
    //     decompress.on('error', (err: unknown) => {
    //       controller.error(err)
    //     })
    //   }
    // })

    // this.writable = new WritableStream<T>({
    //   write(chunk: T) {
    //     // Node zlib transform streams accept Buffer/Uint8Array
    //     decompress.write(chunk)
    //   },
    //   close() {
    //     decompress.end()
    //   },
    //   abort(reason) {
    //     // Best-effort: convert to Error for destroy
    //     const err = reason instanceof Error ? reason : new Error(String(reason))
    //     decompress.destroy(err)
    //   }
    // })
  }
  destroy(error?: Error) {
    this.node.destroy(error)
  }
}

/**
 * Streaming Gzip decompression.
 * Accepts a Web ReadableStream<Uint8Array> and returns a Web ReadableStream<Uint8Array>.
 */
export function gzipDecompressStream<T extends Uint8Array>(
  input: ReadableStream<T>,
  options?: ZlibOptions
): ReadableStream<T> {
  return input.pipeThrough(new GzipTransformStream<T>(options))
  // const nodeIn = Readable.fromWeb(input as unknown as ReadableStream)
  // const transformed = nodeIn.pipe(createGunzip(options))
  // return Readable.toWeb(transformed) as unknown as ReadableStream<Uint8Array>
}

// /**
//  * A Web Streams-compatible transform (readable + writable) for Brotli decompression.
//  *
//  * Usage: webReadable.pipeThrough(new BrotliDecompressTransform())
//  */
// export class BrotliDecompressTransform implements ReadableWritablePair<Uint8Array, Uint8Array> {
//   public readonly readable: ReadableStream<Uint8Array>
//   public readonly writable: WritableStream<Uint8Array>

//   // Keep a reference if callers need to interact or destroy manually
//   private readonly node: import('node:stream').Duplex

//   constructor(options?: BrotliOptions) {
//     const z = createBrotliDecompress(options)
//     const pair = Duplex.toWeb(z)
//     this.readable = pair.readable as unknown as ReadableStream<Uint8Array>
//     this.writable = pair.writable as unknown as WritableStream<Uint8Array>
//     this.node = z
//   }

//   /** Optional helper to destroy the underlying node stream */
//   destroy(error?: Error) {
//     this.node.destroy(error)
//   }
// }
