import {Hono} from 'hono'
import {stream as honoStream} from 'hono/streaming'
import type {HonoServer} from '..'
import * as schema from '@/db/schema'
import {serveStatic} from './serve-static'
import {serveStream} from './serve-stream'
import {eq as sqlEq, and as sqlAnd} from 'drizzle-orm'
import fs from 'node:fs'
import {db as database} from '@/db/db'
import {join as pathJoin, dirname as pathDirname, resolve as pathResolve} from 'node:path'
import {S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3'
import {fileURLToPath} from 'node:url'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {sqlTimestampToDate} from '@/lib/format-dates'
import {PRIVATE_VARS} from '@/vars.private'
import {FetchHttpHandler} from '@smithy/fetch-http-handler'
import {type BrowserClient} from '@smithy/types'

import debug from 'debug'
import {hashBytes} from '@/lib/hash-helper'

const log = debug('app:server:storage')

const __filename = fileURLToPath(import.meta.url)
const __dirname = pathDirname(__filename)
const __cwd = globalThis.process.cwd()

const USING_CLOUD_BUCKET = PRIVATE_VARS.STORAGE_PROVIDER === 'bucket'
export const localDevBlobsDir = pathResolve(__cwd, 'storage')

if (USING_CLOUD_BUCKET) {
  log('Serving storage from ', PRIVATE_VARS.AWS_S3_ENDPOINT)
} else {
  log('Serving storage from ', localDevBlobsDir)
}

// AWS S3 / Cloudflare R2 Configuration
const s3Client = new S3Client({
  region: PRIVATE_VARS.AWS_REGION ?? 'auto',
  endpoint: PRIVATE_VARS.AWS_S3_ENDPOINT ?? '',
  credentials: {
    accessKeyId: PRIVATE_VARS.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: PRIVATE_VARS.AWS_SECRET_ACCESS_KEY ?? ''
  },
  forcePathStyle: PRIVATE_VARS.AWS_FORCE_PATH_STYLE === 'true',
  requestHandler: new FetchHttpHandler({})
}) as BrowserClient<S3Client>

function storageKeyToPath(key: string) {
  // aa/xx/yy/full-uuid
  return pathJoin(key.slice(0, 2), key.slice(2, 4), key.slice(4, 6), key)
}

function generateStorageKey() {
  const uuid = globalThis.crypto.randomUUID().replace(/-/g, '').toLowerCase() // Remove dashes and lowercase
  return {
    fileId: uuid,
    storagePath: storageKeyToPath(uuid)
  }
}

async function getFile(key: string): Promise<Uint8Array> {
  const storagePath = storageKeyToPath(key)
  if (USING_CLOUD_BUCKET) {
    const command = new GetObjectCommand({
      Bucket: PRIVATE_VARS.AWS_BUCKET_NAME,
      Key: storagePath
    })

    try {
      const response = await s3Client.send(command)
      if (!response.Body) {
        throw new Error('No body in S3 response')
      }
      const bytes = await response.Body.transformToByteArray()
      return bytes
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log('S3 get error:', message)
      throw new Error(`Failed to get file from S3: ${message}`)
    }
  } else {
    log('blobs dir key', localDevBlobsDir, key, storagePath)
    // Retrieve from local storage
    const filePath = pathJoin(localDevBlobsDir, storagePath)
    try {
      const buffer = fs.readFileSync(filePath)
      return new Uint8Array(buffer)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read file from local storage: ${error.message}`)
      } else {
        throw new Error(`Failed to read file from local storage: ${error}`)
      }
    }
  }
}

async function getFileStream(key: string) {
  const storagePath = storageKeyToPath(key)
  if (USING_CLOUD_BUCKET) {
    const command = new GetObjectCommand({
      Bucket: PRIVATE_VARS.AWS_BUCKET_NAME,
      Key: storagePath
    })

    try {
      const response = await s3Client.send(command)
      if (!response.Body) {
        throw new Error('No body in S3 response')
      }
      return response.Body.transformToWebStream()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log('S3 get error:', message)
      throw new Error(`Failed to get file from S3: ${message}`)
    }
  } else {
    log('blobs dir key', localDevBlobsDir, key, storagePath)
    // Retrieve from local storage
    const filePath = pathJoin(localDevBlobsDir, storagePath)
    try {
      const buffer = fs.readFileSync(filePath)
      const bytes = new Uint8Array(buffer)
      let offset = 0
      return new ReadableStream({
        pull(controller) {
          // Send the whole buffer as a single chunk
          if (offset < bytes.length) {
            controller.enqueue(bytes)
            offset = bytes.length
          }
          controller.close()
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read file from local storage: ${error.message}`)
      } else {
        throw new Error(`Failed to read file from local storage: ${error}`)
      }
    }
  }
}

