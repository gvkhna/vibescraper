import {spawn, type ChildProcess} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type {Plugin, ViteDevServer} from 'vite'
import debug from 'debug'

const dbg = debug('vite-maildev')

let maildevProcess: ChildProcess | null = null
let cleanupRegistered = false

/* ───────── helpers ───────── */

function getMaildevCommand(): [string, string[]] {
  const pkgPath = path.resolve(process.cwd(), 'package.json')
  const {scripts = {}} = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
    scripts?: Record<string, string>
  }

  const script = scripts.maildev
  if (!script) {
    throw new Error('No `maildev` script found in package.json')
  }

  const [cmd, ...args] = script.trim().split(/\s+/)
  return cmd === 'maildev' ? [cmd, args] : ['pnpm', ['run', 'maildev']]
}

function startMaildev(): void {
  // Avoid spawning twice (Vite can reload plugins on-the-fly)
  if (maildevProcess?.pid && !maildevProcess.killed) {
    dbg('MailDev already running - skipping spawn')
    return
  }

  const [command, args] = getMaildevCommand()
  dbg(`Starting MailDev: ${command} ${args.join(' ')}`)

  maildevProcess = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
    // Ensure child process is killed when parent dies
    detached: false
  })

  maildevProcess.on('error', (err) => {
    console.error('[vite-maildev] Failed to start MailDev:', err)
  })

  maildevProcess.on('exit', (code, signal) => {
    dbg(`MailDev exited (code ${code} | signal ${signal})`)
    maildevProcess = null
  })
}

function stopMaildev(): void {
  if (maildevProcess && !maildevProcess.killed) {
    dbg('Stopping MailDev…')

    // Try graceful shutdown first
    maildevProcess.kill('SIGTERM')

    // Force kill after timeout if still running
    const forceKillTimeout = setTimeout(() => {
      if (maildevProcess && !maildevProcess.killed) {
        dbg('Force killing MailDev (SIGKILL)')
        maildevProcess.kill('SIGKILL')
      }
    }, 5000)

    // Clear timeout if process exits
    maildevProcess.once('exit', () => {
      clearTimeout(forceKillTimeout)
    })
  }
}

// Register cleanup handlers only once
function registerCleanupHandlers(): void {
  if (cleanupRegistered) {
    return
  }
  cleanupRegistered = true

  const cleanup = () => {
    stopMaildev()
  }

  // Handle various shutdown scenarios
  process.once('SIGINT', () => {
    dbg('Received SIGINT')
    cleanup()
    process.exit(0)
  })

  process.once('SIGTERM', () => {
    dbg('Received SIGTERM')
    cleanup()
    process.exit(0)
  })

  process.once('SIGHUP', () => {
    dbg('Received SIGHUP')
    cleanup()
    process.exit(0)
  })

  process.once('exit', () => {
    dbg('Process exiting')
    cleanup()
  })

  // Handle uncaught exceptions
  process.once('uncaughtException', (err) => {
    console.error('[vite-maildev] Uncaught exception:', err)
    cleanup()
    process.exit(1)
  })

  process.once('unhandledRejection', (reason, promise) => {
    console.error('[vite-maildev] Unhandled rejection at:', promise, 'reason:', reason)
    cleanup()
    process.exit(1)
  })
}

/* ───────── Vite plugin ───────── */

export default function viteMaildev(): Plugin {
  return {
    name: 'vite-maildev',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      startMaildev()

      // Register global cleanup handlers once
      registerCleanupHandlers()

      // When dev-server shuts down (e.g. config hot-reload)
      server.httpServer?.once('close', () => {
        dbg('Dev server closing')
        stopMaildev()
      })

      // Also listen for WebSocket server close
      server.ws.on('close', () => {
        dbg('WebSocket server closing')
        stopMaildev()
      })
    },

    // Clean up when Vite closes
    closeBundle() {
      dbg('Vite bundle closing')
      stopMaildev()
    }
  }
}
