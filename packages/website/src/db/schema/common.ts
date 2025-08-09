import {timestamp} from 'drizzle-orm/pg-core'
import {SQL, sql} from 'drizzle-orm'

export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & {
  [P in K]?: never
}

export type BrandedType<K, T> = K & {__brand: T}

/**
 * Represents a UTC timestamp as returned by PostgreSQL.
 *
 * PostgreSQL timestamps are stored in UTC by default and returned in a format
 * similar to but not exactly matching ISO8601/RFC3339, requiring specific parsing
 * for accuracy.
 *
 * Note: Hono RPC does not correctly handle Date types when transferred via RPC.
 * When using this type with Hono RPC, set mode to 'string' for accurate handling
 * and typing. This is a known limitation that won't be fixed.
 * @see https://github.com/honojs/hono/issues/1800
 *
 * @see lib/format-dates.ts for utility functions that accept this type
 */
export type SQLUTCTimestamp = BrandedType<string, 'SQLUTCTimestamp'>

export function sqlNow() {
  return sql`now()` as SQL<string> & SQLUTCTimestamp
}

export const TIMESTAMPS_SCHEMA = {
  createdAt: timestamp({mode: 'string'}).notNull().defaultNow().$type<SQLUTCTimestamp>(),
  updatedAt: timestamp({mode: 'string'})
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`)
    .$type<SQLUTCTimestamp>()
}
