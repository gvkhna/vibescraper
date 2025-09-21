// import {getFilePath, getFilePathWithoutDefaultDocument} from 'hono/utils/filepath'
// import {createReadStream, lstatSync} from 'node:fs'
// import type {ReadStream, Stats} from 'node:fs'
// import {HttpStatusCode} from '@/lib/http-status-codes'
import debug from 'debug'
import type { Context } from 'hono'
import { stream as honoStream } from 'hono/streaming'

// import type {HonoServer} from '..'
import { getContentDisposition, getMimeType, isCompressibleContentType } from './mime-utils'
import type { FileMetadata, ServeOptions } from './storage-service'

const log = debug('app:server:serve-static')

// const createStreamBody = (stream: ReadStream) => {
//   const body = new ReadableStream({
//     start(controller) {
//       stream.on('data', (chunk) => {
//         controller.enqueue(chunk)
//       })
//       stream.on('end', () => {
//         controller.close()
//       })
//     },

//     cancel() {
//       stream.destroy()
//     }
//   })
//   return body
// }

// const getStats = (path: string) => {
//   let stats: Stats | undefined
//   try {
//     stats = lstatSync(path)
//   } catch (error) {
//     //
//   }
//   return stats
// }

/*
  1.Stat & locate the file
  2.Check for precompressed file
  3.Handle If-None-Match -> 304
  4.Set headers (content-type, etag, cache-control, etc)
  5.Handle HEAD/OPTIONS
  6.Range request handling
  7.Send file stream or buffer
  */
export function serveStream(
  c: Context,
  fileStream: ReadableStream,
  { filename, mimeType, filesize, lastModified, hash }: Partial<FileMetadata>,
  { download, inline, cacheControl }: ServeOptions
): Response {
  log('serve stream resp')

  // ---- 1. Get file stats ----
  // const stats = getStats(filePath)
  // if (!stats) {
  //   return c.json({error: 'File not found'}, HttpStatusCode.NotFound)
  // }

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

    // if (contentEncoding) {
    //   c.header('Content-Encoding', contentEncoding)
    // }
    // c.header('Vary', 'Accept-Encoding')
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
  // if (contentEncoding) {
  //   c.header('Content-Encoding', contentEncoding)
  // }
  // if (isCompressible) {
  //   c.header('Vary', 'Accept-Encoding')
  // }

  // ---- 5. HEAD/OPTIONS special case ----
  if (c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    if (typeof filesize === 'bigint' || typeof filesize === 'number') {
      c.header('Content-Length', filesize.toString())
    }
    return c.body(null, 200)
  }

  // ---- 6. Range requests ----
  // const range = c.req.header('range') ?? ''
  // if (range) {
  //   c.header('Accept-Ranges', 'bytes')
  //   c.header('Date', stats.birthtime.toUTCString())

  //   const parts = range.replace(/bytes=/, '').split('-', 2)
  //   const start = parts[0] ? parseInt(parts[0], 10) : 0
  //   let end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1
  //   if (size < end - start + 1) {
  //     end = size - 1
  //   }

  //   const chunksize = end - start + 1
  //   const stream = createReadStream(filePath, {start, end})

  //   c.header('Content-Length', chunksize.toString())
  //   c.header('Content-Range', `bytes ${start}-${end}/${stats.size}`)

  //   return c.body(createStreamBody(stream), HttpStatusCode.PartialContent)
  // }

  // ---- 7. Normal full-file response ----
  if (typeof filesize === 'bigint' || typeof filesize === 'number') {
    c.header('Content-Length', filesize.toString())
  }
  return honoStream(c, async (stream) => {
    // Write a process to be executed when aborted.
    stream.onAbort(() => {
      log('Aborted!')
    })
    await stream.pipe(fileStream)
  })
}
