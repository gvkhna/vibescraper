import type {ProjectChatMessageDTOType, projectChatMessage} from '@/db/schema'
import type {StrictOmit} from '@/db/schema/common'
import {type InferUITools, type ToolSet, type UIMessage, tool} from 'ai'
import debug from 'debug'
import z from 'zod'

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

const tools: ToolSet = {
  // someTool: tool({})
  ping: tool({
    description: 'Simple ping test - returns pong',
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    }),
    execute: async () => {
      log('ping called')
      return {
        success: true,
        message: 'pong'
      }
    }
  })
}

type SLTools = InferUITools<typeof tools>

export type SLUIMessage = UIMessage<SLMetadata, SLDataPart, SLTools>

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
