// start-browser-session.ts
import {Command} from 'commander'
import {TextDecoder} from 'node:util'
import {createInterface} from 'node:readline'
import {firefox, type Page, type BrowserContext, type Browser, type BrowserServer} from 'playwright'
import {join, resolve as pathResolve, basename as pathBasename} from 'node:path'
import {cwd, env, pid, stdin} from 'node:process'
import debug from 'debug'
import {readFileSync, writeFileSync} from 'node:fs'
import {isIPv4, isIPv6} from 'node:net'

const logger = {
  log: debug('browser:log'),
  debug: debug('browser:debug'),
  error: debug('browser:error'),
  warn: debug('browser:warn')
}

logger.log.log = console.log.bind(console)
logger.debug.log = console.log.bind(console)
logger.warn.log = console.log.bind(console)

const logEvt = debug('browser:event')
logEvt.log = console.log.bind(console)

debug.enable('browser:*')

// Global state tracking
let isShuttingDown = false
let browserServer: BrowserServer | null = null
let browser: Browser | null = null
let context: BrowserContext | null = null
let page: Page | null = null
let stopStdin: (() => void) | null = null

function setupBrowserEventListeners(b: Browser, ctx: BrowserContext) {
  // Context events
  ctx.on('page', (page) => {
    logEvt('New page created: %s', page.url())
    setupPageEventListeners(page)
  })

  ctx.on('request', (request) => {
    logEvt('Request: %s %s', request.method(), request.url())
  })

  ctx.on('requestfailed', (request) => {
    logEvt('Request failed: %s %s - %s', request.method(), request.url(), request.failure()?.errorText)
  })

  ctx.on('response', (response) => {
    logEvt('Response: %d %s', response.status(), response.url())
  })

  ctx.on('close', () => {
    logEvt('Context closed')
    if (!isShuttingDown) {
      logger.warn('Context closed unexpectedly')
      gracefulShutdown('Context closed unexpectedly')
    }
  })

  // Browser events
  b.on('disconnected', () => {
    logEvt('Browser disconnected')
    if (!isShuttingDown) {
      logger.warn('Browser disconnected unexpectedly')
      gracefulShutdown('Browser disconnected unexpectedly')
    }
  })
}

function setupPageEventListeners(page: Page): void {
  page.on('close', () => {
    logEvt('Page closed: %s', page.url())
  })

  page.on('crash', () => {
    logEvt('Page crashed: %s', page.url())
    logger.error('Page crashed: %s', page.url())
  })

  page.on('pageerror', (error: Error) => {
    logEvt('Page error: %s - %s', page.url(), error.message)
    logger.error('Page error on %s: %s', page.url(), error.message)
  })

  page.on('console', (msg) => {
    logEvt('Console [%s]: %s', msg.type(), msg.text())
  })

  page.on('dialog', (dialog) => {
    logEvt('Dialog [%s]: %s', dialog.type(), dialog.message())
    dialog.dismiss().catch((err: Error) => {
      logger.error('Failed to dismiss dialog: %s', err.message)
    })
  })

  page.on('load', () => {
    logEvt('Page loaded: %s', page.url())
  })

  page.on('domcontentloaded', () => {
    logEvt('Page DOM loaded: %s', page.url())
  })
}

function mergeFingerprint(args: CliOpts) {
  const fingerprintFile = readFileSync(args.fingerprintPath, 'utf-8')
  const opts = JSON.parse(fingerprintFile)

  opts['proxy']['server'] = args.proxy
  opts['env']['TZ'] = args.timezone

  const camouConfigString = opts['env']['CAMOU_CONFIG_1']
  const camouConfig = JSON.parse(camouConfigString)

  if (isIPv4(args.ip)) {
    camouConfig['webrtc:ipv4'] = args.ip
    opts['firefox_user_prefs']['network.dns.disableIPv6'] = true
  } else if (isIPv6(args.ip)) {
    camouConfig['webrtc:ipv6'] = args.ip
  } else {
    throw new Error('Unable to validate ip address')
  }
  camouConfig['addons'] = args.addons
  camouConfig['geolocation:longitude'] = args.longitude
  camouConfig['geolocation:latitude'] = args.latitude
  camouConfig['timezone'] = args.timezone

  const outputCamouConfig = JSON.stringify(camouConfig)
  opts['env']['CAMOU_CONFIG_1'] = outputCamouConfig

  const dump = JSON.stringify(opts, null, 2)
  writeFileSync(args.fingerprintDumpPath, dump, 'utf-8')
  return opts as Record<string, string>
}

