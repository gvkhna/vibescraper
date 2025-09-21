import type { CodeExecutionMessage } from '@vibescraper/sandbox'
import { sql } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import type { JsonObject, JsonValue } from 'type-fest'
import { type ULID, ulid } from 'ulid'

import { alphanumericShortPublicId } from '@/lib/short-id'
import type { PaginationEntityState } from '@/store/pagination-entity-state'

import { user, type UserId } from './better-auth'
import { type BrandedType, type SQLUTCTimestamp, type StrictOmit, TIMESTAMPS_SCHEMA } from './common'
import { subjectPolicy, type SubjectPolicyDTOType, type SubjectPolicyId } from './permissions'
import type { ProjectChatCursor, ProjectChatDTOType } from './project-chat'
import { storage } from './storage'

// [project]
//    ├── [projectCommit] (central config - stores active versions & settings)
//    ├── [crawler] (versioned) - crawler script
//    ├── [extractor] (versioned) - extractor script
//    ├── [projectSchemas] (versioned) - data schema
//    └── [crawlRun]
//          ├─ crawlUrl
//          └────└─ extractionRun
//                     └─ extractionItem[]
//

export type ProjectId = BrandedType<ULID, 'ProjectId'>
export type ProjectPublicId = BrandedType<ULID, 'ProjectPublicId'>

// Type definitions for JSONB columns
export type ScheduleType = 'every-6-hours' | 'daily' | 'weekly' | 'manual'

export type FetchType = 'fetch' | 'playwright' | 'playwright-stealth' | 'camoufox'

export type CrawlerSettings = {
  followLinks: boolean
  maxDepth: number
  urlMask?: string
  maxConcurrency: number
  requestTimeout: number
  waitBetweenRequests: number
  successStatusCodes: number[]
  userAgent?: string
  respectRobotsTxt: boolean
}

export type ProjectCommitSettings = {
  schedule: ScheduleType
  fetchType: FetchType
  crawler: CrawlerSettings
  maxRetries: number
  retryDelayMs: number
  maxRuntimeMs: number
  maxCrawlurls: number
}

export type CleaningMethod = 'raw-html' | 'cleaned-html' | 'filtered-html' | 'markdown' | 'readability-html'

export type HtmlFilterSettings = {
  stripTags: string[]
  preserveTags: string[]
  stripAttributes: string[]
  preserveAttributes: string[]
  removeComments: boolean
  removeHead: boolean
}

export type ExtractorSettings = {
  cleaningMethod: CleaningMethod
  htmlFilter: HtmlFilterSettings
  timeoutMs: number // in milliseconds
  maxOutputSize: number // -1 means unlimited
}

// Cache data structure for development/preview mode
export type ProjectCommitCacheData = {
  url: string

  // STAGE 1: Fetch
  fetchStatus: 'initial' | 'cached' | 'completed' | 'failed'
  fetchError?: string | null // Error details when fetchStatus is 'failed' (timeout, non-OK status, network error, etc.)
  statusCode?: number | null // HTTP status code (only populated when fetch completed or got HTTP response)
  contentType?: string | null // Content-Type header (only populated when fetch completed or got HTTP response)
  responseTimeMs?: number | null // Response time in milliseconds (only populated when fetch completed)
  headers?: Record<string, string> | null // HTTP headers (only populated when fetch completed or got HTTP response)

  // STAGE 2: Processing
  processingStatus: 'initial' | 'completed' | 'failed'
  processingError?: string | null // Error details when processingStatus is 'failed' (not HTML, parse error, etc.)
  html?: string | null // Raw HTML (only populated when fetch completed successfully)
  formattedHtml?: string | null // Formatted HTML (only populated when processing completed successfully)
  cleanedHtml?: string | null // Cleaned HTML (only populated when processing completed successfully)
  text?: string | null // Plain text (only populated when processing completed successfully)
  readabilityResult?: {
    title: string | null
    byline: string | null
    dir: string | null
    lang: string | null
    content: string | null
    textContent: string | null
    excerpt: string | null
    length: number | null
    siteName: string | null
  } | null // Readability extraction result (only populated when processing completed successfully)
  markdown?: string | null // Markdown conversion (only populated when processing completed successfully)

  // STAGE 3: Extraction Script
  extractionScriptStatus: 'initial' | 'completed' | 'failed'
  extractionResult?: JsonValue // Parsed result from script execution (only populated when script completed successfully)
  extractionMessages?: CodeExecutionMessage[] | null // All messages from sandbox (logs, exceptions, etc.)

  // STAGE 4: Schema Validation
  schemaValidationStatus: 'initial' | 'completed' | 'failed'
  schemaValidationErrors?: string[] | null // Detailed validation errors (only populated when validation failed)
  schemaValidationItemErrors?: Array<{
    itemIndex: number
    errors: string[]
  }> | null // Item-level validation errors for arrays (only populated when validation failed)
}

