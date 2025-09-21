import debug from 'debug'
import { and as sqlAnd, eq as sqlEq } from 'drizzle-orm'
import { type Context, Hono } from 'hono'

import * as schema from '@/db/schema'
import { sqlTimestampToDate } from '@/lib/format-dates'
import { HttpStatusCode } from '@/lib/http-status-codes'
import type { HonoServer } from '.'

const log = debug('app:server:storage')

export async function storageDeleteEntry(
  c: Context<HonoServer>,
  storageEntry: typeof schema.storage.$inferSelect
) {
  const db = c.get('db')
  const key = storageEntry.key

  const result = await c.get('storageService').delete(key)
  if (result.success) {
    // Delete the row from the database
    await db.delete(schema.storage).where(sqlEq(schema.storage.key, key))
  }
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

    const { file } = await c.req.parseBody()

    log('one file being uploaded', file)
    if (file instanceof File) {
      const fileMetadata = await c.get('storageService').storeFile(file)
      if (!fileMetadata.success) {
        return c.json({ message: 'error' }, HttpStatusCode.BadGateway)
      }

      const [storageEntry] = await db
        .insert(schema.storage)
        .values({
          key: fileMetadata.data.key as schema.StorageKey,
          filename: fileMetadata.data.filename,
          filesize: fileMetadata.data.filesize,
          mimeType: fileMetadata.data.mimeType,
          sha256hash: fileMetadata.data.hash,
          encoding: fileMetadata.data.encoding
        })
        .returning()

      const { id: _, ...blob } = storageEntry
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
      where: (table, { eq }) => eq(schema.storage.publicId, storagePublicId as schema.StoragePublicId)
    })

    log('storage blob', storageBlob)

    if (!storageBlob) {
      log('file not found')
      return c.json({ error: 'File not found' }, HttpStatusCode.NotFound)
    }
    return c.redirect(`/api/storage/blob/${storageBlob.key}${searchParams}`)
  })
  .get('/blob/:storageKey', async (c) => {
    const db = c.get('db')
    const storageKey = c.req.param('storageKey')

    const storageEntry = await db.query.storage.findFirst({
      where: (table, { eq }) => eq(table.key, storageKey as schema.StorageKey)
    })

    if (!storageEntry) {
      log('file not found')
      return c.json({ error: 'Storage item not found' }, HttpStatusCode.NotFound)
    }

    return c.get('storageService').serve(c, storageKey, {
      filename: storageEntry.filename,
      filesize: storageEntry.filesize,
      mimeType: storageEntry.mimeType,
      hash: storageEntry.sha256hash,
      lastModified: sqlTimestampToDate(storageEntry.createdAt),
      encoding: storageEntry.encoding
    })
  })

export default app
export type StorageType = typeof app
