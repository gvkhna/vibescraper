import {
  compileJsonSchema,
  objectRootMetaSchema,
  primaryKeyInRequiredMetaSchema,
  rootPrimaryKeyMetaSchema,
  validateDataAgainstSchema
} from '@vibescraper/json-schemas'
import { SandboxManager } from '@vibescraper/sandbox'
import { tool } from 'ai'
import debug from 'debug'
import { eq as sqlEq } from 'drizzle-orm'
import type { JsonObject } from 'type-fest'

import { db as database } from '@/db/db'
import * as dbSchema from '@/db/schema'
import { sqlFormatTimestampUTC, sqlTimestampToDate } from '@/lib/format-dates'
import { scrapeProcess } from '@/server/project/scrape-process'
import tools from '.'

const log = debug('app:assistant-extraction-tools')

/**
 * The full set of tools your assistant can call.
 * Each tool has a JSON schema (via Zod) and an async execute function.
 */
export function makeExtractionTools(
  db: typeof database,
  project: typeof dbSchema.project.$inferSelect,
  projectCommitPublicId: dbSchema.ProjectCommitPublicId,
  sandbox: SandboxManager
) {
  return {
    // setUrl: tool({
    //   description: 'Set the page URL in the UI',
    //   inputSchema: z.object({
    //     url: z.url()
    //     // replaceHistory: z.boolean().optional().describe('Whether to replace browser history')
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean()
    //     // url: z.url(),
    //     // message: z.string().optional()
    //   }),
    //   execute: async (input) => {
    //     // TODO: Update the UI to display the new URL
    //     // This should interact with the frontend state management
    //     // May need to emit an event or update a shared state
    //     return {
    //       success: true
    //       // url: input.url,
    //       // message: 'URL updated in UI'
    //     }
    //   }
    // }),
    // triggerScrape: tool({
    //   description: 'Fetch and process the URL; server may use cache',
    //   inputSchema: z.object({
    //     url: z.url().describe('The URL to scrape'),
    //     force: z.boolean().optional().describe('Force fresh scrape, bypassing cache')
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     httpResponseId: z.string().optional(),
    //     statusCode: z.number().optional(),
    //     contentType: z.string().optional(),
    //     cached: z.boolean(),
    //     error: z.string().optional()
    //   }),
    //   execute: async (input) => {
    //     try {
    //       // 1. Get the project commit to access settings
    //       const projectCommit = await db.query.projectCommit.findFirst({
    //         where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
    //       })
    //       if (!projectCommit) {
    //         return {
    //           success: false,
    //           cached: false,
    //           error: 'Project commit not found'
    //         }
    //       }
    //       // 2. Check if URL exists in projectUrl table, create if not
    //       let projectUrl = await db.query.projectUrl.findFirst({
    //         where: (table, {and, eq}) => and(eq(table.projectId, project.id), eq(table.url, input.url))
    //       })
    //       if (!projectUrl) {
    //         const [newUrl] = await db
    //           .insert(dbSchema.projectUrl)
    //           .values({
    //             projectId: project.id,
    //             url: input.url
    //           })
    //           .returning()
    //         projectUrl = newUrl
    //       }
    //       // 3. Check for cached httpResponse if !force
    //       if (!input.force) {
    //         const existingResponse = await db.query.httpResponse.findFirst({
    //           where: (table, {eq}) => eq(table.projectUrlId, projectUrl.id),
    //           orderBy: (table, {desc}) => [desc(table.createdAt)]
    //         })
    //         if (existingResponse) {
    //           return {
    //             success: true,
    //             httpResponseId: existingResponse.id,
    //             statusCode: existingResponse.statusCode ?? undefined,
    //             contentType: existingResponse.contentType,
    //             cached: true
    //           }
    //         }
    //       }
    //       // 4. Create new crawl run
    //       await db.insert(dbSchema.crawlRun).values({
    //         projectId: project.id,
    //         status: 'pending'
    //       })
    //       // 5. TODO: Actually fetch the URL using the configured fetchType
    //       // This would typically be done in a background job
    //       // For now, return pending status
    //       return {
    //         success: true,
    //         httpResponseId: undefined,
    //         statusCode: undefined,
    //         contentType: undefined,
    //         cached: false
    //       }
    //     } catch (error) {
    //       log('triggerScrape error:', error)
    //       return {
    //         success: false,
    //         cached: false,
    //         error: error instanceof Error ? error.message : 'Unknown error'
    //       }
    //     }
    //   }
    // }),

    currentState: tool({
      ...tools.currentState,
      execute: async (_input, _opts) => {
        try {
          const projectCommit = await db.query.projectCommit.findFirst({
            where: (table, { eq }) => eq(table.publicId, projectCommitPublicId)
          })

          if (!projectCommit) {
            return { overview: 'No project commit found for this session.' }
          }

          // Load artifacts for counts and active versions
          const [schemas, extractors, crawlers] = await Promise.all([
            db.query.projectSchema.findMany({
              where: (table, { eq }) => eq(table.projectId, project.id),
              orderBy: (table, { desc }) => [desc(table.version)]
            }),
            db.query.extractor.findMany({
              where: (table, { eq }) => eq(table.projectId, project.id),
              orderBy: (table, { desc }) => [desc(table.version)]
            }),
            db.query.crawler.findMany({
              where: (table, { eq }) => eq(table.projectId, project.id),
              orderBy: (table, { desc }) => [desc(table.version)]
            })
          ])

          const activeSchemaVersion = projectCommit.activeSchemaVersion
          const activeExtractorVersion = projectCommit.activeExtractorVersion
          const activeCrawlerVersion = projectCommit.activeCrawlerVersion

          const activeSchema =
            typeof activeSchemaVersion === 'number'
              ? (schemas.find((s) => s.version === activeSchemaVersion) ?? null)
              : null
          const activeExtractor =
            typeof activeExtractorVersion === 'number'
              ? (extractors.find((e) => e.version === activeExtractorVersion) ?? null)
              : null
          const activeCrawler =
            typeof activeCrawlerVersion === 'number'
              ? (crawlers.find((c) => c.version === activeCrawlerVersion) ?? null)
              : null

          // Derive schema summary
          let schemaSummary = 'none'
          if (activeSchema) {
            // Try compiling to confirm basic validity
            const compiled = compileJsonSchema(activeSchema.schemaJson)
            const schemaObj = activeSchema.schemaJson as Record<string, unknown>
            const declaredType = (schemaObj.type as string | undefined) ?? 'unknown'
            let keyCount = 0
            if (declaredType === 'object') {
              const props = schemaObj.properties as Record<string, unknown> | undefined
              keyCount = props ? Object.keys(props).length : 0
            } else if (declaredType === 'array') {
              const items = schemaObj.items as Record<string, unknown> | undefined
              const itemsProps = (items?.properties as Record<string, unknown> | undefined) ?? null
              keyCount = itemsProps ? Object.keys(itemsProps).length : 0
            }
            schemaSummary = `v${activeSchema.version} (type:${declaredType}, keys:${keyCount}, valid:${compiled.success ? 'yes' : 'no'})`
          }

          // Derive script summaries
          const extractorSummary = activeExtractor ? `v${activeExtractor.version}` : 'none'
          const crawlerSummary = activeCrawler ? `v${activeCrawler.version}` : 'none'

          // Cached data overview
          const cd = projectCommit.cachedData
          const cachedAtIso = projectCommit.cachedAt
            ? sqlTimestampToDate(projectCommit.cachedAt).toISOString()
            : null
          const url = cd?.url ?? projectCommit.currentEditorUrl ?? null
          const fetchStatus = cd?.fetchStatus ?? 'initial'
          const processingStatus = cd?.processingStatus ?? 'initial'
          const extractStatus = cd?.extractionScriptStatus ?? 'initial'
          const validationStatus = cd?.schemaValidationStatus ?? 'initial'

          // Sizes (no content)
          const htmlLen = cd?.html ? cd.html.length : 0
          const cleanedLen = cd?.cleanedHtml ? cd.cleanedHtml.length : 0
          const textLen = cd?.text ? cd.text.length : 0
          const mdLen = cd?.markdown ? cd.markdown.length : 0

          // Results and logs
          const extractionResult = cd?.extractionResult
          const isArray = Array.isArray(extractionResult)
          const itemCount = isArray ? extractionResult.length : extractionResult ? 1 : 0
          const validationErrorsCount = cd?.schemaValidationErrors?.length ?? 0
          const itemErrorsCount = cd?.schemaValidationItemErrors?.length ?? 0

          const logs = cd?.extractionMessages ?? []
          const exceptionCount = logs.filter((l) => l.type === 'exception').length
          const logCount = logs.length

          // Recent URLs (show up to 3)
          const recent = projectCommit.recentUrls.urls
          const recentPreview = recent.slice(0, 3)

          // Settings snapshot (concise)
          const settings = projectCommit.settingsJson
          const settingsSummary = `fetch:${settings.fetchType}, schedule:${settings.schedule}, retries:${settings.maxRetries}, retryDelayMs:${settings.retryDelayMs}, crawler: followLinks:${settings.crawler.followLinks}, depth:${settings.crawler.maxDepth}, conc:${settings.crawler.maxConcurrency}, timeoutMs:${settings.crawler.requestTimeout}, waitMs:${settings.crawler.waitBetweenRequests}, robots:${settings.crawler.respectRobotsTxt}`

          const lines: string[] = []
          lines.push(`Project: ${project.name}`)
          lines.push(
            `Commit: ${projectCommit.type}, active versions - schema:${activeSchemaVersion ?? 'none'}, extractor:${activeExtractorVersion ?? 'none'}, crawler:${activeCrawlerVersion ?? 'none'}`
          )
          lines.push(
            `Artifacts: schemas:${schemas.length}, extractors:${extractors.length}, crawlers:${crawlers.length}`
          )
          lines.push(`Active Schema: ${schemaSummary}`)
          lines.push(`Active Extractor: ${extractorSummary}`)
          lines.push(`Active Crawler: ${crawlerSummary}`)
          lines.push(`URL: ${url ?? 'none'}`)
          lines.push(`Recent URLs (${recent.length}): ${recentPreview.join(', ') || 'none'}`)
          lines.push(`Settings: ${settingsSummary}`)
          if (!cd) {
            lines.push('Cache: none (no scrape run yet)')
          } else {
            lines.push(
              `Cache: cachedAt:${cachedAtIso ?? 'unknown'}, fetch:${fetchStatus}${cd.statusCode ? `(${cd.statusCode})` : ''}${cd.contentType ? ` ${cd.contentType}` : ''}, processing:${processingStatus}`
            )
            lines.push(
              `Content sizes: html:${htmlLen}, cleaned:${cleanedLen}, text:${textLen}, markdown:${mdLen}`
            )
            lines.push(
              `Extraction: status:${extractStatus}, result:${isArray ? `array(${itemCount})` : itemCount === 1 ? 'object(1)' : 'none'}`
            )
            lines.push(
              `Validation: status:${validationStatus}, errors:${validationErrorsCount}, itemErrors:${itemErrorsCount}`
            )
            lines.push(`Logs: total:${logCount}, exceptions:${exceptionCount}`)
          }

          return { overview: lines.join('\n') }
        } catch (error) {
          log('currentState error:', error)
          return { overview: 'Unable to compute current state.' }
        }
      }
    }),
    fileGet: tool({
      ...tools.fileGet,
      execute: async (input, _opts) => {
        try {
          switch (input.file) {
            case 'schema.json': {
              // Get the activeSchemaVersion from projectCommit
              const projectCommit = await db.query.projectCommit.findFirst({
                where: (table, { eq }) => eq(table.publicId, projectCommitPublicId)
              })

              const schemaVersion = projectCommit?.activeSchemaVersion
              if (typeof schemaVersion !== 'number') {
                return {
                  success: true,
                  file: null,
                  version: null,
                  message: null,
                  error: null
                }
              }

              // Get the specific schema version
              const activeSchema = await db.query.projectSchema.findFirst({
                where: (table, { and, eq }) =>
                  and(eq(table.projectId, project.id), eq(table.version, schemaVersion))
              })

              // If no schema exists at that version, return nulls
              if (!activeSchema) {
                return {
                  success: true,
                  content: null,
                  version: null,
                  message: null
                }
              }

              // Return the active schema with all relevant info
              return {
                success: true,
                content: activeSchema.schemaJson,
                version: activeSchema.version,
                message: activeSchema.message
              }
            }

            case 'extractor.js': {
              // Get the activeExtractorVersion from projectCommit
              const projectCommit = await db.query.projectCommit.findFirst({
                where: (table, { eq }) => eq(table.publicId, projectCommitPublicId)
              })
              const extractorVersion = projectCommit?.activeExtractorVersion
              if (typeof extractorVersion !== 'number') {
                return {
                  success: true,
                  file: null,
                  version: null,
                  message: null
                }
              }
              // Get the specific extractor version
              const activeExtractor = await db.query.extractor.findFirst({
                where: (table, { and, eq }) =>
                  and(eq(table.projectId, project.id), eq(table.version, extractorVersion))
              })
              // If no extractor exists at that version, return nulls
              if (!activeExtractor) {
                return {
                  success: true,
                  content: null,
                  version: null,
                  message: null
                }
              }
              // Return the active extractor with all relevant info
              return {
                success: true,
                content: activeExtractor.script,
                version: activeExtractor.version,
                message: activeExtractor.message
                // updatedAt: sqlTimestampToDate(activeExtractor.createdAt).toISOString()
              }
            }
            case 'crawler.js': {
              // Get the activeCrawlerVersion from projectCommit
              const projectCommit = await db.query.projectCommit.findFirst({
                where: (table, { eq }) => eq(table.publicId, projectCommitPublicId)
              })
              const crawlerVersion = projectCommit?.activeCrawlerVersion
              if (typeof crawlerVersion !== 'number') {
                return {
                  success: true,
                  file: null,
                  version: null,
                  message: null
                }
              }
              // Get the specific extractor version
              const activeCrawler = await db.query.extractor.findFirst({
                where: (table, { and, eq }) =>
                  and(eq(table.projectId, project.id), eq(table.version, crawlerVersion))
              })
              // If no crawler exists at that version, return nulls
              if (!activeCrawler) {
                return {
                  success: true,
                  content: null,
                  version: null,
                  message: null
                }
              }
              // Return the active extractor with all relevant info
              return {
                success: true,
                content: activeCrawler.script,
                version: activeCrawler.version,
                message: activeCrawler.message
                // updatedAt: sqlTimestampToDate(activeExtractor.createdAt).toISOString()
              }
            }
            default: {
              log('incorrect file type given: ', input.file)
              return {
                success: false,
                error: 'Unknown error'
              }
            }
          }
        } catch (error) {
          log('writeScript error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }),
    fileSet: tool({
      ...tools.fileSet,
      execute: async (input, _opts) => {
        try {
          switch (input.file) {
            case 'schema.json': {
              let schema: JsonObject | null = null

              if (typeof input.content === 'string') {
                try {
                  schema = JSON.parse(input.content)
                } catch (e) {
                  if (e instanceof Error) {
                    return {
                      success: false,
                      problems: `JSON Parsing Error: ${e.message}`
                    }
                  } else {
                    return {
                      success: false,
                      problems: `Unknown Error: ${e}`
                    }
                  }
                }
              } else if (typeof input.content === 'object') {
                schema = input.content
              } else {
                return {
                  success: false,
                  problems: "Incorrect 'content' key type, expected typeof object"
                }
              }
              if (!schema) {
                return {
                  success: false,
                  problems: 'Malformed schema given as input'
                }
              }
              const schemaValidation = compileJsonSchema(schema)
              if (!schemaValidation.success) {
                return {
                  success: false,
                  problems: `Error: Invalid JSON Schema - ${schemaValidation.message}`
                }
              }

              const objectRootValidation = validateDataAgainstSchema(objectRootMetaSchema, input.content)
              if (!objectRootValidation.success) {
                return {
                  success: false,
                  problems: `Error: Invalid JSON Schema - ${objectRootValidation.message}`
                }
              }

              // 2. Get current version number
              const latestSchema = await db.query.projectSchema.findFirst({
                where: (table, { eq }) => eq(table.projectId, project.id),
                orderBy: (table, { desc }) => [desc(table.version)]
              })
              const newVersion = (latestSchema?.version ?? 0) + 1

              // 3. Create new projectSchema version in database
              await db.insert(dbSchema.projectSchema).values({
                projectId: project.id,
                version: newVersion,
                schemaJson: schema,
                message: input.message
              })

              // 4. Update projectCommit.activeSchemaVersion
              await db
                .update(dbSchema.projectCommit)
                .set({ activeSchemaVersion: newVersion })
                .where(sqlEq(dbSchema.projectCommit.publicId, projectCommitPublicId))

              let warnings = ''

              const primaryKeyRequiredValidation = validateDataAgainstSchema(
                primaryKeyInRequiredMetaSchema,
                input.content
              )
              if (!primaryKeyRequiredValidation.success) {
                warnings += `Warning: ${primaryKeyRequiredValidation.message}\n`
              }
              const rootPrimaryKeyValidation = validateDataAgainstSchema(
                rootPrimaryKeyMetaSchema,
                input.content
              )
              if (!rootPrimaryKeyValidation.success) {
                warnings += `Warning: ${rootPrimaryKeyValidation.message}\n`
              }

              return {
                problems: warnings,
                success: true,
                version: newVersion
              }
            }

            case 'extractor.js': {
              if (typeof input.content !== 'string') {
                return {
                  success: false,
                  problems: "Error: Incorrect 'content' key type, expected typeof string"
                }
              }

              // Get the latest extractor version
              const latestExtractor = await db.query.extractor.findFirst({
                where: (table, { eq }) => eq(table.projectId, project.id),
                orderBy: (table, { desc }) => desc(table.version)
              })

              const newVersion = (latestExtractor?.version ?? 0) + 1

              // Create new extractor version
              await db.insert(dbSchema.extractor).values({
                projectId: project.id,
                version: newVersion,
                // name: input.name ?? 'Main Extractor',
                message: input.message,
                script: input.content
                // scriptLanguage: 'javascript' as const
              })

              log('Created new extractor version:', newVersion)

              // Update the project commit to use the new version
              await db
                .update(dbSchema.projectCommit)
                .set({ activeExtractorVersion: newVersion })
                .where(sqlEq(dbSchema.projectCommit.publicId, projectCommitPublicId))

              return {
                success: true,
                version: newVersion
              }
            }
            case 'crawler.js': {
              if (typeof input.content !== 'string') {
                return {
                  success: false,
                  problems: "Error: Incorrect 'content' key type, expected typeof string"
                }
              }
              // Get the latest crawler version
              const latestCrawler = await db.query.crawler.findFirst({
                where: (table, { eq }) => eq(table.projectId, project.id),
                orderBy: (table, { desc }) => desc(table.version)
              })

              const newVersion = (latestCrawler?.version ?? 0) + 1

              // Create new crawler version
              await db.insert(dbSchema.crawler).values({
                projectId: project.id,
                version: newVersion,
                message: input.message,
                script: input.content
              })

              log('Created new crawler version:', newVersion)

              // Update the project commit to use the new version
              await db
                .update(dbSchema.projectCommit)
                .set({ activeCrawlerVersion: newVersion })
                .where(sqlEq(dbSchema.projectCommit.publicId, projectCommitPublicId))

              return {
                success: true,
                version: newVersion
              }
            }
            default: {
              return {
                success: false,
                problems: 'Error: Unknown file selected'
              }
            }
          }
        } catch (error) {
          log('writeScript error:', error)
          return {
            success: false,
            problems: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
        return {
          success: false,
          problems: `Error: 'Unknown error'`
        }
      }
    }),
    htmlGet: tool({
      ...tools.htmlGet,
      execute: async (input) => {
        try {
          // Get the project commit and its cached data
          const projectCommit = await db.query.projectCommit.findFirst({
            where: (table, { eq }) => eq(table.publicId, projectCommitPublicId)
          })

          if (!projectCommit?.cachedData) {
            return {
              success: false,
              error: 'No cached HTML data available. Please trigger a scrape first.'
            }
          }

          const cachedData = projectCommit.cachedData
          let html: string | null = null

          // Return the requested format
          switch (input.format) {
            case 'raw':
              html = cachedData.html ?? null
              break
            case 'cleaned':
              html = cachedData.cleanedHtml ?? cachedData.html ?? null
              break
            case 'readability':
              html =
                cachedData.readabilityResult?.content ?? cachedData.cleanedHtml ?? cachedData.html ?? null
              break
            case 'markdown':
              html = cachedData.markdown ?? cachedData.html ?? null
              break
            case 'text':
              html = cachedData.text ?? cachedData.html ?? null
              break
            default:
              html = cachedData.cleanedHtml ?? cachedData.html ?? null
          }

          return {
            success: true,
            format: input.format,
            content: html,
            url: cachedData.url,
            statusCode: cachedData.statusCode,
            cached: true,
            fetchedAt: projectCommit.cachedAt ? new Date(projectCommit.cachedAt).toISOString() : null
          }
        } catch (error) {
          log('readHtml error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }),
    scraperRun: tool({
      ...tools.scraperRun,
      execute: async (input) => {
        try {
          // Use the extracted scraping processor directly
          const result = await scrapeProcess({
            projectCommitPublicId,
            forceRefresh: false,
            db,
            sandbox
          })

          if (!result.success) {
            return {
              success: false,
              error: result.error ?? 'Scrape failed'
            }
          }

          // Extraction is now handled directly in the scrapeProcess function

          return {
            success: true,
            url: result.cachedData?.url ?? '',
            fetchStatus: result.cachedData?.fetchStatus ?? 'initial',
            processingStatus: result.cachedData?.processingStatus ?? 'initial',
            extractStatus: result.cachedData?.extractionScriptStatus ?? 'initial',
            validationStatus: result.cachedData?.schemaValidationStatus ?? 'initial'
          }
        } catch (error) {
          log('triggerScrape error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }),
    resultsGet: tool({
      ...tools.resultsGet,
      execute: async (_input) => {
        try {
          // Get the project commit and its cached data
          const projectCommit = await db.query.projectCommit.findFirst({
            where: (table, { eq }) => eq(table.publicId, projectCommitPublicId)
          })

          if (!projectCommit?.cachedData) {
            return {
              success: false,
              error: 'No extraction data available. Please trigger a scrape first.'
            }
          }

          const cachedData = projectCommit.cachedData
          const extractionResult = cachedData.extractionResult
          const isArray = Array.isArray(extractionResult)

          return {
            success: true,
            extractionStatus: cachedData.extractionScriptStatus,
            result: extractionResult,
            itemCount: isArray ? extractionResult.length : extractionResult ? 1 : 0,
            validationStatus: cachedData.schemaValidationStatus,
            validationErrors:
              cachedData.schemaValidationErrors?.map((err) => ({
                code: 'validation_failed',
                path: [],
                message: err
              })) ?? null,
            itemErrors:
              cachedData.schemaValidationItemErrors?.map((item) => ({
                itemIndex: item.itemIndex,
                errors: item.errors.map((err) => ({
                  code: 'validation_failed',
                  path: [],
                  message: err
                }))
              })) ?? null,
            ranAt: projectCommit.cachedAt ? new Date(projectCommit.cachedAt).toISOString() : null
          }
        } catch (error) {
          log('readExtractionResults error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }),
    logsGet: tool({
      ...tools.logsGet,
      execute: async (_input) => {
        try {
          // Get the project commit and its cached data
          const projectCommit = await db.query.projectCommit.findFirst({
            where: (table, { eq }) => eq(table.publicId, projectCommitPublicId)
          })

          if (!projectCommit?.cachedData?.extractionMessages) {
            return {
              success: false,
              error: 'No execution logs available. Please trigger a scrape first.'
            }
          }

          const messages = projectCommit.cachedData.extractionMessages
          const logs = messages.map((msg) => ({
            type: msg.type as 'log' | 'exception' | 'status',
            message: JSON.stringify(msg, null, 2),
            timestamp: 'startedAt' in msg ? msg.startedAt : null
          }))

          return {
            success: true,
            logs
          }
        } catch (error) {
          log('readExecutionLogs error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    })
    //  meta-tools
    // listTools: tool({
    //   description: 'List all available tools with their short descriptions and version hashes',
    //   parameters: z.object({}),
    //   execute: async (_params, _options) => {
    //     // return e.g. [{ name, shortDescription, versionHash }, …]
    //     return await backend.listTools()
    //   }
    // }),
    // getToolSchema: tool({
    //   description: 'Fetch the full JSON schema and examples for a given tool',
    //   parameters: z.object({
    //     name: z.string(),
    //     versionHash: z.string().optional()
    //   }),
    //   execute: async ({name, versionHash}, _options) => {
    //     return await backend.getToolSchema(name, versionHash)
    //   }
    // }),
  }
}
