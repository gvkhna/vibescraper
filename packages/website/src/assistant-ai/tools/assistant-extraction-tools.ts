import {tool} from 'ai'
import {db as database} from '@/db/db'
import * as dbSchema from '@/db/schema'
import debug from 'debug'
import {eq as sqlEq} from 'drizzle-orm'
import {compileJsonSchema} from '@vibescraper/shared-types'
import {scrapeProcess} from '@/server/project/scrape-process'
import {SandboxManager} from '@vibescraper/sandbox'
import tools from '.'
import {sqlFormatTimestampUTC, sqlTimestampToDate} from '@/lib/format-dates'

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
    // getContent: tool({
    //   description: 'Return page content in a chosen view',
    //   inputSchema: z.object({
    //     url: z.url().describe('The URL to get content for'),
    //     view: z.enum(['raw', 'clean', 'filtered', 'readability', 'md']).describe('Content view format'),
    //     filter: z
    //       .object({
    //         mode: z.enum(['css', 'xpath']).default('css').describe('Selector mode'),
    //         query: z.string().min(1).describe('CSS selector or XPath query'),
    //         ret: z.enum(['outer', 'inner']).default('outer').describe('Return outer or inner HTML'),
    //         limit: z.number().int().min(1).max(50).default(20).describe('Max elements to return')
    //       })
    //       .optional()
    //       .describe('Optional filtering configuration')
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     content: z.string().optional(),
    //     elements: z.array(z.string()).optional(),
    //     error: z.string().optional()
    //   }),
    //   execute: async (input) => {
    //     try {
    //       // 1. Find the project URL
    //       const projectUrl = await db.query.projectUrl.findFirst({
    //         where: (table, {and, eq}) => and(eq(table.projectId, project.id), eq(table.url, input.url))
    //       })
    //       if (!projectUrl) {
    //         return {
    //           success: false,
    //           error: 'URL not found in project'
    //         }
    //       }
    //       // 2. Find the latest httpResponse
    //       const httpResponse = await db.query.httpResponse.findFirst({
    //         where: (table, {eq}) => eq(table.projectUrlId, projectUrl.id),
    //         orderBy: (table) => [sqlDesc(table.createdAt)]
    //       })
    //       if (!httpResponse) {
    //         return {
    //           success: false,
    //           error: 'No content found for URL. Please trigger a scrape first.'
    //         }
    //       }
    //       // 3. Get the content based on storage type
    //       let content = ''
    //       const storageId = httpResponse.storageId
    //       if (httpResponse.storageType === 'text') {
    //         content = httpResponse.body
    //       } else if (storageId) {
    //         // TODO: Fetch from storage service
    //         const storageItem = await db.query.storage.findFirst({
    //           where: (table, {eq}) => eq(table.id, storageId as dbSchema.StorageId)
    //         })
    //         if (storageItem) {
    //           // TODO: Actually fetch from S3/storage
    //           content = httpResponse.body // Fallback for now
    //         }
    //       }
    //       // 4. Apply view transformation
    //       // TODO: Implement actual transformations
    //       // For now, just return the raw content
    //       const processedContent = content
    //       // 5. Apply filter if provided
    //       if (input.filter) {
    //         // TODO: Implement CSS/XPath filtering
    //         // Would use libraries like cheerio for CSS or xpath for XPath
    //         return {
    //           success: true,
    //           elements: [processedContent] // Placeholder
    //         }
    //       }
    //       return {
    //         success: true,
    //         content: processedContent
    //       }
    //     } catch (error) {
    //       log('getContent error:', error)
    //       return {
    //         success: false,
    //         error: error instanceof Error ? error.message : 'Unknown error'
    //       }
    //     }
    //   }
    // }),
    // readScript: tool({
    //   description: 'Read current script and diagnostics',
    //   // inputSchema: z.object({}),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     script: z.string().optional(),
    //     language: z.enum(['ts', 'js', 'python']).optional(),
    //     version: z.number().optional(),
    //     diagnostics: z
    //       .array(
    //         z.object({
    //           type: z.enum(['error', 'warning', 'info']),
    //           message: z.string(),
    //           line: z.number().optional(),
    //           column: z.number().optional()
    //         })
    //       )
    //       .optional(),
    //     error: z.string().optional()
    //   }),
    //   execute: async (inputs, opts) => {
    //     try {
    //       // 1. Get the active extractor version from projectCommit
    //       const projectCommit = await db.query.projectCommit.findFirst({
    //         where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
    //       })
    //       if (!projectCommit?.activeExtractorVersion) {
    //         return {
    //           success: true,
    //           script: '',
    //           language: 'js',
    //           version: 0
    //         }
    //       }
    //       // 2. Fetch the extractor script from database
    //       const extractor = await db.query.extractor.findFirst({
    //         where: (table, {and, eq}) =>
    //           and(
    //             eq(table.projectId, project.id),
    //             eq(table.version, projectCommit.activeExtractorVersion ?? 0)
    //           )
    //       })
    //       if (!extractor) {
    //         return {
    //           success: false,
    //           error: 'Active extractor not found'
    //         }
    //       }
    //       // 3. TODO: Run validation/linting to generate diagnostics
    //       const diagnostics: Array<{
    //         type: 'error' | 'warning' | 'info'
    //         message: string
    //         line?: number
    //         column?: number
    //       }> = []
    //       return {
    //         success: true,
    //         script: extractor.script,
    //         language: 'js' as const,
    //         version: extractor.version,
    //         diagnostics: diagnostics.length > 0 ? diagnostics : undefined
    //       }
    //     } catch (error) {
    //       log('readScript error:', error)
    //       return {
    //         success: false,
    //         error: error instanceof Error ? error.message : 'Unknown error'
    //       }
    //     }
    //   }
    // }),
    // writeScript: tool({
    //   description: 'Replace entire script; server validates',
    //   inputSchema: z.object({
    //     language: z.enum(['ts', 'js', 'python']).describe('Script language'),
    //     code: z.string().min(1).describe('The complete script code'),
    //     message: z.string().optional().describe('Commit message for this version')
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     version: z.number().optional(),
    //     diagnostics: z
    //       .array(
    //         z.object({
    //           type: z.enum(['error', 'warning', 'info']),
    //           message: z.string(),
    //           line: z.number().optional(),
    //           column: z.number().optional()
    //         })
    //       )
    //       .optional(),
    //     error: z.string().optional()
    //   }),
    //   execute: async (input) => {
    //     try {
    //       // 1. Get current version number
    //       const latestExtractor = await db.query.extractor.findFirst({
    //         where: (table, {eq}) => eq(table.projectId, project.id),
    //         orderBy: (table, {desc}) => [desc(table.version)]
    //       })
    //       const newVersion = (latestExtractor?.version ?? 0) + 1
    //       // 2. TODO: Validate the script syntax
    //       const diagnostics: Array<{
    //         type: 'error' | 'warning' | 'info'
    //         message: string
    //         line?: number
    //         column?: number
    //       }> = []
    //       // 3. Create new extractor version in database
    //       await db.insert(dbSchema.extractor).values({
    //         projectId: project.id,
    //         version: newVersion,
    //         name: input.message ?? `Version ${newVersion}`,
    //         description: input.message,
    //         script: input.code,
    //         scriptLanguage: 'javascript', // TODO: Support other languages based on input.language
    //         isActive: true
    //       })
    //       // 4. Update projectCommit.activeExtractorVersion
    //       await db
    //         .update(dbSchema.projectCommit)
    //         .set({activeExtractorVersion: newVersion})
    //         .where(sqlEq(dbSchema.projectCommit.publicId, projectCommitPublicId))
    //       // 5. TODO: Optionally trigger re-extraction if httpResponse exists
    //       return {
    //         success: true,
    //         version: newVersion,
    //         diagnostics: diagnostics.length > 0 ? diagnostics : undefined
    //       }
    //     } catch (error) {
    //       log('writeScript error:', error)
    //       return {
    //         success: false,
    //         error: error instanceof Error ? error.message : 'Unknown error'
    //       }
    //     }
    //   }
    // }),
    schemaGet: tool({
      ...tools.schemaGet,
      execute: async (_input, _opts) => {
        try {
          // Get the activeSchemaVersion from projectCommit
          const projectCommit = await db.query.projectCommit.findFirst({
            where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
          })

          const schemaVersion = projectCommit?.activeSchemaVersion
          if (typeof schemaVersion !== 'number') {
            return {
              success: true,
              schema: null,
              version: null,
              message: null
            }
          }

          // Get the specific schema version
          const activeSchema = await db.query.projectSchema.findFirst({
            where: (table, {and, eq}) =>
              and(eq(table.projectId, project.id), eq(table.version, schemaVersion))
          })

          // If no schema exists at that version, return nulls
          if (!activeSchema) {
            return {
              success: true,
              schema: null,
              version: null,
              message: null
            }
          }

          // Return the active schema with all relevant info
          return {
            success: true,
            schema: activeSchema.schemaJson,
            version: activeSchema.version,
            message: activeSchema.message
          }
        } catch (error) {
          log('readSchema error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }),
    schemaSet: tool({
      ...tools.schemaSet,
      execute: async (input) => {
        try {
          // 1. Validate the JSON Schema format
          const schemaValidation = compileJsonSchema(input.schema)
          if (!schemaValidation.success) {
            return {
              success: false,
              error: `Invalid JSON Schema: ${schemaValidation.message}`
            }
          }

          // 2. Get current version number
          const latestSchema = await db.query.projectSchema.findFirst({
            where: (table, {eq}) => eq(table.projectId, project.id),
            orderBy: (table, {desc}) => [desc(table.version)]
          })
          const newVersion = (latestSchema?.version ?? 0) + 1

          // 3. Create new projectSchema version in database
          await db.insert(dbSchema.projectSchema).values({
            projectId: project.id,
            version: newVersion,
            schemaJson: input.schema,
            message: input.message
          })

          // 4. Update projectCommit.activeSchemaVersion
          await db
            .update(dbSchema.projectCommit)
            .set({activeSchemaVersion: newVersion})
            .where(sqlEq(dbSchema.projectCommit.publicId, projectCommitPublicId))

          return {
            success: true,
            version: newVersion
          }
        } catch (error) {
          log('writeSchema error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }),
    scriptGet: tool({
      ...tools.scriptGet,
      execute: async (_input, _opts) => {
        try {
          // Get the activeExtractorVersion from projectCommit
          const projectCommit = await db.query.projectCommit.findFirst({
            where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
          })
          const extractorVersion = projectCommit?.activeExtractorVersion
          if (typeof extractorVersion !== 'number') {
            return {
              success: true,
              script: null,
              version: null,
              message: null
              // name: null,
              // description: null,
              // scriptLanguage: null
            }
          }
          // Get the specific extractor version
          const activeExtractor = await db.query.extractor.findFirst({
            where: (table, {and, eq}) =>
              and(eq(table.projectId, project.id), eq(table.version, extractorVersion))
          })
          // If no extractor exists at that version, return nulls
          if (!activeExtractor) {
            return {
              success: true,
              script: null,
              version: null,
              message: null
              // name: null,
              // description: null,
              // scriptLanguage: null
            }
          }
          // Return the active extractor with all relevant info
          return {
            success: true,
            script: activeExtractor.script,
            version: activeExtractor.version,
            message: activeExtractor.message,
            updatedAt: sqlTimestampToDate(activeExtractor.createdAt).toISOString()
            // name: activeExtractor.name,
            // description: activeExtractor.description,
            // scriptLanguage: activeExtractor.scriptLanguage
          }
        } catch (error) {
          log('readScript error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }),
    scriptSet: tool({
      ...tools.scriptSet,
      execute: async (input) => {
        try {
          // Get the latest extractor version
          const latestExtractor = await db.query.extractor.findFirst({
            where: (table, {eq}) => eq(table.projectId, project.id),
            orderBy: (table, {desc}) => desc(table.version)
          })

          const newVersion = (latestExtractor?.version ?? 0) + 1

          // Create new extractor version
          await db.insert(dbSchema.extractor).values({
            projectId: project.id,
            version: newVersion,
            // name: input.name ?? 'Main Extractor',
            message: input.message,
            script: input.script
            // scriptLanguage: 'javascript' as const
          })

          log('Created new extractor version:', newVersion)

          // Update the project commit to use the new version
          await db
            .update(dbSchema.projectCommit)
            .set({activeExtractorVersion: newVersion})
            .where(sqlEq(dbSchema.projectCommit.publicId, projectCommitPublicId))

          return {
            success: true,
            version: newVersion
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
    htmlGet: tool({
      ...tools.htmlGet,
      execute: async (input) => {
        try {
          // Get the project commit and its cached data
          const projectCommit = await db.query.projectCommit.findFirst({
            where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
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
    runScrape: tool({
      ...tools.runScrape,
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
            where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
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
            where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
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
    //  meta‑tools
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
