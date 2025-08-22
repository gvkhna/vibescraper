import {db as database} from '@/db/db'
import * as schema from '@/db/schema'
import {eq as sqlEq} from 'drizzle-orm'
import {sqlNow, type SQLUTCTimestamp} from '@/db/schema/common'
import {hashString} from '@/lib/hash-helper'
import {htmlFormat, htmlCleaner, htmlReadability, htmlMarkdown} from '@vibescraper/html-processor'
import {compileJsonSchema, validateDataAgainstSchema} from '@vibescraper/shared-types'
import debug from 'debug'
import type {JsonObject, JsonValue} from 'type-fest'
import type {SandboxManager, CodeExecutionMessage} from '@vibescraper/sandbox'

const log = debug('app:scrape-processor')

// Create a singleton sandbox manager instance
// let sandboxManager: SandboxManager | null = null

// function getSandboxManager(): SandboxManager {
//   sandboxManager ??= new SandboxManager(PRIVATE_VARS.TMP_DIR, worker)
//   return sandboxManager
// }

/**
 * Custom validation logic for handling both single objects and arrays
 * @param schemaObject - The JSON schema to validate against
 * @param data - The extracted data (can be single object or array)
 * @returns Validation result with item-level errors for arrays
 */
function validateExtractionResult(
  schemaObject: JsonObject,
  data: JsonValue
): {
  success: boolean
  message?: string
  itemErrors?: Array<{itemIndex: number; errors: string[]}>
} {
  try {
    // If data is an array, validate each item individually
    if (Array.isArray(data)) {
      const itemErrors: Array<{itemIndex: number; errors: string[]}> = []
      let hasErrors = false

      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        const validation = validateDataAgainstSchema(schemaObject, item)

        if (!validation.success) {
          hasErrors = true
          itemErrors.push({
            itemIndex: i,
            errors: validation.message ? [validation.message] : ['Validation failed']
          })
        }
      }

      if (hasErrors) {
        const totalErrors = itemErrors.reduce((sum, item) => sum + item.errors.length, 0)
        return {
          success: false,
          message: `Validation failed for ${itemErrors.length} out of ${data.length} items (${totalErrors} total errors)`,
          itemErrors
        }
      }

      return {
        success: true,
        message: `All ${data.length} items validated successfully`
      }
    } else {
      // Single object - validate normally
      const validation = validateDataAgainstSchema(schemaObject, data)

      if (!validation.success) {
        return {
          success: false,
          message: validation.message,
          itemErrors: [
            {
              itemIndex: 0,
              errors: validation.message ? [validation.message] : ['Validation failed']
            }
          ]
        }
      }

      return {
        success: true,
        message: 'Single object validated successfully'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown validation error'
    }
  }
}

/**
 * Run extraction script against cleaned HTML and validate against schema
 *
 * IMPORTANT: extractionResult behavior:
 * - Only stored if sandbox returns valid JSON-parseable result ('result' key exists in executionResult)
 * - Typed as JsonValue to ensure type safety (can be null, but null is a valid JSON value)
 * - If script fails or returns non-JSON, extractionResult key will be missing entirely
 * - This pattern ensures we only store valid results and can detect presence via key existence
 */