async function connectWithRetry(
  wsEndpoint: string,
  perAttempt = 2_000, // ms timeout inside firefox.connect
  maxTotal = 30_000, // overall deadline
  interval = 2_000 // wait between attempts
): Promise<Browser> {
  const start = Date.now()
  let lastErr: unknown

  while (Date.now() - start < maxTotal) {
    try {
      return await firefox.connect(wsEndpoint, {timeout: perAttempt})
    } catch (err) {
      lastErr = err
      logger.warn('connect failed (%s) - retrying…', (err as Error).message)
      await new Promise((r) => {
        setTimeout(r, interval)
      })
    }
  }

  throw new Error(
    `Unable to connect to browser at ${wsEndpoint} after ${maxTotal / 1000}s. ` +
      `Last error: ${(lastErr as Error)?.message ?? lastErr}`
  )
}

async function launchBrowser(args: CliOpts, opts: any): Promise<void> {
  try {
    const wsUrl = new URL(args.wsEndpoint)

    if (wsUrl.protocol !== 'ws:' && wsUrl.protocol !== 'wss:') {
      throw new Error(`wsEndpoint must start with ws:// or wss:// (got ${wsUrl.protocol})`)
    }

    const wsPort = wsUrl.port ? Number(wsUrl.port) : null
    if (!wsPort) {
      throw new Error(`wsUrl did not have a valid port`)
    }

    const wsPath = pathBasename(wsUrl.pathname)
    if (!wsPath) {
      throw new Error(`wsUrl did not have a valid wsPath`)
    }

    logger.log('targeting wspath', wsPath, wsPort)

    type CustomLaunchServer = Parameters<typeof firefox.launchServer>[0] & {
      userDataDir: string
      _userDataDir: string
    }

    const playwrightServerOpts = {
      executablePath: opts['executable_path'],
      args: [
        ...(opts['args'] ?? []),
        '-no-remote',
        '-wait-for-browser',
        '-foreground',
        '-profile',
        args.userDataDir,
        '-juggler-pipe',
        '-silent'
      ],
      env: opts['env'],
      ignoreDefaultArgs: true,
      firefoxUserPrefs: opts['firefox_user_prefs'],
      headless: false,
      proxy: opts['proxy'],
      // downloadsPath: '',
      wsPath: wsPath,
      port: wsPort,
      userDataDir: args.userDataDir,
      _userDataDir: args.userDataDir
    } satisfies CustomLaunchServer

    browserServer = await firefox.launchServer(playwrightServerOpts)
    logger.log('browser server started: %O', typeof browserServer)
    logger.log('browser ws endpoint', browserServer.wsEndpoint())
    browserServer.once('close', () => {
      logEvt('Browser server closed')
    })

    logger.log('Connecting to CamouFox at %s…', args.wsEndpoint)
    browser = await connectWithRetry(browserServer.wsEndpoint()) // ← resolves or throws
    logger.log('✓ connected')

    const contexts = browser.contexts()
    logger.log('Browser Contexts: ', contexts)
    // logger.log('Browser Type: ', browser.browserType())
    logger.log('Browser Version: ', browser.version())

    // const start = Date.now()

    // const maxTotal = 30_000
    // const interval = 1_000
    // while (Date.now() - start < maxTotal) {
    //   const ctxs = browser.contexts()
    //   logger.log('Browser Contexts:', ctxs)

    //   if (ctxs.length) {
    //     const ctx = ctxs[0]
    //     const pages = ctx.pages()
    //     logger.log('Pages in first context:', pages)
    //     // return {ctx, pages}
    //   }

    //   await new Promise((r) => {
    //     setTimeout(r, interval)
    //   })
    // }

    context = contexts[0]
    if (!context) {
      context = await browser.newContext()
      // logger.log('Created new context: ', context)
    }

    setupBrowserEventListeners(browser, context)

    // // Get or create initial page
    const pages = context.pages()
    if (pages.length > 0) {
      page = pages[0]
      logger.log('Using existing page: %s', page.url())
    } else {
      logger.log('Waiting for first page...')
      page = await context.newPage()
      await page.goto('about:blank')
      // page = await context.waitForEvent('page')
      // logger.log('Got first page: %s', page.url())
    }

    // if (page) {
    //   const url = 'https://abrahamjuliot.github.io/creepjs/'
    //   page.evaluate(`window.open('${url}', '_blank')`)
    // }

    setupPageEventListeners(page)
    logger.log('Browser ready - PID %d. Ctrl-C to exit.', pid)

    // Setup stdin handler for URL opening
    stopStdin = setupStdinHandler()

    // await new Promise((r) => {
    //   setTimeout(r, 1000 * 1000)
    // })
  } catch (error: unknown) {
    logger.error('Failed to launch browser: %s', (error as Error).message)
    throw error
  }
}

/** SIGUSR1 handler - look for "Camoufox" in our process tree and front-most it. */
export async function handleSigusr1(): Promise<void> {
  if (isShuttingDown) {
    logger.warn('SIGUSR1 received during shutdown, ignoring')
    return
  }

  if (page) {
    logger.log('activating existing page')
    await page.bringToFront()
    const url = 'https://abrahamjuliot.github.io/creepjs/'
    page.evaluate(`window.open('${url}', '_blank')`)
  } else {
    if (context) {
      const pages = context.pages()
      if (pages.length > 0) {
        logger.log('activating context first page')
        const page = pages[0]
        await page.bringToFront()
      } else {
        logger.log('activating context new page')
        const page = await context.newPage()
        await page.bringToFront()
      }
    } else {
      logger.log('failed to find active context')
    }
  }
}