async function storeFile(buffer: ArrayBuffer, contentType?: string) {
  const {fileId, storagePath} = generateStorageKey()
  const bytes = new Uint8Array(buffer)
  if (USING_CLOUD_BUCKET) {
    const command = new PutObjectCommand({
      Bucket: PRIVATE_VARS.AWS_BUCKET_NAME,
      Key: storagePath,
      Body: bytes,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000'
    })

    try {
      await s3Client.send(command)
      // if (config.publicUrl) {
      // return `${config.publicUrl}/${fileId}`
      // }
      return fileId
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log('S3 put error:', message)
      throw new Error(`Failed to store file in S3: ${message}`)
    }

    // await s3Client.send(command)
    // return `https://${import.meta.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileId}`
  } else {
    // Store locally
    const filePath = pathJoin(localDevBlobsDir, storagePath)
    fs.mkdirSync(pathDirname(filePath), {recursive: true})
    fs.writeFileSync(filePath, bytes)
    return fileId
  }
}

export async function storageGetBlob(db: typeof database, storageItem: typeof schema.storage.$inferSelect) {
  const buffer = await getFile(storageItem.key)
  return buffer
}

export async function storageDeleteBlob(
  db: typeof database,
  storageBlob: typeof schema.storage.$inferSelect
) {
  const key = storageBlob.key
  const storagePath = storageKeyToPath(key)
  // Delete the file
  if (USING_CLOUD_BUCKET) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: PRIVATE_VARS.AWS_BUCKET_NAME,
        Key: storagePath
      })
      await s3Client.send(command)
    } catch (error) {
      log('S3 delete error', error)
      // Not fatal-still try to delete DB row
    }
  } else {
    const filePath = pathJoin(localDevBlobsDir, storagePath)
    try {
      fs.unlinkSync(filePath)
    } catch (err) {
      log('Local file delete error', err)
      // Not fatal-still try to delete DB row
    }
  }

  // Delete the row from the database
  await db.delete(schema.storage).where(sqlEq(schema.storage.key, key))
}

export async function storagePutFile(db: typeof database, file: File) {
  const buffer = await file.arrayBuffer()
  log('buffer', buffer)
  const bytes = new Uint8Array(buffer)
  log('bytes', bytes)
  const hash = hashBytes(bytes)
  const fileId = await storeFile(buffer, file.type)

  const [storageItem] = await db
    .insert(schema.storage)
    .values({
      key: fileId as schema.StorageKey,
      filename: file.name,
      filesize: BigInt(file.size),
      mimeType: file.type,
      sha256hash: hash
    })
    .returning()
  return storageItem
}

export function storageBlobEndpoint(publicId: schema.StoragePublicId) {
  return `/api/storage/${publicId}`
}

export function storageKeyEndpoint(key: schema.StorageKey) {
  return `/api/storage/blob/${key}`
}

