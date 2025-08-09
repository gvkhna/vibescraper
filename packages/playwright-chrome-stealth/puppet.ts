// import puppeteer from 'puppeteer'
// import * as playwright from 'playwright'
import {type Page, type Request as PWRequest, type Response as PWResponse} from 'playwright'
import {chromium} from 'playwright-extra'
import extraPluginStealth from 'puppeteer-extra-plugin-stealth'
import type {ElementHandle, Locator, BrowserContext} from 'playwright'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import * as os from 'node:os'
import * as crypto from 'node:crypto'
import debug from 'debug'

const log = debug('spider:puppet')

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const ualist = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.1; rv:95.0) Gecko/20100101 Firefox/95.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15'
]

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class Puppet {
  // static async browser(port?: number) {
  //   const chromeScrapePort = port || 9222
  //   const res = await axios.get(`http://0.0.0.0:${chromeScrapePort}/json/version`)
  //   return puppeteer.connect({ browserWSEndpoint: res.data.webSocketDebuggerUrl, ignoreHTTPSErrors: true })
  // }

  // static async retryRefresh(page: Page, actions: () => Promise<void>) {
  //   return Puppet.promiseRetry(() => {
  //     return new Promise<void>((retryResolve, retryReject) => {
  //       try {
  //         actions()
  //           .then(() => {
  //             return retryResolve()
  //           })
  //           .catch((error) => {
  //             log(`Failed at actions. Retrying... Error: ${error.message}`)
  //             page.reload().then(() => {
  //               retryReject();
  //             })
  //           })
  //       } catch (error) {
  //         if (error && error instanceof Error) {
  //           log(`Failed at actions. Retrying... Error: ${error.message}`)
  //         }

  //         page.reload().then(() => {
  //           return retryReject()
  //         })
  //       }
  //     })
  //   })
  // }

  static async retryClick(page: Page, locator: Locator, action: 'goback' | 'refresh' = 'goback') {
    return Puppet.promiseRetry(() => {
      return new Promise<void>((retryResolve, retryReject) => {
        let needToAct = false
        let clickUrl: string | null = null

        const handleError = (err: Error) => {
          log(`Page error encountered: ${err.message}`)
          needToAct = true
          cleanUpAndRetry()
        }

        const handleRequestFailed = (req: PWRequest) => {
          if (req.url() === clickUrl) {
            log(`Request failed: ${req.url()}`)
            needToAct = true
            cleanUpAndRetry()
          }
        }

        const handleResponse = (resp: PWResponse) => {
          if (resp.url() === clickUrl && resp.status() === 502) {
            log(`Navigation resulted in 502 error.`)
            needToAct = true
            cleanUpAndRetry()
          }
        }

        const cleanUpAndRetry = () => {
          page.removeListener('pageerror', handleError)
          page.removeListener('requestfailed', handleRequestFailed)
          page.removeListener('response', handleResponse)

          return retryReject()
        }

        // Attach event listeners
        page.once('request', (req) => {
          clickUrl = req.url()
        })
        page.on('pageerror', handleError)
        page.on('requestfailed', handleRequestFailed)
        page.on('response', handleResponse)

        try {
          // Attempt to click, which triggers navigation
          locator
            .click()
            .then(() => {
              // Optional: wait for navigation to complete if applicable
              return page.waitForLoadState('domcontentloaded')
            })
            .then(() => {
              // Cleanup event listeners after successful click and navigation
              page.removeListener('pageerror', handleError)
              page.removeListener('requestfailed', handleRequestFailed)
              page.removeListener('response', handleResponse)

              if (needToAct) {
                log('Navigating back due to 502 error or failure...')
                if (action === 'goback') {
                  return page.goBack().then(() => retryReject())
                } else if (action === 'refresh') {
                  return page.reload().then(() => retryReject())
                }
              } else {
                return retryResolve()
              }
            })
            .catch((error) => {
              log(`Failed to navigate after click. Error: ${error.message}`)
              cleanUpAndRetry()
            })
        } catch (error) {
          if (error && error instanceof Error) {
            log(`Failed to navigate after click. Error: ${error.message}`)
          }
          cleanUpAndRetry()
        }
      })
    })
  }

  static async retryGoto(page: Page, gotoUrl: string) {
    return Puppet.promiseRetry(() => {
      return new Promise<void>((retryResolve, retryReject) => {
        try {
          page
            .goto(gotoUrl, {waitUntil: 'networkidle'})
            .then(() => {
              return retryResolve()
            })
            .catch((error) => {
              log(`Failed to navigate to ${gotoUrl}. Error: ${error.message}`)
              return retryReject()
            })
          return // Navigation successful, exit function
        } catch (error) {
          log(`Failed to navigate to ${gotoUrl}. Error: ${error}`)
          return retryReject()
        }
      })
    })
  }

  /**
   * Runs ctrl+A and backspace to clear field
   * @param page
   * @param selector
   */
  static async clearInputField(page: Page, selector: string) {
    if (page && selector) {
      await page.focus(selector)
      const isMac = process.platform === 'darwin'
      if (isMac) {
        await page.keyboard.down('Meta') // Cmd key for macOS
      } else {
        await page.keyboard.down('Control') // Ctrl key for Windows/Linux
      }
      await page.keyboard.press('A') // Press 'A' to select all text
      if (isMac) {
        await page.keyboard.up('Meta')
      } else {
        await page.keyboard.up('Control')
      }

      // Press Backspace to clear the selected text
      await page.keyboard.press('Backspace')
    }
  }

  /**
   * Runs ctrl+A and starts typing the text
   * @param page
   * @param selector
   * @param text
   */
  static async clearInputFieldFill(page: Page, selector: string, text: string) {
    if (page && selector) {
      await page.focus(selector)
      const isMac = process.platform === 'darwin'
      if (isMac) {
        await page.keyboard.down('Meta') // Cmd key for macOS
      } else {
        await page.keyboard.down('Control') // Ctrl key for Windows/Linux
      }
      await page.keyboard.press('A') // Press 'A' to select all text
      if (isMac) {
        await page.keyboard.up('Meta')
      } else {
        await page.keyboard.up('Control')
      }

      // Press Backspace to clear the selected text
      const elem = await page.$(selector)
      await elem?.fill(text)
    }
  }

  static async downloadLinkInNewTab(ctx: BrowserContext, urlStr: string, saveTo: string) {
    const page = await ctx.newPage()

    page.route('**', async (route, request) => {
      const response = await page.context().request.get(route.request().url())
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          'Content-Disposition': 'attachment'
        }
      })
    })

    const customHTML = (u: string) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Download Link</title>
        </head>
        <body>
            <a href="${u}" download="download">Click to download</a>
        </body>
        </html>
    `

    const downloadPromise = page.waitForEvent('download')

    await page.setContent(customHTML(urlStr))
    await page.click('a')

    // Await for the download event to finish and get the download object
    const download = await downloadPromise

    let destination: string
    const tempPath = await download.path()
    if (tempPath) {
      const hash = crypto.createHash('md5')
      const fileStream = fs.createReadStream(tempPath)

      fileStream.on('data', (chunk) => hash.update(chunk))
      await new Promise<void>((resolve, reject) => {
        fileStream.on('end', () => {
          resolve()
        })
        fileStream.on('error', reject)
      })

      // Determine the destination path
      let extension = path.extname(download.suggestedFilename())
      if (!extension) {
        extension = '.unknown'
      }
      destination = path.resolve(saveTo, `${hash.digest('hex')}${extension}`)

      log(`Puppet: Downloaded file to ${destination}`)
      // Move the file from the temp path to the destination path
      fs.renameSync(tempPath, destination)
    } else {
      throw new Error('Download Path non-existant')
    }

    await page.close()

    return destination
  }

  static async downloadByClick(page: Page, buttonLocator: Locator, modalDownloadLocator: Locator, saveTo: string, fileName?: string) {
    // Ensure the save directory exists
    if (!fs.existsSync(saveTo)) {
      fs.mkdirSync(saveTo, { recursive: true })
    }

    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    
    // Click the initial button that triggers the modal
    await buttonLocator.click()
    log('Clicked download button, waiting for modal...')
    
    // Wait for modal and download button to appear
    await modalDownloadLocator.waitFor({ state: 'visible', timeout: 10000 })
    log('Modal appeared, clicking download button...')
    
    // Click the download button in the modal
    await modalDownloadLocator.click()
    
    // Wait for the download to start
    const download = await downloadPromise
    log(`Download started: ${download.suggestedFilename()}`)
    
    // Wait for download to complete and get the path
    const tempPath = await download.path()
    if (!tempPath) {
      throw new Error('Download failed - no temporary path')
    }
    
    // Determine the final filename
    const finalFileName = fileName || download.suggestedFilename()
    const destination = path.resolve(saveTo, finalFileName)
    
    // Move the file from temp location to final destination
    await download.saveAs(destination)
    log(`File saved to: ${destination}`)
    
    return destination
  }

  static stealthType(text: string) {}

  static md5(content: string) {
    return crypto.createHash('md5').update(content).digest('hex')
  }

  static mktmpdir() {
    let tmpDir
    const appPrefix = 'puppet'
    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix))
      // the rest of your app goes here
    } catch (e) {
      // handle error
      log(`An error has occurred while creating the temp folder. Error: ${e}`)
    }
    return tmpDir
  }

  static rmtmpdir(tmpDir: string | undefined | null) {
    try {
      if (tmpDir) {
        fs.rmSync(tmpDir, {recursive: true})
      }
    } catch (e) {
      log(
        `An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`
      )
    }
  }

  static randomInteger(min: number, max: number): number {
    return Math.round(Math.random() * max + min)
  }
  static timeout(wait: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, wait)
    })
  }
  static randomTimeout(min: number, max: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve()
        },
        Puppet.randomInteger(min, max)
      )
    })
  }
  static randomIndex(min: number, max: number): number {
    const minVal = Math.ceil(min)
    const maxVal = Math.floor(max)
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal
  }
  static promiseRetry<T>(
    p: () => Promise<T>,
    maxRetries?: number,
    wait: number = 1000,
    quiet = false
  ): Promise<T | undefined> {
    const MAX_RETRIES = maxRetries || 5
    return Puppet.promiseWhile((counter) => {
      return new Promise<T | undefined>((resolve, reject) => {
        if (counter >= MAX_RETRIES) {
          return resolve(undefined)
        }
        try {
          p()
            .then((resp) => {
              return resolve(resp)
            })
            .catch((err) => {
              if (!quiet) {
                log('PROMISE RETRY promise-err: ', err)
              }
              const backoff = (counter + 2) * (counter + 2) * wait
              if (!quiet) {
                log('PROMISE RETRY: backing off for ', backoff)
              }
              setTimeout(() => {
                return reject()
              }, backoff)
            })
        } catch (e) {
          if (!quiet) {
            log('PROMISE RETRY catch-err: ', e)
          }
          const backoff = (counter + 2) * (counter + 2) * wait
          if (!quiet) {
            log('PROMISE RETRY: backing off for ', backoff)
          }
          setTimeout(() => {
            return reject()
          }, backoff)
        }
      })
    })
  }

  static async asyncForEach<T>(
    array: T[],
    callback: (value: T, index?: number, array?: T[]) => Promise<void>
  ) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  static async promiseForEachAll<T, O>(array: T[], callback: (value: T, index?: number) => Promise<O>) {
    let p: Promise<O>[] = []
    const len = array.length
    for (let index = 0; index < len; index++) {
      const item = array[index]
      p.push(callback(item, index))
    }
    const output = await Promise.allSettled(p)
    return output
  }

  static async asyncFor<T>(length: number, callback: (index: number) => Promise<void>) {
    for (let index = 0; index < length; index++) {
      await callback(index)
    }
  }

  static promiseWhile<T>(
    promiseConstructor: (counter: number, previousResult?: Promise<T>) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let counter = 0
      const run = (previousResult?: any) => {
        const p = promiseConstructor(counter, previousResult)
        counter++
        if (p instanceof Promise) {
          p.then(resolve).catch(run)
        } else {
          reject(p)
        }
      }
      run()
    })
  }

  static promiseForeach<T>(
    array: T[],
    each: (index: number, previousResult?: Promise<T>) => Promise<T>
  ): Promise<T> {
    return new Promise<any | undefined>((resolve, reject) => {
      let counter = 0
      if (array.length === 0) {
        resolve(undefined)
        return
      }
      const run = (previousResult?: any) => {
        if (counter >= array.length) {
          resolve(undefined)
          return
        }
        const p = each(counter, previousResult)
        counter++
        // log('p: ', p)
        if (p instanceof Promise) {
          p.then(resolve).catch(run)
        } else {
          log('unknown promise: ', p)
          reject(p)
        }
      }
      run()
    })
  }
  static async asyncBatch<TaskType, ResultType>(
    tasks: TaskType[],
    handler: (task: TaskType, taskIndex: number, workerIndex: number) => Promise<ResultType>,
    desiredWorkers: number
  ): Promise<ResultType[]> {
    // Cap workers count to task list size, with a min of 1 worker
    const workersCount = Math.max(Math.floor(Math.min(desiredWorkers, tasks.length)), 1)

    const results: ResultType[] = []
    let i = 0
    await Promise.all(
      Array.from({length: workersCount}).map(async (w, workerIndex) => {
        while (i < tasks.length) {
          const taskIndex = i
          i++
          results[taskIndex] = await handler(tasks[taskIndex], taskIndex, workerIndex)
        }
      })
    )
    return results
  }

  // static async asyncWhile<ResultType>(
  //   condition: () => boolean,
  //   handler: (taskIndex: number) => Promise<ResultType>,
  //   startIndex = 0
  // ): Promise<ResultType[]> {
  //   const results: ResultType[] = []
  //   let i = startIndex
  //   await Promise.all(
  //     Array.from({ length: 1 }).map(async (w) => {
  //       while (condition()) {
  //         const taskIndex = i
  //         i++
  //         results[taskIndex] = await handler(taskIndex)
  //       }
  //     })
  //   )
  //   return results
  // }

  /**
   * Executes a batch of asynchronous tasks in parallel with a controlled number of workers, based on a condition.
   * This function dynamically manages parallel execution of tasks to optimize resource utilization and efficiency.
   *
   * @param length - Total number of tasks to be executed.
   * @param condition - A no-argument function that returns a boolean to continue or break the execution loop.
   * @param handler - An async function to handle task execution, receiving the task and worker indices.
   * @param desiredWorkers - The desired number of workers to parallelize task execution. Actual workers used will be the minimum of this value and the total task count, capped at a minimum of 1 to ensure progress.
   * @param startIndex - (Optional) The starting index for task execution, defaulting to 0 if not specified.
   *
   * @returns A Promise resolving to an array of results from the executed tasks, corresponding to each task's execution order.
   */
  static async asyncWhileBatch<TaskType, ResultType>(
    length: number,
    condition: () => boolean,
    handler: (taskIndex: number, workerIndex: number) => Promise<ResultType>,
    desiredWorkers: number,
    startIndex = 0
  ): Promise<ResultType[]> {
    // Cap workers count to task list size, with a min of 1 worker
    const workersCount = Math.max(Math.floor(Math.min(desiredWorkers, length)), 1)

    const results: ResultType[] = []
    let i = startIndex
    await Promise.all(
      Array.from({length: workersCount}).map(async (w, workerIndex) => {
        while (i < length && condition()) {
          const taskIndex = i
          i++
          results[taskIndex] = await handler(taskIndex, workerIndex)
        }
      })
    )
    return results
  }

  /**
   * Executes a batch of asynchronous tasks with controlled concurrency, interspersed with regular intervals and a monitoring mechanism for task throughput.
   * This function is designed to handle tasks that might require periodic breaks or checks between batches of task executions.
   *
   * @param length - Total number of tasks to be executed.
   * @param intervalBatch - Number of tasks to execute before invoking the interval handler for a break or check.
   * @param intervalHandler - An async function to be executed at each interval, allowing for periodic operations such as cleanup or status updates.
   * @param stopCondition - A no-argument function returning a boolean that determines if task execution should continue. Execution stops if this function returns false.
   * @param handler - An async function that executes each task, receiving task and worker indices.
   * @param desiredWorkers - The desired number of workers to parallelize task execution, with the actual number being the minimum of this value and the total task count, but not less than 1.
   * @param startIndex - (Optional) The starting index for task execution, defaulting to 0 if not provided.
   *
   * @returns A Promise that resolves when all tasks have been attempted or when the stop condition fails, signifying the end of execution.
   * This function also logs task throughput as tasks completed per minute, providing insight into the performance and pace of task execution.
   */
  static async asyncWhileBatchWithIntervals(
    length: number,
    intervalBatch: number,
    intervalHandler: () => Promise<void>,
    stopCondition: () => boolean,
    handler: (taskIndex: number, workerIndex: number) => Promise<void>,
    desiredWorkers: number,
    startIndex = 0
  ): Promise<void> {
    const workersCount = Math.max(Math.floor(Math.min(desiredWorkers, length)), 1)

    const startTime = new Date().getTime()
    let currentIntervalStartTime = new Date().getTime()
    let currentTasks = 0
    const updateTaskComplete = () => {
      let currentTime = new Date().getTime()
      const measureInterval = 1000 * 60 * 1 // 1 minute
      if (currentTime > currentIntervalStartTime + measureInterval) {
        log(`MEASURE: ${currentTasks}/m`)
        currentTasks = 0
        currentIntervalStartTime = currentTime
      } else {
        currentTasks = currentTasks + 1
      }
    }
    let i = startIndex
    await Puppet.promiseWhile((counter) => {
      return new Promise<void>(async (resolve, reject) => {
        if (i < length) {
          // const batchStart = i
          const batchEnd = i + intervalBatch
          // let batchStop = true
          // log('starting outer batch: ', i, batchEnd)
          await Promise.all(
            Array.from({length: workersCount}).map((w, workerIndex) => {
              return Puppet.promiseWhile(() => {
                return new Promise<void>(async (innerResolve, innerReject) => {
                  if (i < batchEnd && stopCondition()) {
                    const taskIndex = i
                    i++
                    // log('init next inner batch', i, batchEnd)
                    await handler(taskIndex, workerIndex)
                    updateTaskComplete()
                    // log('reject to next inner batch', i, batchEnd)
                    return innerReject()
                  } else {
                    // log('stopping inner batch', i, batchEnd)
                    return innerResolve()
                  }
                })
              })
              // if (!(i < batchEnd)) {
              //   batchStop = false
              // }
              // while (batchStop && i < batchEnd && stopCondition()) {
              //   const taskIndex = i
              //   i++
              //   await handler(taskIndex, workerIndex)
              // }
            })
          )
          log('starting interval handler', i, batchEnd)
          await intervalHandler()
          return reject()
        } else {
          // ended
          log('outer batch resolved')
          return resolve()
        }
      })
    })
  }

  static async siblingChildrenTableToData(elem: ElementHandle<HTMLTableElement>) {
    const children = await elem.$$('tr')
    const output: any = {}
    if (children) {
      await Puppet.asyncForEach(children, async (row) => {
        const items = await row.$$('td')
        if (items && items.length === 2) {
          const headItem = await items[0].innerText()
          const itemData = await items[1].innerText()
          output[headItem] = itemData
        }
      })
    }
    // log('item: ', output)
    return output
  }
  static async tableToDataDisjointed(elem: Locator, headerElem: Locator) {
    log('tableToDataDisjointed')
    const handle = await elem.elementHandle({
      timeout: 5000
    })
    const header = await headerElem.elementHandle({
      timeout: 5000
    })
    // const thead = await handle?.$('thead')
    const tbody = await handle?.$('tbody')
    const output: any = []

    const headTbody = await header?.$('tbody')
    // log('handle, tbody', handle, tbody)
    if (handle && tbody && header && headTbody) {
      const thElems = await header.$$('th')
      const columnHeads: string[] = []
      await Puppet.asyncForEach(thElems, async (th) => {
        const text = await th.innerText()
        columnHeads.push(text)
      })
      const trElems = await tbody.$$('tr')

      await Puppet.asyncForEach(trElems, async (tr) => {
        const row: any = {}
        const tdElems = await tr.$$('td')
        if (tdElems && tdElems.length > 0) {
          await Puppet.asyncForEach(tdElems, async (td, tdIndex) => {
            const text = await td.innerText()
            if (typeof tdIndex === 'number') {
              const columnHead = columnHeads[tdIndex]
              row[columnHead] = text
            }
          })
          output.push(row)
        }
      })
    }
    return output
  }
  // static async tableToDataFirstRowHeader(elem: playwright.Locator) {
  //   log('tableToData')
  //   const handle = await elem.elementHandle({
  //     timeout: 5000
  //   })
  //   // const thead = await handle?.$('thead')
  //   const tbody = await handle?.$('tbody')
  //   const output: any = []
  //   // log('handle, tbody', handle, tbody)
  //   if (handle && tbody) {
  //     // const thElems = await handle.$$('th')
  //     // const columnHeads: string[] = []
  //     // await Puppet.asyncForEach(thElems, async (th) => {
  //     //   const text = await th.innerText()
  //     //   columnHeads.push(text)
  //     // })
  //     const trElems = await tbody.$$('tr')

  //     let columnHeads: string[] = []
  //     await Puppet.asyncForEach(trElems, async (tr, index) => {
  //       if (index === 0) {
  //         const tdElems
  //       } else {
  //         const row: any = {}
  //         const tdElems = await tr.$$('td')
  //         if (tdElems && tdElems.length > 0) {
  //           await Puppet.asyncForEach(tdElems, async (td, tdIndex) => {
  //             const text = await td.innerText()
  //             if (typeof tdIndex === 'number') {
  //               const columnHead = columnHeads[tdIndex]
  //               row[columnHead] = text
  //             }
  //           })
  //           output.push(row)
  //         }
  //       }
  //     })
  //   }
  //   return output
  // }
  static async tableToData(elem: Locator, timeout = 5000) {
    log('tableToData')
    const handle = await elem.elementHandle({
      timeout: timeout
    })
    // const thead = await handle?.$('thead')
    const tbody = await handle?.$('tbody')
    const output: any = []
    // log('handle, tbody', handle, tbody)
    if (handle && tbody) {
      const thElems = await handle.$$('th')
      const columnHeads: string[] = []
      await Puppet.asyncForEach(thElems, async (th) => {
        const text = await th.innerText()
        columnHeads.push(text)
      })
      const trElems = await tbody.$$('tr')

      await Puppet.asyncForEach(trElems, async (tr) => {
        const row: any = {}
        const tdElems = await tr.$$('td')
        if (tdElems && tdElems.length > 0) {
          await Puppet.asyncForEach(tdElems, async (td, tdIndex) => {
            const text = await td.innerText()
            if (typeof tdIndex === 'number') {
              const columnHead = columnHeads[tdIndex]
              row[columnHead] = text
            }
          })
          output.push(row)
        }
      })
    }
    return output
  }

  // static async resetBrowser(browser: playwright.Browser) {
  //   const pages = await browser.
  //   await Puppet.asyncForEach(pages, async (page) => {
  //     await page.close()
  //   })
  //   const newPage = await browser.newPage()
  //   await Puppet.setupPage(newPage)
  //   return newPage
  // }
  // static first(items: puppeteer.ElementHandle<Element>[]) {
  //   if (Array.isArray(items) && items.length > 1) {
  //     log('cannot continue')
  //     return items[0]
  //   } else if (Array.isArray(items)) {
  //     return items[0]
  //   } else {
  //     log('dont know whats going on')
  //     return items
  //   }
  // }
  // static async click(items: puppeteer.ElementHandle<Element>[] | puppeteer.ElementHandle<Element>) {
  //   if (Array.isArray(items) && items.length > 1) {
  //     log('cannot continue')
  //   } else if (Array.isArray(items)) {
  //     const item: puppeteer.ElementHandle<HTMLElement> = items[0]
  //     await Puppet.randomTimeout(250, 500)
  //     try {
  //       await item.click()
  //     } catch (e) {
  //       if (e) {
  //         await item.evaluate((node) => node.click())
  //       }
  //     }

  //     await Puppet.randomTimeout(250, 500)
  //   }
  // }
  // static async highlightItems(
  //   items: puppeteer.ElementHandle<Element>[] | puppeteer.ElementHandle<Element>,
  //   color?: string
  // ) {
  //   const highlight = color || 'red'
  //   if (Array.isArray(items)) {
  //     await Puppet.asyncForEach(items, async (elem) => {
  //       const item: puppeteer.ElementHandle<HTMLElement> = elem
  //       await item.evaluate((node) => (node.style.border = `4px solid red`))
  //     })
  //   } else if (items) {
  //     const item: puppeteer.ElementHandle<HTMLElement> = items
  //     await item.evaluate((node) => (node.style.border = `4px solid red`))
  //   }
  // }

  static normalizeDataItem(data: any) {
    const normalKeyString = (str: string) => {
      return str
        .replace(/\s/gi, '')
        .replace(/[^a-z\d]/gi, '')
        .toUpperCase()
        .replace('\n', ' ')
        .replace(/ +(?= )/g, '')
        .trim()
    }
    const normalValueString = (str: string) => {
      return str
        .replace(/\s/gi, ' ')
        .toUpperCase()
        .replace(/ +(?= )/g, '')
        .trim()
    }
    const keys = Object.keys(data)
    const outputItem: any = {}
    if (keys.length > 0) {
      for (let x = 0; x < keys.length; x++) {
        const key = keys[x]
        const val = data[key]
        const outkey = normalKeyString(key)

        if (Array.isArray(val)) {
          const outval: string[] = []
          for (let i = 0; i < val.length; i++) {
            const innerVal = val[i]
            if (typeof innerVal === 'string') {
              const newval = normalValueString(innerVal)
              if (!(newval.length === 0 || newval === ' ')) {
                outval.push(newval)
              }
            }
          }
          outputItem[outkey] = outval
        } else {
          const outval = normalValueString(val)

          let filterBlankKey = false
          if (outkey.length === 0 || outkey === ' ') {
            filterBlankKey = true
          }
          let filterBlankVal = false
          if (outval.length === 0 || outval === ' ') {
            filterBlankVal = true
          }
          if (filterBlankKey && filterBlankVal) {
            // log('dropping key/val from: ', key, val)
          } else {
            outputItem[outkey] = outval
          }
        }
      }
    }
    return outputItem
  }
  static normalizeDataArray(data: any[]) {
    const output: object[] = []
    if (data && Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        const outputItem = Puppet.normalizeDataItem(item)
        output.push(outputItem)
      }
    }
    return output
  }
  static async closeAllTabs(ctx: BrowserContext) {
    const pages = ctx.pages()
    await Puppet.asyncForEach(pages, async (page) => {
      await page.close()
    })
  }
  static async openTabs(ctx: BrowserContext, length: number) {
    await Puppet.asyncFor(length, async () => {
      await ctx.newPage()
    })
  }
  static async hideElementsByTexts(page: Page, texts: string | string[]) {
    await page.evaluate((inputTexts) => {
      // Ensure input is an array of texts
      if (!Array.isArray(inputTexts)) {
        inputTexts = [inputTexts]
      }

      // Loop through all texts and hide elements containing them
      inputTexts.forEach((text) => {
        // Iterate over all elements and check if their textContent includes the given text
        const xpath = `//*[text()="${text}"]`
        const matchingElement: any = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue
        if (matchingElement) {
          matchingElement.style.display = 'none'
        }
      })
    }, texts)
  }

  // Usage
  // Assume 'page' is an instance of Page that has been properly initialized and navigated to a URL
  // Example: hideElementByTextUsingXPath(page, "Text to Hide");

  static async waitForObjectToLoad(page: Page, sel: string) {
    // Wait for the object element to be available in the DOM
    await page.waitForSelector(sel)

    // Polling to check if the object's content is fully loaded
    await page.waitForFunction((selector) => {
      const obj = document.querySelector(selector) as HTMLObjectElement
      return obj && obj.contentDocument && obj.contentDocument.readyState === 'complete'
    }, sel)
  }

  static async waitForElemToLoad(page: Page, selector: string) {
    // Wait for the img element to be attached
    const imageHandle = await page.waitForSelector(selector, {state: 'attached'})

    // Determine the tag of the element to ensure it's an img
    const tagName = await imageHandle.evaluate((node) => node.tagName.toLowerCase())

    // Check if the element is indeed an 'img' and wait for it to load completely
    if (tagName === 'img') {
      await imageHandle.waitForElementState('stable')
    }
  }
  static async setupBrowserContext({
    persistentDir,
    headless = false,
    quiet = false,
    allowMedia = false,
    browserWidth = 1920,
    browserHeight = 1080,
    blockList,
    defaultTimeout = 100000,
    slowMo = 500,
    addBlockList
  }: {
    persistentDir?: string
    headless?: boolean
    quiet?: boolean
    allowMedia?: boolean
    browserWidth?: number
    browserHeight?: number
    blockList?: string[]
    defaultTimeout?: number
    slowMo?: number
    addBlockList?: string[]
  }) {
    let ctx: BrowserContext | undefined = undefined
    log('Launched env: ', process.env)
    const launchingPersistent = persistentDir ? true : false
    log('Launching Persistent Context: ', launchingPersistent)
    const launchingHeadless = process.env.PWHEADLESS === '1' || headless ? true : false
    const launchingDevtools = process.env.PWDEVTOOLS === '1' && !launchingHeadless ? true : false
    log('Launching Headless: ', launchingHeadless)
    log('Launching Devtools: ', launchingDevtools)
    const args: string[] = [
      // '--no-sandbox',
      // '--disable-setuid-sandbox',
      // '--disable-dev-shm-usage',
      // '--disable-accelerated-2d-canvas',
      // '--no-first-run',
      // '--no-zygote',
      // '--single-process', // <- this one doesn't works in Windows
      // '--disable-gpu'
    ]
    chromium.use(extraPluginStealth())
    if (persistentDir) {
      ctx = await chromium.launchPersistentContext(persistentDir, {
        args: args,
        headless: launchingHeadless,
        devtools: launchingDevtools,
        acceptDownloads: true,
        ignoreHTTPSErrors: true,
        slowMo: slowMo,
        bypassCSP: true,
        viewport: {width: browserWidth, height: browserHeight}
      })
    } else {
      const browser = await chromium.launch({
        args: args,
        headless: launchingHeadless,
        devtools: launchingDevtools,
        slowMo: slowMo
      })
      ctx = await browser.newContext({
        acceptDownloads: true,
        ignoreHTTPSErrors: true,
        bypassCSP: true,
        viewport: {width: browserWidth, height: browserHeight}
      })
      if (defaultTimeout) {
        ctx.setDefaultTimeout(defaultTimeout)
      }
    }
    ctx.on('page', async (page) => {
      try {
        page.on('dialog', async (dialog) => {
          await dialog.dismiss()
        })
        if (process.env.PLAYWRIGHT_SIMPLE_EVASION === '1') {
          const useragent = Puppet.randomIndex(0, ualist.length - 1)
          log('setting user agent: ', ualist[useragent])
          await page.setExtraHTTPHeaders({
            'User-Agent': ualist[useragent]
          })
        }
      } catch (e) {
        log('ignored error: ', e)
      }
    })
    if (process.env.PLAYWRIGHT_SIMPLE_EVASION === '1') {
      await ctx.addInitScript({
        content: fs.readFileSync(path.resolve(__dirname, 'evade-fingerprint.js')).toString()
      })
      await ctx.addInitScript({
        content: `delete window.navigator.serviceWorker`
      })
    }

    await ctx.route('**', async (route, request) => {
      const urlStr = request.url()
      const defaultBlockList = blockList ?? [
        '/images/',
        'addtoany.com',
        'ads',
        'adsrvr.org',
        'adtech',
        'adthrive.com',
        'advertising',
        'alephd.com',
        'amazon-adsystem.com',
        'analytics.js',
        'appdynamics.com',
        'atwola.com',
        'autopilothq.com',
        'bidswitch.net',
        'browser-intake-ddog-gov.com',
        'btloader.com',
        'cdninstagram.com',
        'crazyegg.com',
        'datadoghq-browser-agent.com',
        'doubleclick.net',
        'facebook.com',
        'facebook.net',
        'fontawesome.com',
        'fonts.googleapis.com',
        'fullstory.com',
        'google-analytics.com',
        'googleadservices.com',
        'googletagmanager.com',
        'gstatic.com',
        'gtm.js',
        'heapanalytics.com',
        'heapanalytics.com',
        'inspectlet.com',
        'instagram.com',
        'intercom.io',
        'jquery.blockUI.js',
        'mxpnl.co',
        'newrelic.com',
        'nr-data.net',
        'olark.com',
        'onesignal.com',
        'pendo.io',
        'platform.twitter.com',
        'quantcount.com',
        'quantserve.com',
        'scorecardresearch.com',
        't.co',
        'tiktok.com',
        'tiktokcdn-us.com',
        'tiktokcdn.com',
        'tiktokv.com',
        'ttwstatic.com',
        'typekit.net',
        'typekit',
        'videoplayerhub.com',
        'walkme.com',
        'youtube.com',
        'zendesk.com',
        ...(addBlockList || [])
      ]
      let passesBlockList = true
      for (let i = 0; i < defaultBlockList.length; i++) {
        const key = defaultBlockList[i]
        if (urlStr.indexOf(key) > -1) {
          passesBlockList = false
          break
        }
      }
      if (['image'].includes(request.resourceType())) {
        if (allowMedia) {
          route.continue()
        } else {
          route.abort()
          if (!quiet) {
            log(`ABORT media (${request.resourceType()}): ${request.url()}`)
          }
        }
      } else if (['font'].includes(request.resourceType())) {
        await route.abort()
        if (!quiet) {
          log(`ABORT media (${request.resourceType()}): ${request.url()}`)
        }
      } else if (!passesBlockList) {
        if (!quiet) {
          log(`ABORT analytics (${request.resourceType()}): ${request.url()}`)
        }
        route.abort()
      } else {
        if (!quiet) {
          log(`url (${request.resourceType()}): ${request.url()}`)
        }
        route.continue()
      }
    })
    return ctx
  }
}
