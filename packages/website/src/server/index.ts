declare let setInterval: WindowOrWorkerGlobalScope['setInterval']
declare let clearInterval: WindowOrWorkerGlobalScope['clearInterval']

import {Hono} from 'hono'
import {auth} from '../lib/auth'
import {fileURLToPath} from 'node:url'
import * as schema from '@/db/schema'
import {db} from '../db/db'
import {dirname as pathDirname} from 'node:path'
import {nowait} from '@/lib/async-utils'
import debug from 'debug'
import process from 'node:process'
import {PRIVATE_VARS} from '@/vars.private'
import type {Runner} from 'graphile-worker'
import {addJob, startWorker} from '@/worker/graphile.config'

import account from './account'
import assistant from './assistant'
// import sandbox from './sandbox'
import projects from './projects'
import projectCommits from './project-commits'
import storage from './storage'
import whoami from './whoami'
import {PUBLIC_VARS} from '@/vars.public'

const log = debug('app:server:index')

const __filename = fileURLToPath(import.meta.url)
const __dirname = pathDirname(__filename)
const __cwd = globalThis.process.cwd()

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
    user: (Omit<typeof auth.$Infer.Session.user, 'id'> & {id: schema.UserId}) | null
    session: typeof auth.$Infer.Session.session | null
  }
}

const app = new Hono<HonoServer>().basePath('/api')

app.use('*', async (c, next) => {
  log('hono session middleware: ', c.req.path)
  if (c.req.path.startsWith('/api/auth/')) {
    return next()
  }

  const session = await auth.api.getSession({headers: c.req.raw.headers})
  c.set('db', db)

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
  .route('/projectCommits', projectCommits)
  .route('/whoami', whoami)
  .route('/storage', storage)
  .get('/', (c) => {
    log('health check')
    return c.json({message: 'Server is healthy'}, 200)
  })

// Worker management
let workerRunner: Runner | null = null
// let isShuttingDown = false

async function initializeWorker() {
  try {
    workerRunner = await startWorker()
    log('Worker started in server process')
  } catch (error) {
    log('Failed to start worker:', error)
  }
}

async function stopWorker() {
  if (workerRunner) {
    try {
      await workerRunner.stop()
      workerRunner = null
      log('Worker stopped')
    } catch (error) {
      log('Failed to stop worker:', error)
    }
  }
}

// Graceful shutdown handling
// async function gracefulShutdown(signal: string) {
//   if (isShuttingDown) {
//     log('Shutdown already in progress...')
//     return
//   }

//   isShuttingDown = true
//   log(`\n${signal} received, starting graceful shutdown...`)

//   // Give ongoing requests 10 seconds to complete
//   const shutdownTimeout = setTimeout(() => {
//     log('Forceful shutdown after timeout')
//     process.exit(1)
//   }, 10000)

//   try {
//     // Stop accepting new jobs and finish current ones
//     await stopWorker()

//     // Clean shutdown
//     clearTimeout(shutdownTimeout)
//     log('Graceful shutdown complete')
//     process.exit(0)
//   } catch (error) {
//     log('Error during shutdown:', error)
//     clearTimeout(shutdownTimeout)
//     process.exit(1)
//   }
// }

// // Initialize worker on server start
// if (typeof process !== 'undefined') {
//   // Start worker
nowait(initializeWorker())

//   // Register shutdown handlers
//   process.once('SIGTERM', () => {
//     nowait(gracefulShutdown('SIGTERM'))
//   })
//   process.once('SIGINT', () => {
//     nowait(gracefulShutdown('SIGINT'))
//   })
//   process.once('SIGHUP', () => {
//     nowait(gracefulShutdown('SIGHUP'))
//   })

//   // Handle uncaught errors
//   process.once('uncaughtException', (error) => {
//     log('Uncaught exception:', error)
//     nowait(gracefulShutdown('uncaughtException'))
//   })

//   process.once('unhandledRejection', (reason, promise) => {
//     log('Unhandled rejection at:', promise, 'reason:', reason)
//     nowait(gracefulShutdown('unhandledRejection'))
//   })
// }

export default app
export type AppType = typeof routes