export type CrawlUrlHttpLog = {
  method: string
  httpVersion: string | null
  statusCode: number
  responseTimeMs: number
  requestHeaders: { [k: string]: string }
  responseHeaders: { [k: string]: string }
  remoteIp: string | null
  fetchType: FetchType
  redirectedFrom: string | null
  responseSizeBytes: number
}

export const project = pgTable(
  'project',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ProjectId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<ProjectPublicId>(),
    subjectPolicyId: text()
      .notNull()
      .references(() => subjectPolicy.id, { onDelete: 'cascade' })
      .$type<SubjectPolicyId>(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
      .$type<UserId>(),
    name: text().notNull(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type ProjectDTOType = {
  project: StrictOmit<typeof project.$inferSelect, 'id' | 'subjectPolicyId' | 'userId'>
  subjectPolicy: SubjectPolicyDTOType
  chats: ProjectChatDTOType[]
  chatsPageInfo: PaginationEntityState<ProjectChatCursor>
  schemas?: ProjectSchemaDTOType[]
}

export type ProjectCommitId = BrandedType<ULID, 'ProjectCommitId'>
export type ProjectCommitPublicId = BrandedType<ULID, 'ProjectCommitPublicId'>

export const projectCommit = pgTable(
  'projectCommit',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ProjectCommitId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<ProjectCommitPublicId>(),
    projectId: text()
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' })
      .$type<ProjectId>(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
      .$type<UserId>(),
    type: text().notNull().default('initial').$type<'staged' | 'commit'>(),
    commitHash: text(),
    settingsJson: jsonb()
      .notNull()
      .default({
        schedule: 'manual',
        fetchType: 'fetch',
        crawler: {
          followLinks: true,
          maxDepth: 3,
          maxConcurrency: 1,
          requestTimeout: 30000,
          waitBetweenRequests: 750,
          successStatusCodes: [200],
          respectRobotsTxt: true
        },
        maxRetries: 3,
        retryDelay: 5000
      })
      .$type<ProjectCommitSettings>(),
    activeSchemaVersion: integer(),
    activeExtractorVersion: integer(),
    activeCrawlerVersion: integer(),
    currentEditorUrl: text(),
    // Cache for development/preview mode
    cachedData: jsonb().$type<ProjectCommitCacheData | null>(),
    cachedAt: timestamp({ mode: 'string' }).$type<SQLUTCTimestamp>(),
    // Recent URLs for URL history
    recentUrls: jsonb().notNull().default({ urls: [] }).$type<{
      urls: string[]
    }>(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type ProjectCommitDTOType = StrictOmit<
  typeof projectCommit.$inferSelect,
  'id' | 'projectId' | 'userId'
>

// Project Schemas (versioned)
export type ProjectSchemaId = BrandedType<ULID, 'ProjectSchemaId'>
export type ProjectSchemaPublicId = BrandedType<string, 'ProjectSchemaPublicId'>

// Type for the actual schema JSON content
export type SchemaJsonContent = JsonObject

export const projectSchema = pgTable(
  'projectSchema',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ProjectSchemaId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<ProjectSchemaPublicId>(),
    projectId: text()
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' })
      .$type<ProjectId>(),
    version: integer().notNull(),
    schemaJson: jsonb().notNull().$type<SchemaJsonContent>(),
    message: text(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type ProjectSchemaDTOType = StrictOmit<typeof projectSchema.$inferSelect, 'id' | 'projectId'>

// Crawlers
export type CrawlerId = BrandedType<ULID, 'CrawlerId'>
export type CrawlerPublicId = BrandedType<ULID, 'CrawlerPublicId'>

export const crawler = pgTable(
  'crawler',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<CrawlerId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<CrawlerPublicId>(),
    projectId: text()
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' })
      .$type<ProjectId>(),
    version: integer().notNull(),
    message: text(),
    script: text().notNull(),
    scriptLanguage: text().notNull().default('javascript').$type<'javascript'>(),
    isActive: boolean().notNull().default(true),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.projectId, table.version), uniqueIndex().on(table.publicId)]
)

export type CrawlerDTOType = StrictOmit<typeof crawler.$inferSelect, 'id' | 'projectId'>

// Crawl Runs
export type CrawlRunId = BrandedType<ULID, 'CrawlRunId'>

export const crawlRun = pgTable('crawlRun', {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
    .$type<CrawlRunId>(),
  projectId: text()
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' })
    .$type<ProjectId>(),
  status: text()
    .notNull()
    .default('pending')
    .$type<'pending' | 'running' | 'success' | 'error' | 'cancelled'>(),
  errorMessage: text(),
  startedAt: timestamp({ mode: 'string' }).notNull().defaultNow().$type<SQLUTCTimestamp>(),
  finishedAt: timestamp({ mode: 'string' }).$type<SQLUTCTimestamp>(),
  ...TIMESTAMPS_SCHEMA
})

export type CrawlRunDTOType = StrictOmit<typeof crawlRun.$inferSelect, 'id' | 'projectId'>

// Crawl URLs
export type CrawlUrlId = BrandedType<ULID, 'CrawlUrlId'>

export const crawlUrl = pgTable(
  'crawlUrl',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<CrawlUrlId>(),
    crawlRunId: text()
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' })
      .$type<CrawlRunId>(),
    url: text().notNull(),
    status: text().notNull().$type<'ok' | 'failed'>(),
    httpLog: jsonb().notNull().$type<CrawlUrlHttpLog>(),
    storageType: text().notNull().$type<'db' | 'storage'>(),
    body: text().notNull(),
    storageId: text().references(() => storage.id, { onDelete: 'set null' }),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.crawlRunId, table.url)]
)

export type CrawlUrlDTOType = StrictOmit<typeof crawlUrl.$inferSelect, 'id' | 'crawlRunId'>

// Extractors
export type ExtractorId = BrandedType<ULID, 'ExtractorId'>
export type ExtractorPublicId = BrandedType<ULID, 'ExtractorPublicId'>

export const extractor = pgTable(
  'extractor',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ExtractorId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<ExtractorPublicId>(),
    projectId: text()
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' })
      .$type<ProjectId>(),
    version: integer().notNull(),
    // name: text().notNull(),
    message: text(),
    script: text().notNull(),
    scriptLanguage: text().notNull().default('javascript').$type<'javascript'>(),
    settingsJson: jsonb()
      .notNull()
      .default({
        cleaningMethod: 'filtered-html',
        htmlFilter: {
          stripTags: [
            'script',
            'style',
            'noscript',
            'iframe',
            'frame',
            'frameset',
            'noframes',
            'svg',
            'canvas',
            'audio',
            'video',
            'source',
            'track',
            'embed',
            'object',
            'applet',
            // 'img',
            // 'picture',
            'map',
            'textarea',
            'input',
            // 'button',
            // 'select',
            // 'option',
            'textarea'
          ],
          preserveTags: [],
          stripAttributes: [],
          preserveAttributes: [
            'id',
            'role',
            'tabindex',
            'lang',
            'dir',
            'aria-*',
            'href',
            'hreflang',
            'rel',
            'target',
            'src',
            'alt',
            'width',
            'height',
            'name',
            'autocomplete',
            'value',
            'for',
            'title'
          ],
          removeComments: true,
          removeHead: false
        },
        timeout: 30000,
        maxOutputSize: -1
      })
      .$type<ExtractorSettings>(),
    isActive: boolean().notNull().default(true),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.projectId, table.version), uniqueIndex().on(table.publicId)]
)

export type ExtractorDTOType = StrictOmit<typeof extractor.$inferSelect, 'id' | 'projectId'>

// Extraction Runs
export type ExtractionRunId = BrandedType<ULID, 'ExtractionRunId'>

export const extractionRun = pgTable(
  'extractionRun',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ExtractionRunId>(),
    crawlUrlId: text()
      .notNull()
      .references(() => crawlUrl.id, { onDelete: 'cascade' })
      .$type<CrawlUrlId>(),
    extractorId: text()
      .notNull()
      .references(() => extractor.id, { onDelete: 'cascade' })
      .$type<ExtractorId>(),
    status: text()
      .notNull()
      .default('pending')
      .$type<'pending' | 'running' | 'success' | 'error' | 'skipped'>(),
    errorMessage: text(),
    extractedAt: timestamp({ mode: 'string' }).notNull().defaultNow().$type<SQLUTCTimestamp>(),
    durationMs: integer(),
    itemCount: integer().notNull().default(0),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.crawlUrlId, table.extractorId)]
)

export type ExtractionRunDTOType = StrictOmit<
  typeof extractionRun.$inferSelect,
  'id' | 'crawlUrlId' | 'extractorId'
>

// Extraction Items
export type ExtractionItemId = BrandedType<ULID, 'ExtractionItemId'>
export type ExtractionItemPublicId = BrandedType<ULID, 'ExtractionItemPublicId'>

export const extractionItem = pgTable(
  'extractionItem',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ExtractionItemId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<ExtractionItemPublicId>(),
    extractionRunId: text()
      .notNull()
      .references(() => extractionRun.id, { onDelete: 'cascade' })
      .$type<ExtractionRunId>(),
    payload: jsonb().notNull(),
    itemKey: text(),
    itemHash: text().notNull(),
    itemHashAlgo: text().default('sha256').notNull().$type<'sha256'>(),
    sequenceNumber: integer().notNull().default(0),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [
    uniqueIndex().on(table.publicId),
    uniqueIndex()
      .on(table.extractionRunId, table.itemKey)
      .where(sql`${table.itemKey} IS NOT NULL`)
  ]
)

export type ExtractionItemDTOType = StrictOmit<typeof extractionItem.$inferSelect, 'id' | 'extractionRunId'>
