// tools.ts
import type { ToolSet } from 'ai'
import z, { success } from 'zod'

/* ──────────────────────────────────────────────────────────────────────────
   Shared types
   ────────────────────────────────────────────────────────────────────────── */

const ISODate = z.iso.datetime()
const NonEmpty = z.string().min(1)

const HtmlFormat = z.enum(['raw', 'cleaned', 'readability', 'markdown', 'text'])
// const ScriptLanguage = z.enum(['javascript', 'typescript'])
// const RunMode = z.enum(['cached', 'fresh']).describe('cached uses last fetch if present; fresh re-fetches')

const FetchStatus = z.enum(['initial', 'cached', 'completed', 'failed'])
const ProcessingStatus = z.enum(['initial', 'completed', 'failed'])
const ExecutionStatus = z.enum(['initial', 'completed', 'failed'])
const ValidationStatus = z.enum(['initial', 'completed', 'failed'])

/** Generic JSON Schema container (allow arbitrary keys, preserve unknowns) */
const JsonSchema = z.record(z.string(), z.any()).describe('JSON Schema Draft-like object')

/** Validation errors carry a machine code, JSONPath, and message */
const ValidationError = z.object({
  code: NonEmpty, // e.g., "required", "type", "minLength"
  path: z.array(z.union([z.string(), z.number()])).describe('JSONPath tokens'),
  message: NonEmpty
})

/** Per-item extraction error (for array payloads) */
const ItemError = z.object({
  itemIndex: z.number().int().min(0),
  errors: z.array(ValidationError)
})

/** Structured runtime log */
const ExecLog = z.object({
  type: z.enum(['log', 'exception', 'status']),
  message: z.string(),
  timestamp: z.number().nullish() // ms since epoch
})

/** Artifact selector for version APIs */
const Artifact = z.enum(['schema', 'script'])

/** Version descriptor */
const VersionInfo = z.object({
  version: z.number().int().positive(),
  author: z.string().optional(),
  message: z.string().optional(),
  createdAt: ISODate
})

/* ──────────────────────────────────────────────────────────────────────────
   Tools
   ────────────────────────────────────────────────────────────────────────── */

const tools = {
  /* Simple connectivity check */
  ping: {
    description: 'Simple ping test - returns pong',
    inputSchema: z.object({ input: z.boolean() }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },

  currentState: {
    description: 'Get information about the current state of the scraper',
    inputSchema: z.object({}),
    outputSchema: z.object({
      overview: z.string()
    })
  },

  fileGet: {
    description:
      'Read the current file version, schema - data validation schema, crawler - crawling script, extractor - extraction script',
    inputSchema: z.object({
      file: z.literal(['schema.json', 'crawler.js', 'extractor.js'])
    }),
    outputSchema: z.object({
      success: z.boolean(),
      content: z.union([JsonSchema, z.string()]).nullish(),
      version: z.number().nullish(),
      message: z.string().nullish(),
      error: z.string().nullish()
    })
  },

  fileSet: {
    description:
      'Replace the current file version, schema - data validation schema, crawler - crawling script, extractor - extraction script',
    inputSchema: z.object({
      file: z.literal(['crawler.js', 'extractor.js', 'schema.json']),
      content: z
        .union([z.string(), JsonSchema])
        .describe('Complete file contents, schema.json requires a json object, other files require a string'),
      message: z.string().optional().describe('Commit message for this version')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      version: z.number().nullish(),
      problems: z.string().nullish()
    })
  },

  /* ── HTML access (cached artifacts) ───────────────────────────────────── */

  htmlGet: {
    description: 'Read cached HTML or derived representations from the last fetch',
    inputSchema: z.object({
      format: HtmlFormat.default('cleaned')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      format: HtmlFormat.nullish(),
      content: z.string().nullish(),
      url: z.url().nullish(),
      statusCode: z.number().nullish(),
      cached: z.boolean().nullish(),
      fetchedAt: z.iso.datetime().nullish()
    })
  },

  /* ── Run: fetch/process/extract/validate in one step ──────────────────── */

  // TODO: Add ability to switch to crawl and scrape
  scraperRun: {
    description:
      'Run the scraping pipeline: fetch, process, execute extraction script, and validate against the schema',
    inputSchema: z.object(),
    // inputSchema: z
    //   .object({
    // mode: RunMode.default('cached'),
    // runOn: HtmlFormat.default('cleaned').describe('Which representation to pass to the extraction script')
    // correlationId: Uuid.optional(),
    // Optional override for cleaning rules (kept small so tool remains simple)
    // cleaning: z
    //   .object({
    //     allowTags: z.array(z.string()).optional(),
    //     denyTags: z.array(z.string()).optional(),
    //     allowAttrs: z.array(z.string()).optional(),
    //     denyAttrs: z.array(z.string()).optional()
    //   })
    //   .optional()
    // })
    // .nullish(),
    outputSchema: z.object({
      success: z.boolean(),
      url: z.string().nullish(),
      fetchStatus: FetchStatus.nullish(),
      processingStatus: ProcessingStatus.nullish(),
      extractStatus: ExecutionStatus.nullish(),
      validationStatus: ValidationStatus.nullish(),
      // success: z.boolean(),
      // correlationId: z.string().optional(),
      // status: ExecutionStatus, // final status of the run (completed/failed)
      error: z.string().nullish()
    })
  },

  /* ── Inspect last run: results/validation/logs (compact surfaces) ─────── */

  // TODO: Add some pagination and better adapt to working like the API
  resultsGet: {
    description: 'Read extracted data and validation summary from the last run',
    inputSchema: z.object(),
    outputSchema: z.object({
      success: z.boolean(),
      extractionStatus: ExecutionStatus.nullish(),
      result: z.unknown().nullish(), // entire JSON result (array or object)
      // isArray: z.boolean().optional(),
      itemCount: z.number().nullish(),
      validationStatus: ValidationStatus.nullish(),
      validationErrors: z.array(ValidationError).nullish(),
      itemErrors: z.array(ItemError).nullish(),
      // correlationId: z.string().optional(),
      ranAt: z.iso.datetime().nullish()
    })
  },

  logsGet: {
    description: 'Read script execution logs and exceptions from the last run',
    inputSchema: z.object(),
    // inputSchema: z
    //   .object({
    //     // includeStatus: z.boolean().default(false)
    //   })
    //   .nullish(),
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().nullish(),
      // hasExceptions: z.boolean().optional(),
      logs: z.array(ExecLog).default([]).nullish()
    })
  }

  /* ── Minimal settings (kept intentionally small for now) ──────────────── */

  // settingsGet: {
  //   description: 'Read current scraper settings',
  //   inputSchema: z.object({}),
  //   outputSchema: z.object({
  //     success: z.boolean(),
  //     defaultRunFormat: HtmlFormat.default('cleaned'),
  //     cleaningDefaults: z.object({
  //       stripScripts: z.boolean(),
  //       stripStyles: z.boolean()
  //     })
  //   })
  // },

  // settingsUpdate: {
  //   description: 'Update minimal scraper settings (kept intentionally small)',
  //   inputSchema: z.object({
  //     defaultRunFormat: HtmlFormat.optional(),
  //     cleaningDefaults: z
  //       .object({
  //         stripScripts: z.boolean().optional(),
  //         stripStyles: z.boolean().optional()
  //       })
  //       .optional()
  //   }),
  //   outputSchema: z.object({
  //     success: z.boolean(),
  //     error: z.string().optional()
  //   })
  // }
} satisfies ToolSet

export default tools
