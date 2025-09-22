import { differenceInMinutes } from 'date-fns'
import debug from 'debug'

import type {
  ProjectChatBlockIdempotencyKey,
  ProjectChatCursor,
  ProjectChatDTOType,
  ProjectChatMessageCursor,
  ProjectChatMessageDTOType,
  ProjectChatMessagePublicId,
  ProjectChatPublicId,
  ProjectPublicId
} from '@/db/schema'
import api from '@/lib/api-client'
import { asyncRetry } from '@/lib/async-utils'
import { sqlTimestampToDate } from '@/lib/format-dates'
import type {
  ChatFileVersionBlockFileStatus,
  ChatFileVersionBlockType
} from '@/partials/assistant-ui/chat-message-schema'

import {
  type AsyncEntityState,
  failLoading,
  finishLoading,
  initialAsyncEntityState,
  isLoaded,
  isLoading,
  startLoading
} from './async-entity-state'
import {
  initialPaginationEntityState,
  type PaginationEntityState,
  updatePaginationEntityState
} from './pagination-entity-state'
import type { StateSlice } from './use-store'
const log = debug('app:assistant-slice')

export const PROJECT_COMPONENT_IDEMPOTENCY_RECENT_WINDOW = 10 // minutes

// list of chats for a project
export interface AssistantProjectChatState {
  projectChats: ProjectChatDTOType[]
  asyncEntityState: AsyncEntityState
  paginationState: PaginationEntityState<ProjectChatCursor>
}

// list of messages for a chat
export interface AssistantProjectChatMessagesState {
  projectChatMessages: ProjectChatMessagePublicId[]
  asyncEntityState: AsyncEntityState
  paginationState: PaginationEntityState<ProjectChatMessageCursor>
}

export interface AssistantSlice {
  selectedProjectChat: Record<ProjectPublicId, ProjectChatPublicId | undefined>
  pendingInitialMessage: Record<ProjectPublicId, ProjectChatPublicId | undefined | null>
  projectChatsState: Record<ProjectPublicId, AssistantProjectChatState | undefined>
  chatMessages: Record<ProjectChatMessagePublicId, ProjectChatMessageDTOType | undefined>

  projectChatMessagesState: Record<ProjectChatPublicId, AssistantProjectChatMessagesState | undefined>
  projectComponentIdempotencyKeys: Record<
    ProjectChatMessagePublicId,
    ProjectChatBlockIdempotencyKey[] | undefined
  >

  activeProjectVersionBlocks: Record<ProjectChatBlockIdempotencyKey, ChatFileVersionBlockType | undefined>

  // Model selection per chat
  chatModels: Record<ProjectChatPublicId, string | undefined>
  setChatModel: (chatId: ProjectChatPublicId, model: string) => void

  // projectComponentVersionBlocks: Record<
  //   ProjectChatMessagePublicId,
  //   Record<ProjectComponentIdempotencyKey, ProjectVersionBlock | undefined> | undefined
  // >

  isNewIdempotencyKey(
    chatId: ProjectChatMessagePublicId,
    idempotencyKey: ProjectChatBlockIdempotencyKey
  ): boolean
  updateProjectComponentIdempotencyKey: (
    chatId: ProjectChatMessagePublicId,
    idempotencyKey: ProjectChatBlockIdempotencyKey
  ) => Promise<void>

  updateActiveProjectVersionBlockStatus(
    chatId: ProjectChatMessagePublicId,
    idemKey: ProjectChatBlockIdempotencyKey,
    status: ChatFileVersionBlockType['overallStatus']
  ): Promise<void>

  updateActiveProjectVersionBlock(
    chatId: ProjectChatMessagePublicId,
    idemKey: ProjectChatBlockIdempotencyKey,
    filename: string,
    status: ChatFileVersionBlockFileStatus,
    loading: boolean
  ): void

  deleteProjectChat: (projectPublicId: ProjectPublicId, chatId: ProjectChatPublicId) => Promise<void>
  reloadProjectChats: (projectPublicId: ProjectPublicId) => Promise<void>

  loadNewChat: (projectPublicId: ProjectPublicId) => Promise<void>