const app = new Hono<HonoServer>()
  .post('/new', async (c) => {
    log('hono storage new')
    const db = c.get('db')
    const {file} = await c.req.parseBody()

    log('one file being uploaded', file)
    if (file instanceof File) {
      const newBlob = await storagePutFile(db, file)
      const {id: _, ...blob} = newBlob
      return c.json(
        {
          ...blob
        },
        HttpStatusCode.Ok
      )
    }

    return c.json({}, HttpStatusCode.BadRequest)
  })
  .get('/:storagePublicId', async (c) => {
    const db = c.get('db')
    const storagePublicId = c.req.param('storagePublicId')
    const searchParams = new URL(c.req.url).search

    log('get storage public id', storagePublicId)

    const storageBlob = await db.query.storage.findFirst({
      where: (table, {eq}) => eq(schema.storage.publicId, storagePublicId as schema.StoragePublicId)
    })

    log('storage blob', storageBlob)

    if (!storageBlob) {
      log('file not found')
      return c.json({error: 'File not found'}, HttpStatusCode.NotFound)
    }
    return c.redirect(`/api/storage/blob/${storageBlob.key}${searchParams}`)
  })
  // .delete('/:storagePublicId', async (c) => {

  // })
  .get('/blob-stream/:storageKey', async (c) => {
    // this endpoint is for testing
    if (USING_CLOUD_BUCKET) {
      return c.json({error: 'Api item not found'}, HttpStatusCode.NotFound)
    } else {
      const db = c.get('db')
      const storageKey = c.req.param('storageKey')

      const storageBlob = await db.query.storage.findFirst({
        where: (table, {eq}) => eq(schema.storage.key, storageKey as schema.StorageKey)
      })

      if (!storageBlob) {
        log('file not found')
        return c.json({error: 'Storage item not found'}, HttpStatusCode.NotFound)
      }

      const storagePath = storageKeyToPath(storageKey)

      const filesize = storageBlob.filesize
      const mimeType = storageBlob.mimeType
      const hash = storageBlob.sha256hash
      const uploadedAt = sqlTimestampToDate(storageBlob.createdAt)

      const fileStream = await getFileStream(storageKey)

      const resolvedMimeType = mimeType || 'application/octet-stream'
      c.header('Content-Type', resolvedMimeType)
      c.header('Content-Length', filesize.toString())

      return honoStream(c, async (stream) => {
        // Write a process to be executed when aborted.
        stream.onAbort(() => {
          log('Aborted!')
        })
        // Write a Uint8Array.
        // await stream.write(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]))
        // Pipe a readable stream.
        await stream.pipe(fileStream)
      })
    }
  })
  .get('/blob/:storageKey', async (c) => {
    const db = c.get('db')
    const storageKey = c.req.param('storageKey')
    const {download: queryDownload, inline: queryInline, filename: queryFilename} = c.req.query()

    const storageBlob = await db.query.storage.findFirst({
      where: (table, {eq}) => eq(schema.storage.key, storageKey as schema.StorageKey)
    })

    if (!storageBlob) {
      log('file not found')
      return c.json({error: 'Storage item not found'}, HttpStatusCode.NotFound)
    }
    const storagePath = storageKeyToPath(storageKey)

    const download = queryDownload === '1' || queryDownload === 'true' ? true : false
    const inline = queryInline === '1' || queryInline === 'true' ? true : false
    const filename = queryFilename ? queryFilename : storageBlob.filename
    const filesize = storageBlob.filesize
    const mimeType = storageBlob.mimeType
    const hash = storageBlob.sha256hash
    const uploadedAt = sqlTimestampToDate(storageBlob.createdAt)

    if (USING_CLOUD_BUCKET) {
      const fileStream = await getFileStream(storageKey)
      return serveStream(c, fileStream, {
        download,
        inline,
        filename,
        filesize,
        mimeType,
        uploadedAt,
        hash
      })
    } else {
      const filePath = pathJoin(localDevBlobsDir, storagePath)
      return serveStatic(c, filePath, {
        download,
        inline,
        filename,
        filesize,
        mimeType,
        uploadedAt,
        hash
      })
    }
  })

export default app
export type StorageType = typeof app
