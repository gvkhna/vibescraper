import type {UIMessage} from 'ai'
import debug from 'debug'

const log = debug('app:chat-message-schema')

export type ChatMessageSchemaType = UIMessage

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
