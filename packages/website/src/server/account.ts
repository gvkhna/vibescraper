import {Hono} from 'hono'
import {type HonoServer} from '.'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {storageBlobEndpoint, storageDeleteBlob, storagePutFile} from './storage'
import sharp from 'sharp'
import * as schema from '@/db/schema'
import {eq as sqlEq, and as sqlAnd} from 'drizzle-orm'
import debug from 'debug'
import {bufferToFile, type BinarySource} from '@/lib/binary-utils'

const log = debug('app:account')

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5 MB

const app = new Hono<HonoServer>().post('/uploadAvatar', async (c) => {
  const db = c.get('db')
  const user = c.get('user')

  if (!user) {
    return c.json({error: 'Unable to authenticate user'}, HttpStatusCode.Forbidden)
  }

  // 1. Parse multipart and get file
  let file: File | null = null
  try {
    const body = await c.req.parseBody()
    const fileInput = body['avatar']
    if (fileInput instanceof File) {
      file = fileInput
    } else {
      return c.json({error: 'Missing avatar file upload'}, HttpStatusCode.BadRequest)
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return c.json({error: 'Image too large'}, HttpStatusCode.BadRequest)
    }
  } catch {
    return c.json({error: 'Invalid form data'}, HttpStatusCode.BadRequest)
  }

  // 2. Look up user row
  let userAvatarStorageId: schema.StorageId | null = null
  try {
    const userRow = await db.query.user.findFirst({
      columns: {avatarStorageId: true},
      where: (table, {eq}) => eq(table.id, user.id)
    })
    if (userRow) {
      const avatarStorageId = userRow.avatarStorageId
      if (avatarStorageId) {
        userAvatarStorageId = avatarStorageId
      }
    } else {
      return c.json({error: 'Unable to find user'}, HttpStatusCode.Forbidden)
    }
  } catch {
    return c.json({error: 'Database error'}, HttpStatusCode.BadRequest)
  }

  // 3. Sharp transformation (fail on bad image)
  let webpBuffer: BinarySource
  try {
    const imageBuffer = await file.arrayBuffer()
    webpBuffer = await sharp(imageBuffer)
      .resize({
        width: 512,
        height: 512,
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true
      })
      .webp({quality: 90})
      .toBuffer()
  } catch (err) {
    return c.json({error: 'Invalid or unsupported image file'}, HttpStatusCode.BadRequest)
  }

  // 4. Store processed image
  let newAvatarStorage: {id: schema.StorageId; publicId: schema.StoragePublicId}
  try {
    const webpFile = bufferToFile(webpBuffer, 'avatar.webp', 'image/webp')
    // const webpFile = new File([webpBuffer], 'avatar.webp', {type: 'image/webp'})
    newAvatarStorage = await storagePutFile(db, webpFile)
  } catch (err) {
    return c.json({error: 'Failed to store avatar image'}, HttpStatusCode.BadRequest)
  }

  // 5. Delete old avatar if present (non-fatal if fails)
  if (userAvatarStorageId) {
    try {
      const currentAvatar = await db.query.storage.findFirst({
        where: (table, {eq}) => eq(table.id, userAvatarStorageId)
      })
      if (currentAvatar) {
        await storageDeleteBlob(db, currentAvatar)
      }
    } catch (err) {
      // Log, but don't block new upload on dangling reference
      log('Could not delete old avatar', err)
    }
  }

  // 6. Update user record
  try {
    await db
      .update(schema.user)
      .set({avatarStorageId: newAvatarStorage.id})
      .where(sqlEq(schema.user.id, user.id))
  } catch (err) {
    return c.json({error: 'Failed to update user record'}, HttpStatusCode.BadRequest)
  }

  // 7. Build URL and respond
  // log('request url', c.req.url)
  // const requestUrl = new URL(c.req.url)

  const newAvatarUrlString = storageBlobEndpoint(newAvatarStorage.publicId)
  return c.json({data: {url: newAvatarUrlString}}, HttpStatusCode.Ok)
})

export default app
export type UserType = typeof app
