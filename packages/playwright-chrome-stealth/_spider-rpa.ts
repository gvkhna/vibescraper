import type {BrowserContext, Page, Response} from 'playwright'
import {lookup} from 'mime-types'
import {v4 as uuidv4} from 'uuid'
import * as path from 'path'
import * as fs from 'fs'
import Puppet from './puppet'
import marker from 'debug'
// import axios, {AxiosResponse} from 'axios'
import http from 'http'
import https from 'https'
// import * as rootCas from 'ssl-root-cas'
// import {SocksProxyAgent} from 'socks-proxy-agent'

// import {InflightMod} from 'crawler-mods/api-crawler-page-request-mod'

// rootCas.default.inject()
// const rootCa = rootCas.create()

function resolveLinks(baseUrl: string, links: string[]): string[] {
  return links.map((link) => {
    // If the link is already an absolute URL, it will remain unchanged.
    // If it's a relative URL, it will be resolved against the base URL.
    return new URL(link, baseUrl).toString()
  })
}
const rpaDebugLog = marker('spider:rpa')

function _serialize(value: any, seen = new WeakSet()): string {
  if (value == null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify(value)
  } else if (value instanceof Error) {
    return `Error: ${value.message}`
  } else if (value instanceof Map) {
    return `Map: ${Array.from(value.entries())
      .map(([k, v]) => `[${_serialize(k, seen)}, ${_serialize(v, seen)}]`)
      .join(', ')}`
  } else if (value instanceof Set) {
    return `Set: ${Array.from(value.values())
      .map((v) => _serialize(v, seen))
      .join(', ')}`
  } else if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]'
    }
    seen.add(value)
    const objType = Object.prototype.toString.call(value).slice(8, -1)
    if (objType === 'Object' || objType === 'Array') {
      const entries = objType === 'Object' ? Object.entries(value) : value.map((v: any, i: any) => [i, v])
      return `${objType === 'Object' ? '{' : '['}${entries.map(([k, v]: any) => `${objType === 'Object' ? `"${k}": ` : ''}${_serialize(v, seen)}`).join(', ')}${objType === 'Object' ? '}' : ']'}`
    }
    return `[${objType}]`
  } else if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`
  }
  return String(value)
}

export interface AttachmentFile {
  contentType: string
  fileName: string
  filePath: string
}

export interface GotoUrlOutput {
  file: AttachmentFile | null
  html: string | null
  links: string[] | null
  canonical: string | null
  log: string
  ok: boolean
  status: number
  inflightModRun: boolean
  inflightModSuccess: boolean
  headers: {[key: string]: string}
}

type DebugFn = (...args: any[]) => void

export async function gotoUrl(
  page: Page,
  url: string,
  tmpDir?: string,
  // inflightMod?: InflightMod,
  cssOverrideFileName?: string | null
): Promise<GotoUrlOutput> {
  let errorLog: string = ''
  const debug: DebugFn = (...args) => {
    rpaDebugLog(args)
    const message: string = args.map((arg) => _serialize(arg)).join(' ')
    errorLog += `spider:rpa ` + message + '\n' // Append the message to errorLog
  }

  // await page.route('**/*', (route) => route.continue())

  // const responseBuffers = new Map()

  let fileResponse: AttachmentFile | null = null

  // // Assuming you've defined suggestedFilename, uuidv4, fs, path, and have a tmpDir variable
  // const processedUrls = new Set()

  // // A queue to hold responses
  // const responseQueue: Array<() => Promise<void>> = []

  // // Function to process the response queue
  // async function processResponseQueue() {
  //   while (responseQueue.length > 0) {
  //     const processResponse = responseQueue.shift()
  //     if (processResponse) {
  //       await processResponse()
  //     }
  //   }
  // }

  // let isProcessing = false // Flag to indicate if the queue is being processed

  // if (!isProcessing) {
  // isProcessing = true
  // await processResponseQueue().finally(() => {
  //   isProcessing = false // Reset flag when done processing
  // })
  // }

  // page.on('request', async (request) => {
  //   const allHeaders = await request.allHeaders()
  //   debug('resp')('request called', allHeaders)
  // })

  // page.on('response', async (response) => {
  //   // Wrap response handling logic in a function to add to the queue
  //   const handleResponse = async () => {
  //     // const respUr l = response.url()
  //     // Existing response handling logic goes here...
  //     const respUrl = response.url()
  //     const respStatus = response.status() // Status code
  //     const request = response.request()
  //     const reqMethod = request.method() // HTTP Method
  //     const reqHeaders = request.headers() // Request headers
  //     const respHeaders = await response.allHeaders() // Response headers
  //     const timestamp = new Date().toISOString() // Current timestamp

  //     const _allHeaders = await response.allHeaders()
  //     const _contentType = _allHeaders['content-type'] || 'application/octet-stream'
  //     debug('process')('processed: ', JSON.stringify(processedUrls))
  //     debug('contenttype')(`-> ${_contentType}`)
  //     // Skip processing if this URL has already been handled
  //     if (processedUrls.has(respUrl)) {
  //       return
  //     }
  //     processedUrls.add(respUrl) // Mark this URL as processed
  //     debug('resp')(`[${timestamp}] Response received -> URL: ${respUrl}, Method: ${reqMethod}, Status: ${respStatus}`)
  //     // debug('resp')('Request Headers:', reqHeaders)
  //     debug('resp')('Response Headers:', respHeaders)

  //     const allHeaders = await response.allHeaders()
  //     const contentType = allHeaders['content-type'] || 'application/octet-stream'
  //     const suggestedName = suggestedFilename(respUrl, allHeaders, contentType)

  //     debug('respurl')('url: ', respUrl, allHeaders)
  //     try {
  //       const buffer = await response.body().catch((e) => {
  //         debug('respurl')('Failed buffer request: ', e)
  //         // This catch block is triggered multiple times for some PDFs
  //         // Since we're now skipping already processed URLs, we should see this less often
  //       })

  //       if (buffer) {
  //         debug('respurl')('Buffer set -> ', respUrl)
  //         const storageFilename = uuidv4()
  //         if (tmpDir) {
  //           const filePath = path.join(tmpDir, storageFilename)
  //           fs.writeFileSync(filePath, buffer) // Save the content to the disk with a unique UUID filename
  //           fileResponse = {
  //             contentType: contentType,
  //             fileName: suggestedName,
  //             filePath: filePath
  //           }

  //           // You can do something with fileResponse here
  //           debug('respurl')('File saved:', fileResponse)
  //         } else {
  //           debug('respurl')('ERROR: Tmp Dir not specified!')
  //         }
  //       }
  //     } catch (e) {
  //       debug('respurl')('Error processing response:', e)
  //     }
  //   }

  //   // Add the response handler to the queue
  //   responseQueue.push(handleResponse)

  //   const respUrl = response.url()
  //   const respStatus = response.status() // Status code
  //   const request = response.request()
  //   const reqMethod = request.method() // HTTP Method
  //   const reqHeaders = request.headers() // Request headers
  //   const respHeaders = await response.allHeaders() // Response headers
  //   const timestamp = new Date().toISOString() // Current timestamp

  //   debug('queue')(`[${timestamp}] Response received -> URL: ${respUrl}, Method: ${reqMethod}, Status: ${respStatus}`)
  //   // Start processing the queue if not already doing so
  // })

  // page.on('requestfinished', () => {
  //   debug('resp')('requestfinished called')
  // })

  // page.on('response', async (response) => {

  // })

  let pageResponse: Response | null = null
  let pageOk = false
  let pageStatus = -1
  let pageHeaders: {[key: string]: string} = {}
  // try {
  debug('Request started for URL:', url)
  pageResponse = await page.goto(url)

  // await pageScrollToBottomNatural(page)
  // } catch (e) {
  //   debug('Error during page navigation:', e)
  //   // should we just assume it was inlined at this stage
  // }

  if (pageResponse) {
    debug('Response received with status:', pageStatus, pageResponse.statusText())

    pageHeaders = await getNormalizedHeadersFromPlaywright(debug, pageResponse)
    if (pageResponse.status()) {
      pageStatus = pageResponse.status()
    }

    // if (pageResponse.request().redirectedFrom()) {
    //   debug('Request was redirected from:', pageResponse.request().redirectedFrom()?.url())
    // }

    await logRequestChain(debug, pageResponse)
  } else {
    debug('No response received for the request.')
  }
  debug('Response headers:', pageHeaders)

  // await pageResponse?.allHeaders()
  // run queue events --
  // console.log(responseQueue)
  // await processResponseQueue().finally(() => {
  //   isProcessing = false // Reset flag when done processing
  //   debug('resp')('QUEUE FINISHED')
  // })

  // if (pageResponse?.ok()) {
  //   pageOk = true
  // }
  debug('Page load status:', pageStatus)
  if (pageStatus >= 200 && pageStatus < 400) {
    pageOk = true
  }

  // const contentType = pageResponse?.headers()['content-type']

  let contentIsHtml = await isContentHtml(debug, pageResponse)

  // let contentIsHtml = contentType?.startsWith('text/html')
  if (contentIsHtml) {
    if (cssOverrideFileName) {
      await page.addStyleTag({path: cssOverrideFileName})
      debug('css overrides applied: ', cssOverrideFileName)
    }

    // run a page inflight mod
    let modResult = false
    let modRan = false
    // if (inflightMod) {
    //   modRan = true
    //   modResult = await inflightMod({page})
    //   debug('modResult', modResult)
    // } else {
    //   debug('no mod ran')
    // }

    const linkElements = await page.$$('a')

    // Collect 'href' attributes from each link element
    const links: string[] = []
    await Puppet.asyncForEach(linkElements, async (link) => {
      const href = await link.getAttribute('href')
      if (href) {
        links.push(href)
      }
    })
    // console.log(links)

    const canonicalElement = await page.$('link[rel="canonical"]')

    // Retrieve the 'href' attribute if the element exists
    let canonicalUrl = ''
    if (canonicalElement) {
      const href = await canonicalElement.getAttribute('href')
      if (href) {
        canonicalUrl = href
      }
    } else {
      canonicalUrl = page.url()
    }
    debug('canonicalUrl: ', canonicalUrl)

    const baseUrl = page.url()
    const resolvedLinks = resolveLinks(baseUrl, links)
    debug('resolvedLinks: ', resolvedLinks)

    const html = await page.content()
    // const html = await page.evaluate(() => {
    //   return document.documentElement.outerHTML
    // })
    return {
      links: resolvedLinks,
      canonical: canonicalUrl,
      ok: pageOk,
      html,
      log: errorLog,
      file: null,
      status: pageStatus,
      inflightModRun: modRan,
      inflightModSuccess: modResult,
      headers: pageHeaders
    }
  } else {
    // accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    // 'upgrade-insecure-requests': '1',
    // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    // 'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    // 'sec-ch-ua-mobile': '?0',
    // 'sec-ch-ua-platform': '"Mac OS X"'

    debug('content type not html')

    try {
      // Check for the RPA_PROXY environment variable
      const proxyUrl = process.env.RPA_PROXY
      let httpsAgent

      // If RPA_PROXY is set, configure the socks proxy agent
      if (proxyUrl) {
        // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
        httpsAgent = new SocksProxyAgent(proxyUrl)
      } else {
        // If no proxy is set, use the regular https agent with root CA
        httpsAgent = new https.Agent({
          ca: rootCa
        })
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer', // Important for binary responses, like files
        headers: {
          // Include only the specified headers
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Sec-CH-UA': '" Not;A Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Mac OS X"'
        },
        httpsAgent: httpsAgent
      })

      debug('content type (response.headers): ', response.headers)

      // Access headers, status, etc. from the response
      const contentType_ = response.headers['content-type']
      pageHeaders = getNormalizedHeadersFromAxios(debug, response)
      debug('content type: ', contentType_)
      // suggestedFilename(respUrl, allHeaders, contentType)
      const {fileName, contentType: newContentType} = deriveFilenameAndContentType(
        debug,
        url,
        response.headers as {[key: string]: string},
        contentType_
      )
      if (tmpDir) {
        // Write the response data (buffer) to a file
        const filePath = path.join(tmpDir, uuidv4())
        fs.writeFileSync(filePath, response.data)
        fileResponse = {
          contentType: newContentType,
          fileName: fileName,
          filePath: filePath
        }

        debug(`File saved as ${filePath}`)
        pageOk = true
        pageStatus = 200
      } else {
        debug('tmpDir not defined')
      }
    } catch (error) {
      debug('Error fetching or saving the file:', error)
    }
    const fileResp = {
      links: null,
      canonical: null,
      ok: pageOk,
      html: null,
      log: errorLog,
      file: fileResponse,
      status: pageStatus,
      inflightModRun: false,
      inflightModSuccess: false,
      headers: pageHeaders
    }
    debug('FileResp: ', fileResp)
    return fileResp
  }
}

export async function startBrowser(debug: DebugFn, headless: boolean) {
  let browserContext = null
  let currentPage = null
  browserContext = await Puppet.setupBrowserContext({
    headless: headless,
    browserWidth: 1024,
    browserHeight: 768,
    quiet: true,
    addBlockList: []
  })
  if (!browserContext) {
    debug('start-browser - Unable to launch browser context')
    return {browserContext: null, currentPage: null, lastRestart: Date.now()}
  }

  // browserContext.on('requestfailed', () => {

  // })
  // browserContext.on('weberror', () => {

  // })
  // await context.tracing.start({screenshots: true, snapshots: true})
  currentPage = await browserContext.newPage()
  let lastRestart = Date.now()
  return {browserContext, currentPage, lastRestart}
}

export async function closeBrowser(debug: DebugFn, browserContext: BrowserContext) {
  try {
    const browser = browserContext?.browser()
    await browserContext?.close()
    if (browser) {
      browser.close()
    }
  } catch (e) {
    debug(`close-browser - Force closing browser error ignoring: ${e}`)
  }
}

async function logRequestChain(debug: DebugFn, pageResponse: Response) {
  const redirectChain: string[] = []

  // Start with the final request that received the response.
  let currentRequest = pageResponse.request()

  // Use a loop to walk back through the redirect chain using redirectedFrom().
  while (currentRequest) {
    const redirectedFromRequest = currentRequest.redirectedFrom()

    // Check if redirectedFromRequest is not null before proceeding.
    if (redirectedFromRequest) {
      // Prepend the URL of the redirectedFromRequest to the redirect chain.
      redirectChain.unshift(redirectedFromRequest.url())

      // Move to the previous request in the chain.
      currentRequest = redirectedFromRequest
    } else {
      // If redirectedFromRequest is null, break out of the loop.
      break
    }
  }

  // Log the entire redirect chain, if any.
  if (redirectChain.length > 0) {
    debug('request-chain - Redirect chain:')
    redirectChain.forEach((url, index) => {
      debug(`request-chain -  Redirect ${index + 1}: ${url}`)
    })
  } else {
    debug('request-chain - No redirects occurred.')
  }
}

function deriveFilenameAndContentType(
  debug: DebugFn,
  url: string,
  headers: {[key: string]: string},
  originalContentType: string = 'application/octet-stream'
): {fileName: string; contentType: string} {
  let filename = ''
  const contentDisposition = headers['content-disposition']
  let contentType = originalContentType

  debug(`FILENAME - deriveFilenameAndContentType---`)
  debug(`FILENAME - url: ${url}`)
  debug(`FILENAME - content disposition: `, contentDisposition)
  debug(`FILENAME - initial contenttype: ${contentType}`)

  // Attempt to get filename from content disposition header
  if (contentDisposition) {
    const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (matches && matches[1]) {
      filename = matches[1].replace(/['"]/g, '') // Remove any surrounding quotes
      debug('FILENAME - content disposition contains filename:', filename)
    }
  }

  // Fallback or supplement: use URL to determine filename if not already set or to confirm extension
  if (!filename || !filename.includes('.')) {
    const urlPath = new URL(url).pathname
    const urlFilename = urlPath.substring(urlPath.lastIndexOf('/') + 1)
    if (urlFilename) {
      // Use the URL-derived filename if no filename was found in the content disposition
      filename = filename || urlFilename

      // Update the content type based on the URL-derived filename's extension if original content type is generic
      const urlExtension = path.extname(urlFilename).toLowerCase()
      const mimeFromUrlExtension = lookup(urlExtension)
      if (mimeFromUrlExtension && originalContentType === 'application/octet-stream') {
        contentType = mimeFromUrlExtension
      }
    }
  }

  // Further refine the content type based on the filename extension, if applicable
  const extension = path.extname(filename).toLowerCase()
  const mimeFromExtension = lookup(extension)
  if (
    mimeFromExtension &&
    (originalContentType === 'application/octet-stream' || contentType === 'application/octet-stream')
  ) {
    contentType = mimeFromExtension
  }

  debug(`FILENAME - final filename: ${filename}`)
  debug(`FILENAME - final contenttype: ${contentType}`)

  return {fileName: filename, contentType}
}

async function isContentHtml(debug: DebugFn, pageResponse: Response | null) {
  debug(`is-content-html - evaluate page response: ${!pageResponse}`)
  if (!pageResponse) {
    return false
  }

  const contentType = pageResponse.headers()['content-type']

  // Directly return true if the Content-Type header indicates HTML content.
  debug(`is-content-html - evaluate contentType text/html: ${contentType?.startsWith('text/html')}`)
  if (contentType?.startsWith('text/html')) {
    return true
  }

  // Only proceed to check the body if the Content-Type is unclear or not set.
  debug(`is-content-html - contentType exists: ${!contentType}`)
  debug(`is-content-html - contentType is binary: ${contentType === 'application/octet-stream'}`)
  if (!contentType || contentType === 'application/octet-stream') {
    try {
      debug('is-content-html - about to read a portion of the response body for HTML checks...')

      // Consider using a stream or a partial fetch if the API supports it to avoid loading large responses.
      // This example proceeds with caution, assuming .text() or .body() fetches the entire response.
      // You might implement a more efficient approach depending on the API's capabilities.

      // Fetch a limited portion of the response body for HTML detection.
      const responseBody = await pageResponse.text() // Consider partial fetch if possible
      const htmlPattern =
        /\s*(<!DOCTYPE html>|<!--.*?-->|<html\s*[^>]*>|<head>|<title>|<body>|<meta\s*[^>]*>)/i
      return htmlPattern.test(responseBody)
    } catch (error) {
      debug('is-content-html - Error or timeout reading response body:', error)
      return false
    }
  }

  // If the Content-Type header is set and it's not 'text/html' or 'application/octet-stream', assume it's not HTML.
  return false
}

async function getNormalizedHeadersFromPlaywright(debug: DebugFn, pageResponse: Response) {
  const rawHeaders = await pageResponse.allHeaders() // Assuming pageResponse is valid
  const headers: {[key: string]: string} = {}
  const normalizedHeaders = Object.keys(rawHeaders).reduce((acc, key) => {
    headers[`${key}`.toLowerCase()] = rawHeaders[key]
    return acc
  }, {})

  return headers
}

function getNormalizedHeadersFromAxios(debug: DebugFn, response: AxiosResponse<any, any>) {
  const rawHeaders = response.headers // Assuming response is the Axios response
  const headers: {[key: string]: string} = {}
  const normalizedHeaders = Object.keys(rawHeaders).reduce((acc, key) => {
    headers[`${key}`.toLowerCase()] = rawHeaders[key]
    return acc
  }, {})

  return headers
}
