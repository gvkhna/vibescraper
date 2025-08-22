import type {ProjectChatMessageDTOType, projectChatMessage} from '@/db/schema'
import type {StrictOmit} from '@/db/schema/common'
import {type InferUIMessageChunk, type InferUITools, type UIMessage, type UIMessageChunk} from 'ai'
import debug from 'debug'
import z from 'zod'
import tools from '@/assistant-ai/tools'

const log = debug('app:chat-message-schema')

const metadataSchema = z.object({
  error: z.boolean()
})

type SLMetadata = z.infer<typeof metadataSchema>

const dataPartSchema = z.object({
  // error: z.string().optional()
  // someDataPart: z.object({}),
  // anotherDataPart: z.object({})
})

type SLDataPart = z.infer<typeof dataPartSchema>

type SLTools = InferUITools<typeof tools>

export type SLUIMessage = UIMessage<SLMetadata, SLDataPart, SLTools>
export type SLUIMessageChunk = InferUIMessageChunk<SLUIMessage>

export type ChatMessagePersistanceType = typeof projectChatMessage.$inferSelect
export type ChatMessageSchemaType = StrictOmit<SLUIMessage, 'id' | 'role'>

export type ChatFileVersionBlockFileStatus =
  | 'pending'
  | 'generating'
  | 'editing'
  | 'generated'
  | 'edited'
  | 'error'

export type ChatFileVersionBlockFileChange = {
  path: string
  status: ChatFileVersionBlockFileStatus
  isLoading?: boolean
}

export type ChatFileProjectVersionBlockType = {
  type: 'extractor'
  version: string | number
  changes: ChatFileVersionBlockFileChange[]
  overallStatus?: 'loading' | 'in-progress' | 'complete' | 'error'
}

export type SchemaVersionBlockType = {
  type: 'schema'
  changes: ChatFileVersionBlockFileChange[]
  version: string | number
  overallStatus?: 'loading' | 'in-progress' | 'complete' | 'error'
}

export type ChatFileVersionBlockType = ChatFileProjectVersionBlockType | SchemaVersionBlockType

export function isToolKey(value: string): value is `tool-${string}` {
  return value.startsWith('tool-')
}

type SLToolParts = Extract<SLUIMessageChunk, {type: `tool-${string}`}>

function isToolPart(part: SLUIMessageChunk): part is SLToolParts {
  return part.type.startsWith('tool-')
}

export function isDataKey(value: string): value is `data-${string}` {
  return value.startsWith('data-')
}

export function convertChatMessageToUIMessage(
  chatMessage: Pick<ProjectChatMessageDTOType, 'publicId' | 'role' | 'content'>
): SLUIMessage {
  return {
    metadata: chatMessage.content.metadata,
    id: chatMessage.publicId,
    role: chatMessage.role,
    parts: chatMessage.content.parts
  }
}

export function convertUIMessageToChatMessage(uiMessage: SLUIMessage): ChatMessageSchemaType {
  const {id: _, role: __, ...msg} = uiMessage
  return msg
}