async function runExtraction(
  sandbox: SandboxManager,
  cleanedHtml: string,
  url: string,
  script: string,
  schemaObject: JsonObject
): Promise<ExtractionStage> {
  log('Starting extraction script execution for URL:', url)

  try {
    // Execute the extraction script in sandbox
    log('Executing script in sandbox, input size:', cleanedHtml.length, 'chars')
    // const inputJson = JSON.stringify({html: cleanedHtml, url})

    const executionResult = await sandbox.executeFunctionBuffered(script, cleanedHtml, false)
    const {messages} = executionResult

    log(
      'Sandbox execution completed, result present:',
      'result' in executionResult,
      'result type:',
      typeof executionResult.result
    )
    log('Execution messages received:', messages.length)

    // Log all execution messages for debugging
    for (const message of messages) {
      if (message.type === 'log') {
        log(`[${message.kind}] ${message.log}`)
      } else if (message.type === 'exception') {
        log('[exception]', message.exception)
      }
    }

    // Default status values
    let extractionScriptStatus: schema.ProjectCommitCacheData['extractionScriptStatus'] = 'initial'
    const schemaValidationStatus: schema.ProjectCommitCacheData['schemaValidationStatus'] = 'initial'
    let schemaValidationErrors: schema.ProjectCommitCacheData['schemaValidationErrors']

    // Check for exceptions to determine if script failed
    const hasExceptions = messages.some((msg: CodeExecutionMessage) => msg.type === 'exception')

    if (hasExceptions) {
      extractionScriptStatus = 'failed'
    } else {
      extractionScriptStatus = 'completed'
    }

    // Build base result
    const result: ExtractionStage = {
      extractionScriptStatus,
      extractionMessages: messages,
      schemaValidationStatus,
      schemaValidationErrors
    }

    // Only include extractionResult key if we got a valid JSON result and run validation
    if ('result' in executionResult && extractionScriptStatus === 'completed') {
      result.extractionResult = executionResult.result as JsonValue

      // Run schema validation with array/object detection
      const schemaCompilation = compileJsonSchema(schemaObject)
      if (schemaCompilation.success) {
        const validation = validateExtractionResult(schemaObject, result.extractionResult)
        if (validation.success) {
          result.schemaValidationStatus = 'completed'
        } else {
          result.schemaValidationStatus = 'failed'
          result.schemaValidationErrors = validation.message ? [validation.message] : ['Validation failed']
          // Store item-level errors for detailed frontend display
          if (validation.itemErrors) {
            result.schemaValidationItemErrors = validation.itemErrors
          }
        }
      } else {
        result.schemaValidationStatus = 'failed'
        result.schemaValidationErrors = [`Invalid schema: ${schemaCompilation.message}`]
      }
    }

    return result
  } catch (error) {
    log('Extraction error:', error)
    return {
      extractionScriptStatus: 'failed',
      extractionMessages: [],
      schemaValidationStatus: 'initial'
    }
  }
}

/**
 * Helper function to try running extraction if schema and script exist
 */
async function tryExtraction(
  db: typeof database,
  sandbox: SandboxManager,
  projectId: schema.ProjectId,
  projectCommit: typeof schema.projectCommit.$inferSelect,
  cleanedHtml: string | null,
  url: string
): Promise<ExtractionStage | null> {
  log(
    'Checking for extraction prerequisites - schema version:',
    projectCommit.activeSchemaVersion,
    'extractor version:',
    projectCommit.activeExtractorVersion,
    'has HTML:',
    !!cleanedHtml
  )

  // Check if we have both schema and script and cleaned HTML
  if (!projectCommit.activeSchemaVersion || !projectCommit.activeExtractorVersion || !cleanedHtml) {
    log('Extraction prerequisites not met, skipping extraction')
    return null
  }

  try {
    log('Fetching active extractor and schema from database')
    // Get the active script
    const activeExtractor = await db.query.extractor.findFirst({
      where: (table, {and, eq}) =>
        and(eq(table.projectId, projectId), eq(table.version, projectCommit.activeExtractorVersion!))
    })

    // Get the active schema
    const activeSchema = await db.query.projectSchema.findFirst({
      where: (table, {and, eq}) =>
        and(eq(table.projectId, projectId), eq(table.version, projectCommit.activeSchemaVersion!))
    })

    if (!activeExtractor || !activeSchema) {
      log('Failed to find active extractor or schema in database')
      return null
    }

    log('Found active extractor and schema, proceeding with extraction')
    // Run the extraction
    return await runExtraction(sandbox, cleanedHtml, url, activeExtractor.script, activeSchema.schemaJson)
  } catch (error) {
    log('tryExtraction error:', error)
    return {
      extractionScriptStatus: 'failed',
      extractionMessages: [],
      schemaValidationStatus: 'initial'
    }
  }
}

