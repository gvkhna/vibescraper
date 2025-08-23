import {useEffect} from 'react'
import debug from 'debug'
import {differenceInMinutes} from 'date-fns'
import {PROJECT_COMPONENT_IDEMPOTENCY_RECENT_WINDOW} from '@/store/assistant-slice'
import {useStore} from '@/store/use-store'
import type {ProjectChatMessagePublicId, ProjectComponentIdempotencyKey} from '@/db/schema'
import {nowait} from '@/lib/async-utils'
import {parseCodeBlocksWithMeta} from './remark-meta-code-attrs'
import {ChatFileProjectVersionBlock} from './chat-file-version-block'
// import { runAssistantBlocks } from './assistant-project-controller'

const log = debug('app:project-comp')

export interface AssistantProjectComponentProps {
  // chat message id
  messageId?: ProjectChatMessagePublicId
  // iso date string
  createdAt?: string
  // project component parsed index
  blockIndex?: string
  partIndex?: string
  // unparsed file transforms
  source?: string
}

export function AssistantProjectComponent(props: AssistantProjectComponentProps) {
  const {messageId, createdAt, blockIndex, partIndex, source} = props

  const idempotencyKey = `Project/${messageId}/${partIndex}/${blockIndex}` as ProjectComponentIdempotencyKey

  const chatMessage = useStore((state) => state.assistantSlice.chatMessages[messageId!])

  const activeProjectVersionBlock = useStore(
    (state) => state.assistantSlice.activeProjectVersionBlocks[idempotencyKey]
  )

  // const runAssistantBlocks = useStore((state) => state.assistantProjectSlice.runAssistantBlocks)
  const projectComponentIdempotencyKeys = useStore(
    (state) => state.assistantSlice.projectComponentIdempotencyKeys
  )
  const updateProjectComponentIdempotencyKey = useStore(
    (state) => state.assistantSlice.updateProjectComponentIdempotencyKey
  )
  const updateActiveProjectVersionBlockStatus = useStore(
    (state) => state.assistantSlice.updateActiveProjectVersionBlockStatus
  )

  const isNewIdempotencyKey = useStore((state) => state.assistantSlice.isNewIdempotencyKey)

  // useEffect(() => {
  //   log('chat message state update', messageId)
  // }, [chatMessage, messageId])

  useEffect(() => {
    if (!messageId || !createdAt || !blockIndex || !partIndex || !source) {
      return
    }

    const messageDate = new Date(createdAt)
    const now = new Date()
    const timeIsRecent = differenceInMinutes(now, messageDate) <= PROJECT_COMPONENT_IDEMPOTENCY_RECENT_WINDOW
    if (!timeIsRecent) {
      return
    }

    const isNew = isNewIdempotencyKey(messageId, idempotencyKey)
    if (isNew) {
      // log('project component', idempotencyKey, source)
      nowait(updateActiveProjectVersionBlockStatus(messageId, idempotencyKey, 'loading'))
      parseCodeBlocksWithMeta(source)
        .then((val) => {
          if (val) {
            // return runAssistantBlocks(useProjectStore., val)
            try {
              // runAssistantBlocks(messageId, idempotencyKey, val)
              //   .then(() => {
              //     nowait(updateActiveProjectVersionBlockStatus(messageId, idempotencyKey, 'complete'))
              //   })
              //   .catch((e: unknown) => {
              //     log('assistant project slice', e)
              //     nowait(updateActiveProjectVersionBlockStatus(messageId, idempotencyKey, 'error'))
              //   })
            } catch (err) {
              log('assistant project slice err', err)
              nowait(updateActiveProjectVersionBlockStatus(messageId, idempotencyKey, 'error'))
            }
          }
        })
        // .then(() => {})
        .catch((err: unknown) => {
          log('err', err)
        })

      nowait(updateProjectComponentIdempotencyKey(messageId, idempotencyKey))
    }
  }, [
    blockIndex,
    createdAt,
    idempotencyKey,
    isNewIdempotencyKey,
    messageId,
    partIndex,
    projectComponentIdempotencyKeys,
    // runAssistantBlocks,
    source,
    updateActiveProjectVersionBlockStatus,
    updateProjectComponentIdempotencyKey
  ])
  if (messageId && createdAt && blockIndex && partIndex && source) {
    if (activeProjectVersionBlock) {
      return (
        <ChatFileProjectVersionBlock
          versionBlock={activeProjectVersionBlock}
          isLoading={false}
          isViewing={true}
        />
      )
    } else if (chatMessage && chatMessage.projectVersionBlocks[idempotencyKey]) {
      return (
        <ChatFileProjectVersionBlock
          versionBlock={chatMessage.projectVersionBlocks[idempotencyKey]}
          isLoading={false}
          isViewing={true}
        />
      )
    } else if (!chatMessage) {
      return (
        <ChatFileProjectVersionBlock
          versionBlock={{
            version: '?',
            changes: []
          }}
          isLoading={true}
          isViewing={false}
        />
      )
    }
    return (
      <ChatFileProjectVersionBlock
        versionBlock={{
          version: '?',
          changes: [],
          overallStatus: 'error'
        }}
        isLoading={false}
        isViewing={false}
      />
    )
  }
  return <></>
}
