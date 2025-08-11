import {pgTable, text, integer, bigint, uniqueIndex, timestamp, jsonb, boolean} from 'drizzle-orm/pg-core'
import {ulid, type ULID} from 'ulid'
import {TIMESTAMPS_SCHEMA, type BrandedType, type SQLUTCTimestamp, type StrictOmit} from './common'
import {type ProjectId, project} from './project'
import type {
  ChatFileVersionBlockType,
  ChatMessageSchemaType
} from '@/partials/assistant-ui/chat-message-schema'

export type ProjectChatId = BrandedType<ULID, 'ProjectChatId'>
export type ProjectChatPublicId = BrandedType<ULID, 'ProjectChatPublicId'>
export type ProjectChatCursor = BrandedType<ULID, 'ProjectChatCursor'>

export const projectChat = pgTable(
  'projectChat',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ProjectChatId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<ProjectChatPublicId>(),
    projectId: text()
      .notNull()
      .references(() => project.id, {onDelete: 'cascade'})
      .$type<ProjectId>(),
    title: text().notNull(),
    titleStatus: text()
      .notNull()
      .default('initial')
      .$type<'initial' | 'generating' | 'generated' | 'custom'>(),
    chatType: text().notNull().$type<'empty' | 'chat' | 'deleted'>(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type ProjectChatDTOType = StrictOmit<typeof projectChat.$inferSelect, 'id' | 'projectId'>

export type ProjectChatMessageId = BrandedType<ULID, 'ProjectChatMessageId'>
export type ProjectChatMessagePublicId = BrandedType<ULID, 'ProjectChatMessagePublicId'>
export type ProjectChatMessageCursor = BrandedType<ULID, 'ProjectChatMessageCursor'>
export type ProjectChatBlockIdempotencyKey = BrandedType<ULID, 'ProjectChatBlockIdempotencyKey'>

export const projectChatMessage = pgTable(
  'projectChatMessage',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ProjectChatMessageId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<ProjectChatMessagePublicId>(),
    projectChatId: text()
      .notNull()
      .references(() => projectChat.id, {onDelete: 'cascade'})
      .$type<ProjectChatId>(),

    /* Strict union for role */
    role: text().notNull().$type<'user' | 'assistant' | 'system'>(),

    /* Incrementing position inside the chat (for ORDER BY) */
    index: integer().notNull(),

    /* Final form of the message once streaming finishes */
    content: jsonb().notNull().$type<ChatMessageSchemaType>(),

    /* If the message was streamed, this flips when done */
    status: text().notNull().default('pending').$type<'pending' | 'generating' | 'done' | 'error'>(),

    idempotencyKeys: text().array().$type<ProjectChatBlockIdempotencyKey[]>(),
    blocks: jsonb()
      .notNull()
      .default({})
      .$type<Record<ProjectChatBlockIdempotencyKey, ChatFileVersionBlockType | undefined>>(),

    /* AI usage for cost analytics */
    usage: jsonb().$type<{
      finalized?: boolean
      aborted?: boolean
      continuation?: boolean
      errored?: boolean
      errorMessage?: string | null
      finishReason?: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'
      inputTokens?: number
      outputTokens?: number
      totalTokens?: number
      reasoningTokens?: number
      cachedInputTokens?: number
      durationMs?: number
    } | null>(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type ProjectChatMessageDTOType = StrictOmit<
  typeof projectChatMessage.$inferSelect,
  'id' | 'projectChatId'
>
