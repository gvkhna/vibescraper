import debug from 'debug'
import type { Context } from 'hono'
import type { ReadStream, Stats } from 'node:fs'
import { createReadStream, lstatSync } from 'node:fs'

import { getContentDisposition, getMimeType, isCompressibleContentType } from './mime-utils'
import type { FileMetadata, ServeOptions } from './storage-service'

const log = debug('app:server:serve-static')

const createStreamBody = (stream: ReadStream) => {
  const body = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => {
        controller.enqueue(chunk)
      })
      stream.on('end', () => {
        controller.close()
      })
      stream.on('error', (error) => {
        log('Stream error:', error)
        controller.error(error)
      })
    },

    cancel() {
      stream.destroy()
    }
  })
  return body
}

const getStats = (path: string) => {
  let stats: Stats | undefined
  try {
    stats = lstatSync(path)
  } catch (error) {
    //
  }
  return stats
}

/*
  1.Stat & locate the file
  2.Check for precompressed file
  3.Handle If-None-Match -> 304
  4.Set headers (content-type, etag, cache-control, etc)
  5.Handle HEAD/OPTIONS
  6.Range request handling
  7.Send file stream or buffer
  */
export function serveStatic(
  c: Context,
  filePath: string,
  { filename, mimeType, filesize, lastModified, hash, encoding }: Partial<FileMetadata>,
  { download, inline, cacheControl }: ServeOptions
): Response {
  log('serve static resp')

  // ---- 1. Get file stats ----
  const stats = getStats(filePath)
  if (!stats) {
    return c.json({ error: 'File not found' }, 404)
  }

  // ---- 2. Set for encoding ----
  if (encoding) {
    c.header('Content-Encoding', encoding)
    c.header('Vary', 'Accept-Encoding', { append: true })
  }

  // ---- 3. Check If-None-Match for 304 ----
  const etag = hash
  const ifNoneMatch = c.req.header('if-none-match')
  if (ifNoneMatch && ifNoneMatch.replace(/"/g, '') === etag) {
    c.header('ETag', `"${etag}"`)
    if (cacheControl) {
      c.header('Cache-Control', cacheControl)
    }
    if (lastModified instanceof Date) {
      c.header('Last-Modified', lastModified.toUTCString())
    }
    return c.body(null, 304)
  }

  // ---- 4. Set main headers ----
  const resolvedMimeType = mimeType ?? 'application/octet-stream'
  c.header('Content-Type', resolvedMimeType)
  if (download || inline) {
    const dispositionHeader = getContentDisposition({
      mimeType: resolvedMimeType,
      filename,
      download,
      inline
    })
    if (dispositionHeader) {
      c.header('Content-Disposition', dispositionHeader)
    }
  }
  c.header('ETag', `"${etag}"`)
  if (cacheControl) {
    c.header('Cache-Control', cacheControl)
  }
  if (lastModified instanceof Date) {
    c.header('Last-Modified', lastModified.toUTCString())
  }
  c.header('Accept-Ranges', 'bytes')

  // ---- 5. HEAD/OPTIONS special case ----
  const size = stats.size
  if (c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    c.header('Content-Length', size.toString())
    return c.body(null, 200)
  }

  // ---- 6. Range requests ----
  const range = c.req.header('range') ?? ''
  if (range) {
    c.header('Accept-Ranges', 'bytes')
    c.header('Date', stats.birthtime.toUTCString())

    const parts = range.replace(/bytes=/, '').split('-', 2)
    const start = parts[0] ? parseInt(parts[0], 10) : 0
    let end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1
    if (size < end - start + 1) {
      end = size - 1
    }

    const chunksize = end - start + 1
    const stream = createReadStream(filePath, { start, end })

    c.header('Content-Length', chunksize.toString())
    c.header('Content-Range', `bytes ${start}-${end}/${stats.size}`)

    return c.body(createStreamBody(stream), 206)
  }

  // ---- 7. Normal full-file response ----
  c.header('Content-Length', size.toString())
  return c.body(createStreamBody(createReadStream(filePath)), 200)
}
