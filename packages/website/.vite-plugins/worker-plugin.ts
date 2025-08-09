/* eslint-disable no-console */
import type {Plugin} from 'vite'
import type {Runner} from 'graphile-worker'

let runner: Runner | null = null
let cleanupRegistered = false

async function stopWorker(): Promise<void> {
  if (runner) {
    try {
      await runner.stop()
      console.log('✅ Graphile Worker stopped')
    } catch (error) {
      console.error('❌ Failed to stop Graphile Worker:', error)
    } finally {
      runner = null
    }
  }
}

// Register cleanup handlers only once
function registerCleanupHandlers(): void {
  if (cleanupRegistered) {
    return
  }
  cleanupRegistered = true

  const cleanup = async () => {
    await stopWorker()
  }

  // Handle various shutdown scenarios
  process.once('SIGINT', async () => {
    console.log('[worker-plugin] Received SIGINT')
    await cleanup()
    process.exit(0)
  })

  process.once('SIGTERM', async () => {
    console.log('[worker-plugin] Received SIGTERM')
    await cleanup()
    process.exit(0)
  })

  process.once('SIGHUP', async () => {
    console.log('[worker-plugin] Received SIGHUP')
    await cleanup()
    process.exit(0)
  })

  process.once('exit', () => {
    console.log('[worker-plugin] Process exiting')
    // Synchronous cleanup on exit
    if (runner) {
      runner.stop().catch(() => {})
    }
  })

  // Handle uncaught exceptions
  process.once('uncaughtException', async (err) => {
    console.error('[worker-plugin] Uncaught exception:', err)
    await cleanup()
    process.exit(1)
  })

  process.once('unhandledRejection', async (reason, promise) => {
    console.error('[worker-plugin] Unhandled rejection at:', promise, 'reason:', reason)
    await cleanup()
    process.exit(1)
  })
}

export function workerPlugin(): Plugin {
  return {
    name: 'vite-plugin-graphile-worker',

    async configureServer(server) {
      // Only start in development mode unless explicitly disabled
      const isDev = process.env.NODE_ENV !== 'production'
      const isDisabled = process.env.DISABLE_WORKER === 'true'

      if (isDev && !isDisabled) {
        try {
          // Avoid starting twice if plugin reloads
          if (runner) {
            console.log('✅ Graphile Worker already running')
            return
          }

          const {startWorker} = await import('../src/worker/config')
          runner = await startWorker()
          console.log('✅ Graphile Worker started in development mode')

          // Register global cleanup handlers once
          registerCleanupHandlers()
        } catch (error) {
          console.error('❌ Failed to start Graphile Worker:', error)
        }
      }

      // Stop worker on server close
      server.httpServer?.once('close', async () => {
        console.log('[worker-plugin] Dev server closing')
        await stopWorker()
      })

      // Also listen for WebSocket server close
      server.ws?.on('close', async () => {
        console.log('[worker-plugin] WebSocket server closing')
        await stopWorker()
      })
    },

    async closeBundle() {
      // Stop worker when build completes
      console.log('[worker-plugin] Bundle closing')
      await stopWorker()
    }
  }
}