export type ExtractionStage = {
  // STAGE 3: Extraction Script
  extractionScriptStatus: schema.ProjectCommitCacheData['extractionScriptStatus']
  extractionResult?: schema.ProjectCommitCacheData['extractionResult'] // Parsed JSON result from script execution (only populated when script completed successfully and returned valid JSON)
  extractionMessages: CodeExecutionMessage[] // All messages from sandbox (logs, exceptions, etc.)

  // STAGE 4: Schema Validation
  schemaValidationStatus: schema.ProjectCommitCacheData['schemaValidationStatus']
  schemaValidationErrors?: schema.ProjectCommitCacheData['schemaValidationErrors'] // Detailed validation errors (only populated when validation failed)
  schemaValidationItemErrors?: schema.ProjectCommitCacheData['schemaValidationItemErrors'] // Item-level validation errors for arrays
}

export type ScrapeProcessorResult = {
  success: boolean
  cached: boolean
  cachedData?: schema.ProjectCommitCacheData
  timestamp?: SQLUTCTimestamp | null
  extractionStage?: ExtractionStage | null
  error?: string
}

/**
 * Core scraping and processing logic that can be used by both API endpoints and tools
 */
export async function scrapeProcess({
  projectCommitPublicId,
  forceRefresh = false,
  db,
  sandbox
}: {
  projectCommitPublicId: schema.ProjectCommitPublicId
  forceRefresh?: boolean
  db: typeof database
  sandbox: SandboxManager
}): Promise<ScrapeProcessorResult> {
  log('Starting scrape process for commit:', projectCommitPublicId, 'forceRefresh:', forceRefresh)
  try {
    // Find the project commit
    log('Finding project commit in database')
    const projectCommit = await db.query.projectCommit.findFirst({
      where: (table, {eq: tableEq}) => tableEq(table.publicId, projectCommitPublicId)
    })

    if (!projectCommit) {
      log('Project commit not found')
      return {
        success: false,
        cached: false,
        error: 'Project commit not found'
      }
    }
    log('Found project commit:', projectCommit.id)

    // Find the related project
    log('Finding related project in database')
    const project = await db.query.project.findFirst({
      where: (table, {eq}) => eq(table.id, projectCommit.projectId)
    })

    if (!project) {
      log('Project not found')
      return {
        success: false,
        cached: false,
        error: 'Project not found'
      }
    }
    log('Found project:', project.id)

    // Get the current URL from the project commit
    const urlToScrape = projectCommit.currentEditorUrl
    if (!urlToScrape) {
      log('No URL configured for scraping')
      return {
        success: false,
        cached: false,
        error: 'No URL configured for scraping'
      }
    }
    log('URL to scrape:', urlToScrape)

    // Initialize cache data structure that will be built step by step
    const cacheData: schema.ProjectCommitCacheData = {
      url: urlToScrape,
      fetchStatus: 'initial',
      processingStatus: 'initial',
      extractionScriptStatus: 'initial',
      schemaValidationStatus: 'initial'
    }

    // Variables to track the execution state and data
    let html: string | null = null
    let extractionStage: ExtractionStage | null = null
    let httpResponseCreatedAt: SQLUTCTimestamp | null = null
    let shouldUseCachedData = false

    // STAGE 1: DETERMINE FETCH OR CACHE STRATEGY
    log('Determining fetch strategy')

    // Check if we have valid cached data for this exact URL
    if (
      !forceRefresh &&
      projectCommit.cachedData?.url === urlToScrape &&
      typeof projectCommit.cachedData.html === 'string'
    ) {
      log('Using cached data from project commit')
      shouldUseCachedData = true
      html = projectCommit.cachedData.html
      httpResponseCreatedAt = projectCommit.cachedAt

      // Copy existing fetch and processing data from cached data
      cacheData.fetchStatus = projectCommit.cachedData.fetchStatus
      cacheData.fetchError = projectCommit.cachedData.fetchError
      cacheData.statusCode = projectCommit.cachedData.statusCode
      cacheData.contentType = projectCommit.cachedData.contentType
      cacheData.responseTimeMs = projectCommit.cachedData.responseTimeMs
      cacheData.headers = projectCommit.cachedData.headers
      cacheData.processingStatus = projectCommit.cachedData.processingStatus
      cacheData.processingError = projectCommit.cachedData.processingError
      cacheData.html = projectCommit.cachedData.html
      cacheData.formattedHtml = projectCommit.cachedData.formattedHtml
      cacheData.cleanedHtml = projectCommit.cachedData.cleanedHtml
      cacheData.text = projectCommit.cachedData.text
      cacheData.readabilityResult = projectCommit.cachedData.readabilityResult
      cacheData.markdown = projectCommit.cachedData.markdown
    } else {
      // Find or create projectUrl entry for fresh fetch
      log('Finding or creating projectUrl entry')
      let projectUrl = await db.query.projectUrl.findFirst({
        where: (table, {and, eq}) => and(eq(table.projectId, project.id), eq(table.url, urlToScrape))
      })

      if (!projectUrl) {
        log('Creating new projectUrl entry')
        const [newProjectUrl] = await db
          .insert(schema.projectUrl)
          .values({
            projectId: project.id,
            url: urlToScrape
          })
          .returning()
        projectUrl = newProjectUrl
      }
      log('ProjectUrl ID:', projectUrl.id)

      // Check for existing HTTP response if not forcing refresh
      let existingResponse: typeof schema.httpResponse.$inferSelect | undefined
      if (!forceRefresh) {
        log('Checking for existing successful crawl run')
        const recentCrawlRun = await db.query.crawlRun.findFirst({
          where: (table, {and, eq}) => and(eq(table.projectId, project.id), eq(table.status, 'success')),
          orderBy: (table, {desc}) => desc(table.startedAt)
        })

        if (recentCrawlRun) {
          log('Found recent crawl run:', recentCrawlRun.id, '- checking for HTTP response')
          existingResponse = await db.query.httpResponse.findFirst({
            where: (table, {and, eq}) =>
              and(eq(table.crawlRunId, recentCrawlRun.id), eq(table.projectUrlId, projectUrl.id))
          })
          log('Existing response found:', !!existingResponse)
        }
      }

      // STAGE 1: FETCH EXECUTION
      if (existingResponse && !forceRefresh) {
        log('Using existing HTTP response from database')
        cacheData.fetchStatus = 'cached'
        cacheData.statusCode = existingResponse.statusCode
        cacheData.contentType = existingResponse.contentType
        cacheData.responseTimeMs = existingResponse.responseTimeMs
        cacheData.headers = existingResponse.headers as Record<string, string>
        html = existingResponse.body
        httpResponseCreatedAt = existingResponse.createdAt
      } else {
        log('Performing fresh HTTP fetch')
        // Create new crawl run
        const [newCrawlRun] = await db
          .insert(schema.crawlRun)
          .values({
            projectId: project.id,
            status: 'running'
          })
          .returning()
        log('Created crawl run:', newCrawlRun.id)

        const startTime = Date.now()
        log('Starting HTTP fetch for:', urlToScrape)

        try {
          const response = await fetch(urlToScrape, {
            method: 'GET',
            headers: {
              'User-Agent':
                projectCommit.settingsJson.crawler.userAgent ??
                'Mozilla/5.0 (compatible; Vibescraper/1.0; +https://vibescraper.com)'
            },
            signal: AbortSignal.timeout(projectCommit.settingsJson.crawler.requestTimeout || 30000)
          })

          const responseTimeMs = Date.now() - startTime

          // Check if response is OK (status 200-299)
          if (!response.ok) {
            cacheData.fetchStatus = 'failed'
            cacheData.fetchError = `HTTP ${response.status} ${response.statusText}`
            log('Fetch failed with non-OK status:', response.status, response.statusText)

            // Update crawl run and save cache data with fetch error
            await db
              .update(schema.crawlRun)
              .set({
                status: 'error',
                finishedAt: sqlNow()
              })
              .where(sqlEq(schema.crawlRun.id, newCrawlRun.id))

            await db
              .update(schema.projectCommit)
              .set({
                cachedData: cacheData,
                cachedAt: sqlNow()
              })
              .where(sqlEq(schema.projectCommit.id, projectCommit.id))

            return {
              success: false,
              cached: false,
              error: cacheData.fetchError
            }
          }

          // Successful fetch
          cacheData.fetchStatus = 'completed'
          cacheData.statusCode = response.status
          cacheData.contentType = response.headers.get('content-type')
          cacheData.responseTimeMs = responseTimeMs

          // Extract headers
          const headers: Record<string, string> = {}
          response.headers.forEach((value, key) => {
            headers[key] = value
          })
          cacheData.headers = headers

          html = await response.text()
          log('HTML content length:', html.length, 'chars')

          // Store the HTTP response
          log('Storing HTTP response in database')
          const bodyHash = hashString(html)
          const [httpResponse] = await db
            .insert(schema.httpResponse)
            .values({
              crawlRunId: newCrawlRun.id,
              projectUrlId: projectUrl.id,
              statusCode: response.status,
              contentType: response.headers.get('content-type') ?? 'text/html',
              headers: headers,
              bodyHashAlgo: 'sha256' as const,
              bodyHash: bodyHash,
              storageType: 'text' as const,
              body: html,
              responseTimeMs: responseTimeMs
            })
            .returning()
          log('Stored HTTP response:', httpResponse.id)
          httpResponseCreatedAt = httpResponse.createdAt

          // Update crawl run status
          await db
            .update(schema.crawlRun)
            .set({
              status: 'success',
              finishedAt: sqlNow()
            })
            .where(sqlEq(schema.crawlRun.id, newCrawlRun.id))
        } catch (error) {
          const responseTimeMs = Date.now() - startTime
          cacheData.fetchStatus = 'failed'

          if (error instanceof Error) {
            if (error.name === 'TimeoutError') {
              cacheData.fetchError = `Request timeout after ${responseTimeMs}ms`
            } else if (error.name === 'TypeError') {
              cacheData.fetchError = `Network error: ${error.message}`
            } else {
              cacheData.fetchError = `Fetch error: ${error.message}`
            }
          } else {
            cacheData.fetchError = 'Unknown fetch error'
          }

          log('Fetch failed with error:', cacheData.fetchError)

          // Update crawl run status to error and save cache data
          await db
            .update(schema.crawlRun)
            .set({
              status: 'error',
              finishedAt: sqlNow()
            })
            .where(sqlEq(schema.crawlRun.id, newCrawlRun.id))

          await db
            .update(schema.projectCommit)
            .set({
              cachedData: cacheData,
              cachedAt: sqlNow()
            })
            .where(sqlEq(schema.projectCommit.id, projectCommit.id))

          return {
            success: false,
            cached: false,
            error: cacheData.fetchError
          }
        }
      }
    }

    // STAGE 2: PROCESSING EXECUTION
    if (html && (!shouldUseCachedData || !projectCommit.cachedData?.cleanedHtml)) {
      log('Processing HTML content')
      cacheData.html = html

      try {
        // Check if content is actually HTML
        if (!html.trim()) {
          cacheData.processingStatus = 'failed'
          cacheData.processingError = 'Empty HTML content received'
        } else {
          // Basic HTML validation
          if (!html.toLowerCase().includes('<html') && !html.toLowerCase().includes('<!doctype')) {
            log('Warning: Content does not appear to be valid HTML')
          }

          let processingError: string | null = null

          // Format HTML
          try {
            cacheData.formattedHtml = await htmlFormat(html)
          } catch (error) {
            log('Failed to format HTML:', error)
            processingError = `HTML formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }

          // Clean HTML and extract text
          try {
            const cleanerResult = await htmlCleaner(html)
            if (cleanerResult) {
              cacheData.text = cleanerResult.text || null
              if (cleanerResult.html) {
                try {
                  cacheData.cleanedHtml = await htmlFormat(cleanerResult.html)
                } catch (formatError) {
                  log('Failed to format cleaned HTML, using unformatted:', formatError)
                  cacheData.cleanedHtml = cleanerResult.html
                }
              }
            } else {
              processingError = 'HTML cleaner returned no result'
            }
          } catch (error) {
            log('Failed to clean HTML:', error)
            processingError = `HTML cleaning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }

          // Extract readability
          try {
            const result = htmlReadability(html, urlToScrape)
            if (result) {
              let formattedContent = result.content
              if (result.content) {
                try {
                  formattedContent = await htmlFormat(result.content)
                } catch (formatError) {
                  log('Failed to format readability HTML, using unformatted:', formatError)
                  formattedContent = result.content
                }
              }
              cacheData.readabilityResult = {...result, content: formattedContent}
            }
          } catch (error) {
            log('Failed to extract readability:', error)
          }

          // Convert to markdown
          try {
            cacheData.markdown = htmlMarkdown(html)
          } catch (error) {
            log('Failed to convert to markdown:', error)
            processingError ??= `Markdown conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }

          // Determine final processing status
          if (cacheData.cleanedHtml && !processingError) {
            cacheData.processingStatus = 'completed'
          } else {
            cacheData.processingStatus = 'failed'
            cacheData.processingError = processingError ?? 'Failed to produce cleaned HTML output'
          }
        }
      } catch (error) {
        log('Processing stage error:', error)
        cacheData.processingStatus = 'failed'
        cacheData.processingError = error instanceof Error ? error.message : 'Unknown processing error'
      }

      // If processing failed, save cache data and return
      if (cacheData.processingStatus === 'failed') {
        await db
          .update(schema.projectCommit)
          .set({
            cachedData: cacheData,
            cachedAt: sqlNow()
          })
          .where(sqlEq(schema.projectCommit.id, projectCommit.id))

        return {
          success: false,
          cached: shouldUseCachedData,
          error: cacheData.processingError ?? 'Processing failed'
        }
      }
    }

    // STAGE 3: EXTRACTION EXECUTION
    log('Running extraction if schema and script exist')
    const cleanedHtmlForExtraction = cacheData.cleanedHtml ?? html
    if (cleanedHtmlForExtraction) {
      extractionStage = await tryExtraction(
        db,
        sandbox,
        project.id,
        projectCommit,
        cleanedHtmlForExtraction,
        urlToScrape
      )

      if (extractionStage) {
        cacheData.extractionScriptStatus = extractionStage.extractionScriptStatus
        if ('extractionResult' in extractionStage) {
          cacheData.extractionResult = extractionStage.extractionResult
        }
        cacheData.extractionMessages = extractionStage.extractionMessages
        cacheData.schemaValidationStatus = extractionStage.schemaValidationStatus
        if (extractionStage.schemaValidationErrors) {
          cacheData.schemaValidationErrors = extractionStage.schemaValidationErrors
        }
        if (extractionStage.schemaValidationItemErrors) {
          cacheData.schemaValidationItemErrors = extractionStage.schemaValidationItemErrors
        }
      }
    }

    // FINAL STAGE: SAVE CACHE DATA AND RETURN
    log('Saving final cache data to database')
    await db
      .update(schema.projectCommit)
      .set({
        cachedData: cacheData,
        cachedAt: sqlNow()
      })
      .where(sqlEq(schema.projectCommit.id, projectCommit.id))

    log(
      'Scrape process completed successfully - cached:',
      shouldUseCachedData,
      'extraction result:',
      !!extractionStage
    )
    return {
      success: true,
      cached: shouldUseCachedData,
      cachedData: cacheData,
      timestamp: httpResponseCreatedAt,
      extractionStage
    }
  } catch (error) {
    log('Scrape process error:', error)
    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
