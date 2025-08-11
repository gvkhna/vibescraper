import {pgTable, text, integer, uniqueIndex, timestamp, jsonb, boolean} from 'drizzle-orm/pg-core'
import {sql} from 'drizzle-orm'
import {ulid, type ULID} from 'ulid'
import {alphanumericShortPublicId} from '@/lib/short-id'
import type {PaginationEntityState} from '@/store/pagination-entity-state'
import {storage} from './storage'
import {TIMESTAMPS_SCHEMA, type BrandedType, type SQLUTCTimestamp, type StrictOmit} from './common'
import {type SubjectPolicyDTOType, type SubjectPolicyId, subjectPolicy} from './permissions'
import {user, type UserId} from './better-auth'
import type {ProjectChatDTOType, ProjectChatCursor} from './project-chat'

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
  retryDelay: number
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
  timeout: number // in milliseconds
  maxOutputSize: number // -1 means unlimited
}

// [projects]
//    ├── [projectCommit] (central config - stores active versions & settings)
//    ├── [projectUrls]
//    ├── [projectSchemas] (versioned)
//    ├── [extractors] (versioned)
//    └── [crawlRuns]
//
// [crawlRuns] + [projectUrls] → [httpResponses]
//
// [httpResponses] + [extractors] → [extractionRuns]
//                                          ↓
//                                   [extractionItems]

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
      .references(() => subjectPolicy.id, {onDelete: 'cascade'})
      .$type<SubjectPolicyId>(),
    userId: text()
      .notNull()
      .references(() => user.id, {onDelete: 'cascade'})
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
      .references(() => project.id, {onDelete: 'cascade'})
      .$type<ProjectId>(),
    userId: text()
      .notNull()
      .references(() => user.id, {onDelete: 'cascade'})
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
    currentEditorUrl: text(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type ProjectCommitDTOType = StrictOmit<
  typeof projectCommit.$inferSelect,
  'id' | 'projectId' | 'userId'
>

// Project Schemas (versioned like extractors)
export type ProjectSchemaId = BrandedType<ULID, 'ProjectSchemaId'>
export type ProjectSchemaPublicId = BrandedType<ULID, 'ProjectSchemaPublicId'>

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
      .references(() => project.id, {onDelete: 'cascade'})
      .$type<ProjectId>(),
    version: integer().notNull(),
    name: text().notNull(),
    description: text(),
    schemaJson: jsonb().notNull(),
    schemaType: text().notNull().default('json_schema').$type<'json_schema' | 'zod'>(),
    isActive: boolean().notNull().default(true),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.projectId, table.version), uniqueIndex().on(table.publicId)]
)

export type ProjectSchemaDTOType = StrictOmit<typeof projectSchema.$inferSelect, 'id' | 'projectId'>

// Project URLs
export type ProjectUrlId = BrandedType<ULID, 'ProjectUrlId'>

export const projectUrl = pgTable(
  'projectUrl',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ProjectUrlId>(),
    projectId: text()
      .notNull()
      .references(() => project.id, {onDelete: 'cascade'})
      .$type<ProjectId>(),
    url: text().notNull(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.projectId, table.url)]
)

export type ProjectUrlDTOType = StrictOmit<typeof projectUrl.$inferSelect, 'id' | 'projectId'>

// Crawl Runs
export type CrawlRunId = BrandedType<ULID, 'CrawlRunId'>

export const crawlRun = pgTable('crawlRun', {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
    .$type<CrawlRunId>(),
  projectId: text()
    .notNull()
    .references(() => project.id, {onDelete: 'cascade'})
    .$type<ProjectId>(),
  status: text()
    .notNull()
    .default('pending')
    .$type<'pending' | 'running' | 'success' | 'error' | 'cancelled'>(),
  errorMessage: text(),
  startedAt: timestamp({mode: 'string'}).notNull().defaultNow().$type<SQLUTCTimestamp>(),
  finishedAt: timestamp({mode: 'string'}).$type<SQLUTCTimestamp>(),
  ...TIMESTAMPS_SCHEMA
})

export type CrawlRunDTOType = StrictOmit<typeof crawlRun.$inferSelect, 'id' | 'projectId'>

// HTTP Responses
export type HttpResponseId = BrandedType<ULID, 'HttpResponseId'>

export const httpResponse = pgTable(
  'httpResponse',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<HttpResponseId>(),
    crawlRunId: text()
      .notNull()
      .references(() => crawlRun.id, {onDelete: 'cascade'})
      .$type<CrawlRunId>(),
    projectUrlId: text()
      .notNull()
      .references(() => projectUrl.id, {onDelete: 'cascade'})
      .$type<ProjectUrlId>(),
    statusCode: integer(),
    contentType: text().notNull(),
    headers: jsonb(),

    bodyHashAlgo: text().default('sha256').notNull().$type<'sha256'>(),
    bodyHash: text(),

    // TODO:
    // for small and simple responses we'll store it in the db
    // for larger responses we'll store it in external storage
    storageType: text().notNull().$type<'text' | 'storage'>(),
    body: text().notNull(),
    storageId: text().references(() => storage.id, {onDelete: 'set null'}),
    responseTimeMs: integer(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.crawlRunId, table.projectUrlId)]
)

export type HttpResponseDTOType = StrictOmit<
  typeof httpResponse.$inferSelect,
  'id' | 'crawlRunId' | 'projectUrlId'
>

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
      .references(() => project.id, {onDelete: 'cascade'})
      .$type<ProjectId>(),
    version: integer().notNull(),
    name: text().notNull(),
    description: text(),
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
    httpResponseId: text()
      .notNull()
      .references(() => httpResponse.id, {onDelete: 'cascade'})
      .$type<HttpResponseId>(),
    extractorId: text()
      .notNull()
      .references(() => extractor.id, {onDelete: 'cascade'})
      .$type<ExtractorId>(),
    status: text()
      .notNull()
      .default('pending')
      .$type<'pending' | 'running' | 'success' | 'error' | 'skipped'>(),
    errorMessage: text(),
    extractedAt: timestamp({mode: 'string'}).notNull().defaultNow().$type<SQLUTCTimestamp>(),
    durationMs: integer(),
    itemCount: integer().notNull().default(0),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.httpResponseId, table.extractorId)]
)

export type ExtractionRunDTOType = StrictOmit<
  typeof extractionRun.$inferSelect,
  'id' | 'httpResponseId' | 'extractorId'
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
      .references(() => extractionRun.id, {onDelete: 'cascade'})
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
