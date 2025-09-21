import { bigint, numeric, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { type ULID, ulid } from 'ulid'

import { type BrandedType, TIMESTAMPS_SCHEMA } from './common'

export type StorageId = BrandedType<ULID, 'StorageId'>
export type StoragePublicId = BrandedType<ULID, 'StoragePublicId'>
export type StorageKey = BrandedType<ULID, 'StorageKey'>
export const storage = pgTable(
  'storage',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<StorageId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<StoragePublicId>(),
    key: text().notNull().$type<StorageKey>(),
    filename: text().notNull(),
    filesize: bigint({ mode: 'number' }).notNull(),
    sha256hash: varchar({ length: 64 }).notNull(), // Lowercase hex
    mimeType: text().notNull(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)