async function gracefulShutdown(reason: string): Promise<void> {
  if (isShuttingDown) {
    logger.debug('Already shutting down, ignoring: %s', reason)
    return
  }

  isShuttingDown = true
  logger.log('Graceful shutdown initiated: %s', reason)

  try {
    // Close page first
    if (page) {
      logger.debug('Closing page...')
      await page.close().catch((err: Error) => {
        logger.error('Failed to close page: %s', err.message)
      })
      page = null
    }

    // Close context
    if (context) {
      logger.debug('Closing context...')
      await context.close().catch((err: Error) => {
        logger.error('Failed to close context: %s', err.message)
      })
      context = null
    }

    // Close browser
    if (browser) {
      logger.debug('Closing browser...')
      await browser.close().catch((err: Error) => {
        logger.error('Failed to close browser: %s', err.message)
      })
      browser = null
    }

    if (browserServer) {
      await browserServer.close().catch((err: Error) => {
        logger.error('Failed to close browser server: %s', err.message)
      })
      browserServer = null
    }
    if (stopStdin) {
      stopStdin()
    }

    logger.log('Shutdown complete')
  } catch (error) {
    logger.error('Error during shutdown: %s', (error as Error).message)
  } finally {
    process.exit(0)
  }
}

// Signal handlers
process.on('SIGINT', () => {
  logger.log('SIGINT received')
  gracefulShutdown('SIGINT')
})

process.on('SIGTERM', () => {
  logger.log('SIGTERM received')
  gracefulShutdown('SIGTERM')
})

process.on('SIGUSR1', () => {
  logger.debug('SIGUSR1 received')
  handleSigusr1()
    .then(() => {})
    .catch((error) => {
      logger.error('SIGUSR1 handler failed: %s', error.message)
    })
})

// Error handlers
process.on('uncaughtException', (error, origin) => {
  logger.error('Uncaught exception from %s: %s', origin, error.message)
  logger.error('Stack trace: %s', error.stack)
  gracefulShutdown('Uncaught exception')
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at: %s', promise)
  logger.error('Reason: %s', reason)
  gracefulShutdown('Unhandled rejection')
})

// Cleanup on exit
process.on('exit', (code) => {
  logger.log('Process exiting with code %d', code)
})

type CliOpts = {
  userDataDir: string
  fingerprintPath: string
  fingerprintDumpPath: string
  timezone: string
  ip: string
  longitude: number
  latitude: number
  proxy: string
  addons: string[]
  wsEndpoint: string
}

async function start(): Promise<void> {
  const program = new Command()
    .name('start-browser-session')
    .description('Launch CamouFox with a fingerprint profile')
    .requiredOption('--user-data-dir <dir>', 'Absolute path for user-data')
    .requiredOption('--fingerprint-path <file>', 'Absolute path to fingerprint file')
    .requiredOption('--fingerprint-dump-path <file>', 'Absolute path for fingerprint dump file')
    .requiredOption('--timezone <tz>', 'IANA timezone (e.g. America/Chicago)')
    .requiredOption('--ip <addr>', 'Public IPv4 or IPv6 address for the proxy')
    .requiredOption('--longitude <deg>', 'Decimal degrees east (+) / west (-)')
    .requiredOption('--latitude <deg>', 'Decimal degrees north (+) / south (-)')
    .requiredOption('--ws-endpoint <url>', 'Playwright WebSocket endpoint')
    .requiredOption('--proxy <url>', 'SOCKS/HTTP proxy URL', 'socks5://127.0.0.1:1080')
    .option('--addons <paths>', 'Comma-separated extension dirs', '')
    .showHelpAfterError()
    .action(async (raw): Promise<void> => {
      try {
        const args: CliOpts = {
          userDataDir: raw.userDataDir,
          fingerprintPath: raw.fingerprintPath,
          fingerprintDumpPath: raw.fingerprintDumpPath,
          timezone: raw.timezone,
          ip: raw.ip,
          longitude: parseFloat(raw.longitude),
          latitude: parseFloat(raw.latitude),
          proxy: raw.proxy,
          wsEndpoint: raw.wsEndpoint,
          addons: raw.addons
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        }

        logger.log('CLI args: %O', args)
        const opts = mergeFingerprint(args)
        await launchBrowser(args, opts) // pass whole struct
      } catch (err) {
        logger.error('Failed to start: %s', (err as Error).stack ?? err)
        process.exit(1)
      }
    })

  await program.parseAsync(process.argv)
}

start().catch((error) => {
  logger.error('Startup error: %s', error.message)
  process.exit(1)
})
