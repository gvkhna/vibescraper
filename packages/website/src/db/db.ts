/* eslint-disable no-console */
import debug from 'debug'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { nowait } from '@/lib/async-utils'
import { PRIVATE_VARS } from '@/vars.private'
import { PUBLIC_VARS } from '@/vars.public'

import * as schema from './schema'

const log = debug('app:db')
const dbLog = debug('db:log')

if (PUBLIC_VARS.DEV) {
  log(`Database - ${PRIVATE_VARS.DATABASE_URL}`)
}

/**
 * Universal batch function that works with both batch-enabled databases (Neon, LibSQL, D1)
 * and regular PostgreSQL by falling back to Promise.all
 *
 * Uses natural TypeScript inference like Promise.all - whatever goes in, comes out
 */
export async function dbBatch<T extends readonly unknown[]>(
  queries: T
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
  // Check if the database instance has batch capability
  if ('batch' in db && typeof db.batch === 'function') {
    try {
      // Cast to any for the batch call since we're bypassing db.batch typing
      const batchFn = db.batch as (queries: readonly unknown[]) => Promise<unknown[]>
      const results = await batchFn(queries)
      return results as { -readonly [P in keyof T]: Awaited<T[P]> }
    } catch (error) {
      // If batch fails, fall back to Promise.all
      log('Batch operation failed, falling back to Promise.all:', error)
    }
  }

  // Fallback to Promise.all for regular PostgreSQL
  const results = await Promise.all(queries)
  return results as { -readonly [P in keyof T]: Awaited<T[P]> }
}
const postgresClient = postgres(PRIVATE_VARS.DATABASE_POOL_URL ?? PRIVATE_VARS.DATABASE_URL, {
  // Log notices from the database server
  onnotice: (notice) => {
    log('Database Notice:')
    log(`Severity: ${notice.severity}`)
    log(`Code: ${notice.code}`)
    log(`Message: ${notice.message}`)
    log(`Detail: ${notice.detail}`)
    log(`Hint: ${notice.hint}`)
    log(`Position: ${notice.position}`)
    log(`Where: ${notice.where}`)
    log(`File: ${notice.file}`)
    log(`Line: ${notice.line}`)
    log(`Routine: ${notice.routine}`)
  },

  // Log protocol parameters
  onparameter: (key, value) => {
    log(`Database Parameter: ${key} = ${value}`)
  },

  // Debug queries - log everything about query execution
  debug: (connection, query, params, types) => {
    dbLog(`\nQuery (conn: ${connection}): ${query}`)
    dbLog(`Parameters: ${params}`)
    dbLog(`Parameter Types: ${types}`)
  },

  onclose: (connId) => {
    dbLog(`Connection ${connId} closed`)
  },

  // Additional options to improve error reporting
  connect_timeout: 5, // 5 second timeout (default is 30)

  // Optional: Set idle timeout for connections to detect dead connections
  idle_timeout: 10, // 10 second idle timeout,
  connection: {
    TimeZone: 'UTC'
  }
})

async function initialize() {
  try {
    const res = await postgresClient
      .unsafe(
        `
      SELECT current_database()     AS database,
       current_user                 AS user,
       version()                    AS version,
       now()                        AS now,
       current_setting('TimeZone')  AS timezone;
      `
      )
      .execute()
    if (res.length === 0) {
      throw new Error('Failed to get Database Connection')
    }
    const row = res[0]
    console.log(`Database Connection: ${row.user}@${row.database}`)
    console.log(`Database Time: ${row.now} (${row.timezone})`)
    console.log(`Database Version: ${row.version}`)
  } catch (e) {
    console.log('\n\nDATABASE NOT RUNNING!\n')
    console.log('-> Did you forget to start your database?')
    console.log('-> Make sure Postgres is running on the expected host and port\n')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    ;(globalThis as any).process.exit(1)
  }

  if (PRIVATE_VARS.DEBUG?.includes('db')) {
    try {
      log(`Database - Enabling debug log all statements`)
      await postgresClient.unsafe("set log_statement = 'all';set log_min_duration_statement = 0;").execute()
    } catch (e) {
      log(`Database Error: Unable to turn on log all statements`, e)
    }
  }

  try {
    // check collation version mismatch
    const res = await postgresClient
      .unsafe(
        `
      SELECT datcollversion,pg_database_collation_actual_version(oid) AS current_version
      FROM pg_database
      WHERE datname = current_database();
      `
      )
      .execute()
    if (res.length === 0) {
      throw new Error('Failed to get collation version')
    } else {
      const row = res[0]
      if (row.datcollversion !== row.current_version) {
        console.log('Database Collation: Collation version mismatch detected!', row)
      } else {
        console.log('Database Collation: Up-to-date')
      }
    }
  } catch (e) {
    console.log('Error checking collation version', e)
  }

  if (PUBLIC_VARS.DEV) {
    /*
     * Sometimes postgres requires reindexing due to MacOS
     * See: https://postgresapp.com/documentation/reindex-warning.html
     */
    log(`Database - Running sql\`reindex database\``)
    try {
      const res = await postgresClient.unsafe('reindex database').execute()
      log('Database Reindex: Reindexing complete')
    } catch (e) {
      log('Database Error: Unable to reindex database! ', e)
    }
  }
}
nowait(initialize())

const dbPostgres = drizzlePostgres({ client: postgresClient, schema, casing: 'camelCase' })

export const db = dbPostgres
