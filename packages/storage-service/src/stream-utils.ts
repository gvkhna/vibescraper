/**
 * Utility functions for working with ReadableStreams
 */

/**
 * Read all chunks from a ReadableStream and combine into a single Uint8Array
 */
export async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  try {
    while (true) {
      const {done, value} = await reader.read()
      if (done) {
        break
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  // Calculate total length
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)

  // Combine all chunks into a single Uint8Array
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}

/**
 * Create a ReadableStream from a Uint8Array
 */
export function bytesToStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    }
  })
}
