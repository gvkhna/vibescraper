import {defineMiddleware} from 'astro:middleware'
import debug from 'debug'
import {PUBLIC_VARS} from './vars.public'

const log = debug('app:request')
// 1 minute
const TIMEOUT_MS = 60 * 1000
const INCLUDE_USER_AGENT = true

export const onRequest = defineMiddleware(async (context, next) => {
  const {method, url, headers} = context.request
  const start = Date.now()

  const clonedUrl = new URL(url)
  // Use PUBLIC_HOSTNAME if available, otherwise fall back to the request URL's origin
  const baseUrl = PUBLIC_VARS.PUBLIC_HOSTNAME || clonedUrl.origin
  const canonicalUrl = new URL(clonedUrl.pathname, baseUrl)
  // ignore the root "/"
  const trailingSlashRedirect = clonedUrl.pathname !== '/' && clonedUrl.pathname.endsWith('/')
  if (trailingSlashRedirect) {
    canonicalUrl.pathname = canonicalUrl.pathname.slice(0, -1)
  }
  // canonicalUrl.search = clonedUrl.search
  context.locals.canonical = canonicalUrl

  let host: string | undefined
  let response: Response
  // console.log('trailing slash redirect', trailingSlashRedirect)
  // console.log('status', method)

  if (trailingSlashRedirect && !context.locals.trailingSlashRedirected) {
    const status = method === 'GET' ? 301 : 308
    context.locals.trailingSlashRedirected = true
    response = context.redirect(`${canonicalUrl}${clonedUrl.search}`, status)
  } else {
    // Continue processing the request
    response = await next()
  }

  // Set security headers on the response
  // -------------------------------------

  // Prevent iframing (clickjacking protection).
  // Use SAMEORIGIN or DENY. SAMEORIGIN allows your own domain to frame.
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // Disable MIME-type sniffing; trust declared Content-Type.
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Limit how much referrer info is sent in requests (can be 'strict-origin-when-cross-origin', etc.).
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // A legacy, mostly ignored header in modern browsers, but set for older ones.
  // Most modern browsers use CSP instead. Setting it to '0' effectively disables
  // old IE's XSS auditor to prevent unexpected blocking of legitimate content.
  response.headers.set('X-XSS-Protection', '0')

  // let response = await next()

  // turn off caching for now
  // response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  // response.headers.set('Pragma', 'no-cache')
  // response.headers.set('Expires', '0')

  // Calculate request duration
  const duration = Date.now() - start
  const parsedUrl = new URL(url)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const userAgent = INCLUDE_USER_AGENT ? (headers.get('user-agent') ?? 'unknown') : null

  const logMessage = `[${response.status}] ${method}:${parsedUrl.pathname} ${duration}ms${userAgent ? ` - ${userAgent}` : ''}`
  log(logMessage)

  return response
})
