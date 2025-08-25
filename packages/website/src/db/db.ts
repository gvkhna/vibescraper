import {drizzle as drizzleNeon} from 'drizzle-orm/neon-serverless'
import {Pool} from '@neondatabase/serverless'
import {drizzle as drizzlePostgres} from 'drizzle-orm/postgres-js'
import {DefaultLogger, type LogWriter} from 'drizzle-orm/logger'
import postgres from 'postgres'
import * as schema from './schema'
import {PRIVATE_VARS} from '@/vars.private'
import {PUBLIC_VARS} from '@/vars.public'
import debug from 'debug'

const log = debug('app:db')
const dbLog = debug('db:log')

if (PUBLIC_VARS.DEV) {
  log(`Database - ${PRIVATE_VARS.DATABASE_URL}`)
}

class AppDebugLogWriter implements LogWriter {
  write(message: string) {
    dbLog(message)
  }
}
const logger = new DefaultLogger({writer: new AppDebugLogWriter()})

const sqlNeonPool = new Pool({connectionString: PRIVATE_VARS.DATABASE_POOL_URL ?? PRIVATE_VARS.DATABASE_URL})
const dbNeon = drizzleNeon({client: sqlNeonPool, schema, logger, casing: 'camelCase'})

// const dbNeon = drizzleNeon({connection: PRIVATE_VARS.DATABASE_URL, schema, logger, casing: 'camelCase'})

/**
 * Universal batch function that works with both batch-enabled databases (Neon, LibSQL, D1)
 * and regular PostgreSQL by falling back to Promise.all
 *
 * Uses natural TypeScript inference like Promise.all - whatever goes in, comes out
 */
export async function dbBatch<T extends readonly unknown[]>(
  queries: T
): Promise<{-readonly [P in keyof T]: Awaited<T[P]>}> {
  // Check if the database instance has batch capability
  if ('batch' in db && typeof db.batch === 'function') {
    try {
      // Cast to any for the batch call since we're bypassing db.batch typing
      const batchFn = db.batch as (queries: readonly unknown[]) => Promise<unknown[]>
      const results = await batchFn(queries)
      return results as {-readonly [P in keyof T]: Awaited<T[P]>}
    } catch (error) {
      // If batch fails, fall back to Promise.all
      log('Batch operation failed, falling back to Promise.all:', error)
    }
  }

  // Fallback to Promise.all for regular PostgreSQL
  // This is exactly how Promise.all works - natural inference
  const results = await Promise.all(queries)
  return results as {-readonly [P in keyof T]: Awaited<T[P]>}
}

export const db: typeof dbNeon = (() => {
  if (PUBLIC_VARS.PROD) {
    return dbNeon
  } else {
    const postgresClient = postgres(PRIVATE_VARS.DATABASE_URL, {
      // Connection events
      // connect: (connection: any) => {
      //   console.log('Successfully connected to database')
      //   log(`Connection ID: ${connection.pid}`)
      // },

      // connect_error: (error: any, connection: any) => {
      //   console.log('DATABASE CONNECTION ERROR:')
      //   console.log(`Error Type: ${error.name}`)
      //   console.log(`Message: ${error.message}`)
      //   console.log(`Code: ${error.code || 'N/A'}`)

      //   if (error.message.includes('ECONNREFUSED')) {
      //     console.log('\nDATABASE NOT RUNNING')
      //     console.log('-> Did you forget to start your database?')
      //     console.log('-> Make sure Postgres is running on the expected host and port\n')
      //   } else if (error.message.includes('timeout')) {
      //     console.log('\nDATABASE CONNECTION TIMEOUT')
      //     console.log('-> Database is unreachable or too slow to respond')
      //     console.log('-> Check network connectivity and database status\n')
      //   } else if (error.message.includes('authentication')) {
      //     console.log('\nDATABASE AUTHENTICATION ERROR')
      //     console.log('-> Check your username and password in DATABASE_URL')
      //     console.log('-> Verify you have correct permissions\n')
      //   }
      // },

      // error: (err: any, connection: any) => {
      //   console.log('Error during database operation:')
      //   console.log(`Connection ID: ${connection.pid}`)
      //   console.log(`Error Message: ${err.message}`)
      //   console.log(`Error Details: ${JSON.stringify(err, null, 2)}`)
      // },

      // Log notices from the database server
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onnotice: (notice: any) => {
        log('Database Notice:')
        log(`Severity: ${notice.severity}`)
        log(`Code: ${notice.code}`)
        log(`Message: ${notice.message}`)
        log(`Detail: ${notice.detail ?? 'N/A'}`)
        log(`Hint: ${notice.hint ?? 'N/A'}`)
        log(`Position: ${notice.position ?? 'N/A'}`)
        log(`Where: ${notice.where ?? 'N/A'}`)
        log(`File: ${notice.file ?? 'N/A'}`)
        log(`Line: ${notice.line ?? 'N/A'}`)
        log(`Routine: ${notice.routine ?? 'N/A'}`)
      },

      // Log protocol parameters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onparameter: (key: any, value: any) => {
        log(`Database Parameter: ${key} = ${value}`)
      },

      // Debug queries - log everything about query execution
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      debug: (connection: any, query: any, params: any, types: any) => {
        dbLog('\n🔍 DEBUG: Query Execution')
        dbLog(`Connection ID: ${connection}`)
        dbLog(`Query: ${query}`)
        dbLog(`Parameters: ${JSON.stringify(params)}`)
        dbLog(`Parameter Types: ${JSON.stringify(types)}`)
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

    if (PUBLIC_VARS.DEV) {
      /*
       * Sometimes postgres.app requires reindexing due to MacOS
       * See: https://postgresapp.com/documentation/reindex-warning.html
       */
      log(`Database - Running sql\`reindex database\``)
      postgresClient
        .unsafe('reindex database')
        .execute()
        .then((res) => {
          log('Reindexing complete')

          if (PRIVATE_VARS.DEBUG?.includes('db')) {
            postgresClient
              .unsafe(`set log_statement = 'all';set log_min_duration_statement = 0;`)
              .then((logRes) => {
                dbLog('debug database logging all statements')
              })
              .catch((e: unknown) => {
                dbLog('error turning on debug log all statements', e)
              })
          }
        })
        .catch((e: unknown) => {
          // eslint-disable-next-line no-console
          console.log('\n\nDATABASE NOT RUNNING!\n')
          // eslint-disable-next-line no-console
          console.log('-> Did you forget to start your database?')
          // eslint-disable-next-line no-console
          console.log('-> Make sure Postgres is running on the expected host and port\n')
          // eslint-disable-next-line no-restricted-globals
          process.exit(1)
        })
    }

    const dbPostgres = drizzlePostgres({client: postgresClient, schema, casing: 'camelCase'})

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-explicit-any
    return dbPostgres as any
  }
})()