  loadProjectChatTitle: (projectPublicId: ProjectPublicId, chatId: ProjectChatPublicId) => Promise<void>
  loadProjectChatMessages: (chatId: ProjectChatPublicId, cursor?: ProjectChatMessageCursor) => Promise<void>

  newChat: (projectPublicId: ProjectPublicId) => void
  selectChat: (projectPublicId: ProjectPublicId, chatId: ProjectChatPublicId) => void

  syncProjectChatMessages: (
    chatId: ProjectChatPublicId,
    chatMessageIds: ProjectChatMessagePublicId[]
  ) => Promise<void>

  fetchProjectChatMessage: (
    chatId: ProjectChatPublicId,
    chatMessageId: ProjectChatMessagePublicId
  ) => Promise<void>

  clearPendingInitialMessage: (projectPublicId: ProjectPublicId) => void
}

export const createAssistantSlice: StateSlice<AssistantSlice> = (set, get) =>
  ({
    projectChatsState: {},
    chatMessages: {},
    selectedProjectChat: {},
    pendingInitialMessage: {},
    projectChatMessagesState: {},
    projectComponentIdempotencyKeys: {},
    activeProjectVersionBlocks: {},
    chatModels: {},
    updateActiveProjectVersionBlockStatus: async (chatId, idemKey, status) => {
      set(
        (draft) => {
          if (draft.assistantSlice.activeProjectVersionBlocks[idemKey]) {
            draft.assistantSlice.activeProjectVersionBlocks[idemKey].overallStatus = status
          } else {
            // draft.assistantSlice.activeProjectVersionBlocks[idemKey] = {
            //   version: '',
            //   changes: [],
            //   overallStatus: status
            // }
          }
        },
        true,
        'assistant/updateActiveProjectVersionBlockStatus'
      )
      if (status === 'error' || status === 'complete') {
        const updatedVersion = get().assistantSlice.activeProjectVersionBlocks[idemKey]
        if (updatedVersion) {
          await asyncRetry(
            async () => {
              const resp = await api.assistant.updateProjectVersionBlock.$post({
                json: {
                  projectChatMessagePublicId: chatId,
                  idemKey,
                  versionBlock: updatedVersion
                }
              })
              if (!resp.ok) {
                const body = await resp.json()
                log('error ', body)
                throw new Error(body.message)
              }
            },
            { retries: 1, minDelay: 500 }
          )
        }
      }
    },
    updateActiveProjectVersionBlock(chatId, idemKey, filename, status, loading) {
      set(
        (draft) => {
          const blocks = draft.assistantSlice.activeProjectVersionBlocks[idemKey]
          if (!blocks) {
            log('expected active project block but not found')
            return
          }

          const changesLen = blocks.changes.length
          let foundIndex = -1
          for (let i = 0; i < changesLen; i++) {
            const change = blocks.changes[i]
            if (change.path === filename) {
              foundIndex = i
              break
            }
          }

          if (foundIndex > -1) {
            blocks.changes[foundIndex] = {
              path: filename,
              status,
              isLoading: loading
            }
          } else {
            blocks.changes.push({
              path: filename,
              status,
              isLoading: loading
            })
          }
        },
        true,
        'assistant/updateActiveProjectVersionBlock'
      )
    },
    syncProjectChatMessages: async (chatId, chatMessageIds) => {
      const chatMessages = get().assistantSlice.chatMessages
      const newMessageIds: ProjectChatMessagePublicId[] = []

      chatMessageIds.forEach((id) => {
        if (!chatMessages[id]) {
          newMessageIds.push(id)
        }
      })

      log('newmessageids: ', newMessageIds)

      await asyncRetry(
        async () => {
          const resp = await api.assistant.syncChatMessages.$post({
            json: {
              projectChatPublicId: chatId,
              projectChatMessagePublicIds: newMessageIds
            }
          })
          if (resp.ok) {
            const body = await resp.json()
            log('sync chat messages response', body)
            set(
              (draft) => {
                body.result.forEach((message) => {
                  Object.assign(draft.assistantSlice.chatMessages, {
                    [message.publicId]: message
                  })
                })
              },
              true,
              'assistant/syncProjectChatMessage'
            )
          } else {
            const body = await resp.json()
            log('error ', body)
            throw new Error(body.message)
          }
        },
        { retries: 1, minDelay: 500 }
      )
    },
    fetchProjectChatMessage: async (chatId, chatMessageId) => {
      await asyncRetry(
        async () => {
          const resp = await api.assistant.fetchChatMessage.$post({
            json: {
              projectChatPublicId: chatId,
              projectChatMessagePublicId: chatMessageId
            }
          })
          if (resp.ok) {
            const body = await resp.json()
            log('fetch chat message response', body)
            set(
              (draft) => {
                const message = body.result
                Object.assign(draft.assistantSlice.chatMessages, {
                  [body.result.publicId]: message
                })
              },
              true,
              'assistant/fetchProjectChatMessage'
            )
          } else {
            const body = await resp.json()
            log('error ', body)
            throw new Error(body.message)
          }
        },
        { retries: 1, minDelay: 500 }
      )
    },
    deleteProjectChat: async (projectPublicId, projectChatPublicId) => {
      const chatState = get().assistantSlice.projectChatsState[projectPublicId]
      if (chatState && isLoading(chatState.asyncEntityState)) {
        return
      }

      set(
        (draft) => {
          const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
          if (!draftChatState) {
            log('expected draft chat state but not found')
            return
          }
          startLoading(draftChatState.asyncEntityState)
        },
        true,
        'assistant/deleteProjectChat:start'
      )

      try {
        const resp = await api.assistant.deleteChat.$post({
          json: {
            projectChatPublicId
          }
        })
        if (resp.ok) {
          const body = await resp.json()
          set(
            (draft) => {
              const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
              if (!draftChatState) {
                log('expected draft chat state but not found')
                return
              }
              const chatPaginationState = initialPaginationEntityState<ProjectChatCursor>()
              updatePaginationEntityState(chatPaginationState, {
                startCursor: body.chatsPageInfo.startCursor,
                hasNextPage: body.chatsPageInfo.hasNextPage
              })

              draftChatState.projectChats = body.chats
              draftChatState.paginationState = chatPaginationState
              finishLoading(draftChatState.asyncEntityState)
            },
            true,
            'assistant/deleteProjectChat:done'
          )
        } else {
          const body = await resp.json()
          log('error ', body)
          throw new Error(body.message)
        }
      } catch (e) {
        log('error', e)
        set(
          (draft) => {
            const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
            if (!draftChatState) {
              log('expected draft chat state but not found')
              return
            }
            failLoading(draftChatState.asyncEntityState)
          },
          true,
          'assistant/deleteProjectChat:error'
        )
      }
    },
    reloadProjectChats: async (projectPublicId) => {
      const chatState = get().assistantSlice.projectChatsState[projectPublicId]
      if (chatState && isLoading(chatState.asyncEntityState)) {
        return
      }

      set(
        (draft) => {
          const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
          if (!draftChatState) {
            log('expected draft chat state but not found')
            return
          }
          startLoading(draftChatState.asyncEntityState)
        },
        true,
        'assistant/reloadProjectChats:start'
      )

      try {
        const resp = await api.assistant.reloadChats.$post({
          json: {
            projectPublicId
          }
        })
        if (resp.ok) {
          const body = await resp.json()
          set(
            (draft) => {
              const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
              if (!draftChatState) {
                log('expected draft chat state but not found')
                return
              }
              const chatPaginationState = initialPaginationEntityState<ProjectChatCursor>()
              updatePaginationEntityState(chatPaginationState, {
                startCursor: body.chatsPageInfo.startCursor,
                hasNextPage: body.chatsPageInfo.hasNextPage
              })

              draftChatState.projectChats = body.chats
              draftChatState.paginationState = chatPaginationState
              finishLoading(draftChatState.asyncEntityState)
            },
            true,
            'assistant/reloadProjectChats:done'
          )
        } else {
          const body = await resp.json()
          log('error ', body)
          throw new Error(body.message)
        }
      } catch (e) {
        log('error', e)
        set(
          (draft) => {
            const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
            if (!draftChatState) {
              log('expected draft chat state but not found')
              return
            }
            failLoading(draftChatState.asyncEntityState)
          },
          true,
          'assistant/reloadProjectChats:error'
        )
      }
    },
    isNewIdempotencyKey: (chatId, idempotencyKey) => {
      let inserted = false
      set(
        (draft) => {
          const keyMap = draft.assistantSlice.projectComponentIdempotencyKeys
          const keys = keyMap[chatId] ?? []
          if (keys.includes(idempotencyKey)) {
            inserted = true
          } else {
            keys.push(idempotencyKey)
            draft.assistantSlice.projectComponentIdempotencyKeys[chatId] = keys
          }
        },
        true,
        'assistant/isNewIdempotencyKey'
      )
      return !inserted
    },
    updateProjectComponentIdempotencyKey: async (chatId, idempotencyKey) => {
      await asyncRetry(async () => {
        const resp = await api.assistant.updateIdempotencyKey.$post({
          json: {
            projectChatMessageId: chatId,
            projectComponentIdempotencyKey: idempotencyKey
          }
        })
        if (!resp.ok) {
          const body = await resp.json()
          log('error ', body)
          throw new Error(body.message)
        }
      })
    },
    loadNewChat: async (projectPublicId) => {
      const chatState = get().assistantSlice.projectChatsState[projectPublicId]
      if (chatState && isLoading(chatState.asyncEntityState)) {
        return
      }

      set(
        (draft) => {
          const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
          if (!draftChatState) {
            log('expected draft chat state but not found')
            return
          }
          startLoading(draftChatState.asyncEntityState)
        },
        true,
        'assistant/loadNewChat:start'
      )

      try {
        const resp = await api.assistant.loadNewChat.$post({
          json: {
            projectPublicId
          }
        })
        if (resp.ok) {
          const body = await resp.json()
          set(
            (draft) => {
              const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
              if (!draftChatState) {
                log('expected draft chat state but not found')
                return
              }
              if (!draftChatState.projectChats.some((c) => c.publicId === body.chat.publicId)) {
                draftChatState.projectChats.push(body.chat)
              }
              draft.assistantSlice.selectedProjectChat[projectPublicId] = body.chat.publicId
              finishLoading(draftChatState.asyncEntityState)
            },
            true,
            'assistant/loadNewChat:done'
          )
        } else {
          const body = await resp.json()
          log('error ', body)
          throw new Error(body.message)
        }
      } catch (e) {
        log('error', e)
        set(
          (draft) => {
            const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
            if (!draftChatState) {
              log('expected draft chat state but not found')
              return
            }
            failLoading(draftChatState.asyncEntityState)
          },
          true,
          'assistant/loadNewChat:error'
        )
      }
    },
    newChat(projectPublicId) {
      set(
        (draft) => {
          const chats = draft.assistantSlice.projectChatsState[projectPublicId]?.projectChats
          if (!chats) {
            log('expected projectChats but not found')
            return
          }

          const emptyChat = chats.find((chat) => chat.chatType === 'empty')
          if (!emptyChat) {
            log('expected empty chat but not found')
            return
          }
          draft.assistantSlice.selectedProjectChat[projectPublicId] = emptyChat.publicId
        },
        true,
        'assistant/newChat'
      )
    },
    selectChat(projectPublicId, chatId) {
      set(
        (draft) => {
          draft.assistantSlice.selectedProjectChat[projectPublicId] = chatId
        },
        true,
        'assistant/selectChat'
      )
    },
    loadProjectChatTitle: async (projectPublicId, chatId) => {
      const chatState = get().assistantSlice.projectChatsState[projectPublicId]
      if (chatState && isLoading(chatState.asyncEntityState)) {
        return
      }

      set(
        (draft) => {
          const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
          if (!draftChatState) {
            log('expected draft chat state but not found')
            return
          }
          startLoading(draftChatState.asyncEntityState)
        },
        true,
        'assistant/loadProjectChatTitle:start'
      )

      try {
        const resp = await api.assistant.loadChatTitle.$post({
          json: {
            projectChatPublicId: chatId
          }
        })
        if (resp.ok) {
          const body = await resp.json()
          set(
            (draft) => {
              const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
              if (!draftChatState) {
                log('expected draft chat state but not found')
                return
              }
              const chatPaginationState = initialPaginationEntityState<ProjectChatCursor>()
              updatePaginationEntityState(chatPaginationState, {
                startCursor: body.chatsPageInfo.startCursor,
                hasNextPage: body.chatsPageInfo.hasNextPage
              })

              draftChatState.projectChats = body.chats
              draftChatState.paginationState = chatPaginationState
              finishLoading(draftChatState.asyncEntityState)
            },
            true,
            'assistant/loadProjectChatTitle:done'
          )
        } else {
          const body = await resp.json()
          log('error ', body)
          throw new Error(body.message)
        }
      } catch (e) {
        log('error', e)
        set(
          (draft) => {
            const draftChatState = draft.assistantSlice.projectChatsState[projectPublicId]
            if (!draftChatState) {
              log('expected draft chat state but not found')
              return
            }
            failLoading(draftChatState.asyncEntityState)
          },
          true,
          'assistant/loadProjectChatTitle:error'
        )
      }
    },
    loadProjectChatMessages: async (chatId, cursor) => {
      const chatMessages = get().assistantSlice.projectChatMessagesState[chatId]
      if (
        chatMessages &&
        (isLoading(chatMessages.asyncEntityState) || isLoaded(chatMessages.asyncEntityState))
      ) {
        return
      }

      set(
        (draft) => {
          const initialEntityState = initialAsyncEntityState()
          startLoading(initialEntityState)
          draft.assistantSlice.projectChatMessagesState[chatId] = {
            projectChatMessages: [],
            asyncEntityState: initialEntityState,
            paginationState: initialPaginationEntityState<ProjectChatMessageCursor>()
          }
        },
        true,
        'assistant/loadProjectChatMessages:start'
      )

      try {
        const resp = await api.assistant.loadChatMessages.$post({
          json: {
            projectChatPublicId: chatId
          }
        })
        if (resp.ok) {
          const body = await resp.json()
          const now = new Date()
          set(
            (draft) => {
              const messagesState = draft.assistantSlice.projectChatMessagesState[chatId]
              if (!messagesState) {
                log('expected messages state but not found')
                return
              }
              const messages = body.messages
              const messagesLen = messages.length

              const messageIds: ProjectChatMessagePublicId[] = []

              const currentIdemKeys = draft.assistantSlice.projectComponentIdempotencyKeys
              for (let i = 0; i < messagesLen; i++) {
                const message = messages[i]

                Object.assign(draft.assistantSlice.chatMessages, {
                  [message.publicId]: message
                })

                messageIds.push(message.publicId)

                const timeIsRecent =
                  differenceInMinutes(now, sqlTimestampToDate(message.createdAt)) <=
                  PROJECT_COMPONENT_IDEMPOTENCY_RECENT_WINDOW
                if (timeIsRecent) {
                  const idempotencyKeys = message.idempotencyKeys
                  const currentKeys = currentIdemKeys[message.publicId] ?? []
                  if (idempotencyKeys) {
                    const idempotencyLen = idempotencyKeys.length
                    for (let x = 0; x < idempotencyLen; x++) {
                      const idemKey = idempotencyKeys[x]

                      if (!currentKeys.includes(idemKey)) {
                        currentKeys.push(idemKey)
                      }
                    }
                  }
                  draft.assistantSlice.projectComponentIdempotencyKeys[message.publicId] = currentKeys
                }
              }

              messagesState.projectChatMessages = messageIds

              finishLoading(messagesState.asyncEntityState)
            },
            true,
            'assistant/loadProjectChatMessages:done'
          )
        } else {
          const body = await resp.json()
          log('error ', resp)
          throw new Error(body.message)
        }
      } catch (e) {
        log('error', e)
        set(
          (draft) => {
            const asyncEntity = draft.assistantSlice.projectChatMessagesState[chatId]?.asyncEntityState
            if (asyncEntity) {
              failLoading(asyncEntity)
            }
          },
          true,
          'assistant/loadProjectChatMessages:error'
        )
      }
    },
    clearPendingInitialMessage(projectPublicId) {
      set(
        (draft) => {
          draft.assistantSlice.pendingInitialMessage[projectPublicId] = null
        },
        true,
        'assistant/clearPendingInitialMessage'
      )
    },
    setChatModel(chatId, model) {
      set(
        (draft) => {
          draft.assistantSlice.chatModels[chatId] = model
        },
        true,
        'assistant/setChatModel'
      )
    }
  }) as AssistantSlice
