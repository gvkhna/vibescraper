import { SandboxManager } from '@vibescraper/sandbox'
import { ShutdownManager } from '@vibescraper/shutdown-manager'
import { StorageService } from '@vibescraper/storage-service'
import debug from 'debug'
import type { Runner } from 'graphile-worker'
import { type Context, Hono } from 'hono'

import * as schema from '@/db/schema'
import { nowait } from '@/lib/async-utils'
import { addJob, startWorker } from '@/task-queue/graphile.config'
import { PRIVATE_VARS } from '@/vars.private'
import { PUBLIC_VARS } from '@/vars.public'
import { db, dbEnd } from '../db/db'
import { auth } from '../lib/auth'

import account from './account'
import assistant from './assistant'
import project from './project'
import projects from './projects'
import storage from './storage'
import whoami from './whoami'

const log = debug('app:server:index')

const sandboxWorkerLogger = debug('app:sandbox:worker')

const sandboxManager = new SandboxManager(PRIVATE_VARS.TMP_DIR, sandboxWorkerLogger, PUBLIC_VARS.NODE_ENV)

const shutdownManager = new ShutdownManager(debug('app:shutdown'))

const storageService = new StorageService(
  PRIVATE_VARS.STORAGE_PROVIDER === 'bucket'
    ? {
        STORAGE_PROVIDER: 'bucket',
        STORAGE_BUCKET_NAME: PRIVATE_VARS.STORAGE_BUCKET_NAME ?? '',
        STORAGE_ENDPOINT: PRIVATE_VARS.STORAGE_ENDPOINT ?? '',
        STORAGE_REGION: PRIVATE_VARS.STORAGE_REGION,
        STORAGE_ACCESS_KEY_ID: PRIVATE_VARS.STORAGE_ACCESS_KEY_ID,
        STORAGE_CACHE_CONTROL_HEADER: PRIVATE_VARS.STORAGE_CACHE_CONTROL_HEADER,
        STORAGE_FORCE_PATH_STYLE: PRIVATE_VARS.STORAGE_FORCE_PATH_STYLE,
        STORAGE_SECRET_ACCESS_KEY: PRIVATE_VARS.STORAGE_SECRET_ACCESS_KEY
      }
    : {
        STORAGE_PROVIDER: 'filesystem',
        STORAGE_BASE_PATH: PRIVATE_VARS.STORAGE_BASE_PATH ?? `${PRIVATE_VARS.TMP_DIR}/storage`,
        STORAGE_CACHE_CONTROL_HEADER: PRIVATE_VARS.STORAGE_CACHE_CONTROL_HEADER
      },
  debug('app:storage-service')
)

export function selectTableColumns<T extends object>(table: T, columnNames: (keyof T)[]) {
  return columnNames.reduce<Partial<T>>((acc, columnName) => {
    acc[columnName] = table[columnName]
    return acc
  }, {})
}

// type HonoBindings = {
// APP_SECRET_KEY: string | null
// TRIGGER_API_KEY: string | null
// TRIGGER_API_URL: string | null
// }
export type HonoServer = {
  // Bindings: HonoBindings
  Variables: {
    db: typeof db
    user: (Omit<typeof auth.$Infer.Session.user, 'id'> & { id: schema.UserId }) | null
    session: typeof auth.$Infer.Session.session | null
    sandbox: typeof sandboxManager | null
    storageService: StorageService
  }
}

const app = new Hono<HonoServer>().basePath('/api')

app.use('*', async (c, next) => {
  log('hono session middleware: ', c.req.path)
  if (c.req.path.startsWith('/api/auth/')) {
    return next()
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('db', db)
  c.set('sandbox', sandboxManager)
  c.set('storageService', storageService)

  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }

  // console.log('session middleware', session.user, session.session)

  c.set('user', session.user as HonoServer['Variables']['user'])
  c.set('session', session.session as HonoServer['Variables']['session'])
  return next()
})

app.on(['POST', 'GET'], '/auth/*', (c) => {
  log('calling auth handler', c.req.path)
  return auth.handler(c.req.raw)
})

const MAX_BODY_PREVIEW = 10_000 // characters
// TODO: move it somewhere more appropriate
// for debugging hono request/response
export async function logRequestDetails(c: Context) {
  const req = c.req.raw.clone()

  /* ---------- headers ---------- */
  const headersObj = Object.fromEntries(req.headers.entries())
  log('[Headers]', headersObj)

  /* ---------- body (safe) ------ */
  if (req.bodyUsed) {
    log('[Body]', '[already consumed]')
    return
  }

  const ct = req.headers.get('content-type') ?? ''

  // Clone can throw "unusable" in Undici if body is empty/locked
  let bodyText: string | undefined
  try {
    const clone = req.clone()

    if (ct.includes('application/json') || ct.startsWith('text/')) {
      bodyText = await clone.text()
    } else if (ct.startsWith('multipart/form-data')) {
      bodyText = '[multipart/form-data omitted]'
    } else if (ct) {
      bodyText = `[${ct} body omitted]`
    } else {
      bodyText = '[no body]'
    }
  } catch (err) {
    log('[Body logging error]', err)
    bodyText = '[unreadable body]'
  }

  if (bodyText && bodyText.length > MAX_BODY_PREVIEW) {
    bodyText = bodyText.slice(0, MAX_BODY_PREVIEW) + '… (truncated)'
  }

  log('[Body]', bodyText)
}

// ================================================================
// **IMPORTANT: DO NOT RETURN ARRAYS OR RAW DATABASE OBJECTS DIRECTLY!**
// ================================================================
//
// Hono requires the response to be a properly structured JSON object.
//
// **DO NOT** directly return an array or a raw database object from `c.json()`.
//
// DONT: return a db query top-level
// const dataset = db.select... => object
// c.json({dataset})
//
// DONT: return an array directly:
// const allDatasets = db.select... => object[]
// c.json(allDatasets)
//
// DO: wrap the array inside a top-level JSON object:
// return c.json({
//   datasets: allDatasets
// })

const routes = app
  .route('/account', account)
  .route('/assistant', assistant)
  .route('/projects', projects)
  .route('/project', project)
  .route('/whoami', whoami)
  .route('/storage', storage)
  .get('/', (c) => {
    log('health check')
    return c.json({ message: 'Server is healthy' }, 200)
  })

// Worker management
let workerRunner: Runner | null = null

async function initializeWorker() {
  workerRunner = await startWorker()
  log('Worker started in server process')
}

nowait(initializeWorker())

shutdownManager.add('graphile', async () => {
  if (workerRunner) {
    try {
      await workerRunner.stop()
      workerRunner = null
      log('Worker stopped')
    } catch (error) {
      log('Failed to stop worker:', error)
    }
  }
})

shutdownManager.add('postgres', async () => {
  await dbEnd()
})

export default app
export type AppType = typeof routes
