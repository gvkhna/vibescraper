'use client'

import React, {Fragment, useEffect, useState} from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from '@/components/ai-elements/conversation'
import {toast} from 'sonner'
import {Action, Actions} from '@/components/ai-elements/actions'
import {CopyIcon, GlobeIcon, RefreshCcwIcon} from 'lucide-react'
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  type PromptInputMessage
} from '@/components/ai-elements/prompt-input'
import {useChat} from '@ai-sdk/react'
import {Loader} from '@/components/ai-elements/loader'
import {nowait} from '@/lib/async-utils'
import {assistantPendingInitialMessageAwait} from './assistant-pending-initial-message-await'
import {DefaultChatTransport} from 'ai'
import type {
  ProjectPublicId,
  ProjectCommitPublicId,
  ProjectChatPublicId,
  ProjectChatDTOType,
  ProjectChatMessagePublicId
} from '@/db/schema'
import {useStore} from '@/store/use-store'
import debug from 'debug'
import api from '@/lib/api-client'
import {convertChatMessageToUIMessage, type VSUIMessage} from './chat-message-schema'
import {Message, MessageContent} from '@/components/ai-elements/message'
import {AssistantChatMessagePart} from './assistant-chat-message-part'

const log = debug('app:assistant-chat')

export interface AssistantChatProps {
  projectPublicId: ProjectPublicId
  projectCommitPublicId: ProjectCommitPublicId
  selectedChat: ProjectChatPublicId
  projectChat: ProjectChatDTOType
  initialMessageIds: ProjectChatMessagePublicId[]
}

export function AssistantChat({
  projectPublicId,
  projectCommitPublicId,
  selectedChat,
  projectChat,
  initialMessageIds
}: AssistantChatProps) {
  const chatMessages = useStore((state) => state.assistantSlice.chatMessages)
  const fetchProjectChatMessage = useStore((state) => state.assistantSlice.fetchProjectChatMessage)
  const syncProjectChatMessages = useStore((state) => state.assistantSlice.syncProjectChatMessages)
  const loadProjectChatTitle = useStore((state) => state.assistantSlice.loadProjectChatTitle)
  const reloadProjectCommit = useStore((state) => state.extractorSlice.reloadProjectCommit)
  const pendingInitialMessage = useStore(
    (state) => state.assistantSlice.pendingInitialMessage[projectPublicId]
  )

  const editorSliceActiveTab = useStore((state) => state.editorSlice.activeTab)

  // Models from store with auto-fetch
  const models = useStore((state) => state.modelsSlice.models)
  const fetchModels = useStore((state) => state.modelsSlice.fetchModels)

  // Chat-specific model selection
  const chatModel = useStore((state) => state.assistantSlice.chatModels[selectedChat])
  const setChatModel = useStore((state) => state.assistantSlice.setChatModel)
  const model = chatModel ?? 'medium'

  const [input, setInput] = useState('')
  // const [webSearch, setWebSearch] = useState(false)

  const initialMessages = initialMessageIds.map((messageId) => {
    const message = chatMessages[messageId]
    if (!message) {
      throw new Error('unknown condition message not found')
    }
    return convertChatMessageToUIMessage(message)
  })

  log('initial messages', initialMessages)

  // Auto-fetch models on component mount
  useEffect(() => {
    nowait(fetchModels())
  }, [fetchModels])

  const chatEndpoint = api.assistant.extractorChat.$url().pathname

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
    regenerate,
    clearError,
    stop,
    setMessages,
    addToolResult
  } = useChat<VSUIMessage>({
    id: selectedChat,
    transport: new DefaultChatTransport({
      api: chatEndpoint,
      prepareSendMessagesRequest: ({messages: sendMessages, trigger}) => {
        const lastMessage = sendMessages.slice(-1)
        return {
          body: {
            messages: lastMessage,
            trigger,
            model,
            // webSearch,
            projectChatPublicId: selectedChat,
            projectPublicId: projectPublicId,
            projectCommitPublicId: projectCommitPublicId
          }
        }
      }
    }),
    messages: initialMessages,
    onData(dataPart) {
      log('onData', dataPart)
      // log('resp:', response)
      // if (props.initialMessages.length === 0) {
      //   log('starting new chat kicking off reloading')
      //   // this means we received a response when the chat was initially empty
      //   // so we can just trigger an api request to generate a title
      //   queueMicrotask(() => {
      //     nowait(loadProjectChatTitle(props.projectPublicId, props.projectChat.publicId))
      //   })
      // }
    },
    onFinish(opts) {
      log('onFinish', opts)

      const chatMessageIds = opts.messages.map((m) => m.id) as ProjectChatMessagePublicId[]
      if (opts.message.metadata?.replyMessageId) {
        chatMessageIds.push(opts.message.metadata.replyMessageId as ProjectChatMessagePublicId)
      }
      nowait(syncProjectChatMessages(selectedChat, chatMessageIds))

      if (opts.isError && opts.message.role === 'assistant') {
        const lastMessage = opts.message
        const updatedMessages: VSUIMessage[] = [
          ...opts.messages.slice(0, -1),
          {
            ...lastMessage,
            metadata: {
              error: true
            },
            parts: [
              ...lastMessage.parts,
              {
                type: 'text',
                text: 'There was an unexpected error. Please try again.'
              }
            ]
          }
        ]

        setMessages(updatedMessages)
        clearError()
      }

      if (opts.message.id) {
        // Fetch the message which will trigger schema sync if needed
        // nowait(fetchProjectChatMessage(selectedChat, opts.message.id as ProjectChatMessagePublicId))

        // Check if message contains any write tool calls that completed successfully
        const hasWriteToolCall = opts.message.parts.some((part) => {
          // Check for any write tool completion
          if (
            (part.type === 'tool-schemaSet' || part.type === 'tool-scriptSet') &&
            part.state === 'output-available'
          ) {
            log(`Found successful tool call in message part:`, part)
            return true
          }
          return false
        })

        if (hasWriteToolCall) {
          log('Detected write tool call in message, reloading project commit...')
          queueMicrotask(() => {
            reloadProjectCommit(projectCommitPublicId).catch((err: unknown) => {
              log('Error reloading project commit after write tool call:', err)
            })
          })
        }
      }
    },
    onToolCall(opts) {
      log('onToolCall', opts)
    }
  })

  useEffect(() => {
    log('use chat status', status)
  }, [status])

  // useEffect(() => {
  //   if (chatError) {
  //     log('error', chatError)
  //     // Get the last message
  //     const lastMessage = messages[messages.length - 1]

  //     // Check if last message is an error message
  //     if (lastMessage.role === 'assistant' && lastMessage.metadata?.error === true) {
  //       // Update the last message to show error
  //       const updatedMessages: VSUIMessage[] = [
  //         ...messages.slice(0, -1),
  //         {
  //           ...lastMessage,
  //           parts: [
  //             ...lastMessage.parts,
  //             {
  //               type: 'text',
  //               text: 'There was an unexpected error. Please try again.'
  //             }
  //           ]
  //         }
  //       ]

  //       setMessages(updatedMessages)
  //       clearError()
  //     }
  //   }
  // }, [messages, setMessages, clearError, chatError, regenerate])

  // Handle automatic initial message submission when chat is first loaded with a pending message
  useEffect(() => {
    if (pendingInitialMessage === selectedChat && status === 'ready' && initialMessageIds.length === 1) {
      log('Initiating initial message submission')

      // Use the promise-based approach with callback to ensure idempotency
      nowait(
        assistantPendingInitialMessageAwait(projectPublicId, selectedChat, () => {
          // This callback is guaranteed to be called only once by the await function
          log('Sending initial message after state confirmation', initialMessageIds)
          const initialMessage = chatMessages[initialMessageIds[0]]
          if (initialMessage) {
            const message = convertChatMessageToUIMessage(initialMessage)
            nowait(sendMessage({messageId: initialMessageIds[0], ...message}))
          }
        })
      )
    }
  }, [
    chatMessages,
    initialMessageIds,
    pendingInitialMessage,
    projectPublicId,
    selectedChat,
    sendMessage,
    status
  ])

  const handleSubmitMessage = async (prompt: string) => {
    log('handling subsequent message submit')
    if (status === 'streaming') {
      nowait(stop())
    } else if (status === 'error') {
      clearError()
    } else if (status === 'submitted') {
      // loading do nothing
    } else {
      // ready
      if (input.trim()) {
        setInput('')
        await sendMessage({text: prompt})
      }
    }
  }

  const handleFormSubmit = (message: PromptInputMessage, e: React.FormEvent) => {
    e.preventDefault()
    nowait(handleSubmitMessage(input))
    return false
  }

  return (
    <div className='relative mx-auto size-full h-full max-w-4xl p-2'>
      <div className='flex h-full flex-col'>
        <Conversation className='h-full'>
          <ConversationContent>
            {messages.map((message, messageIndex) => (
              <Fragment key={message.id}>
                {message.role === 'user' && (
                  <Message from={message.role}>
                    <MessageContent>
                      {message.parts
                        .filter((m) => m.type === 'text')
                        .map((part, i) => (
                          <div key={`${message.id}-${i}`}>{part.text}</div>
                        ))}
                    </MessageContent>
                  </Message>
                )}
                {message.role === 'assistant' && (
                  <Message
                    from={message.role}
                    className='flex-col items-start gap-0'
                  >
                    <MessageContent
                      data-error={message.metadata?.error}
                      className='is-assistant data-[error=true]:text-foreground data-[error=true]:!bg-red-400'
                    >
                      {message.parts.map((part, i) => (
                        <AssistantChatMessagePart
                          key={`${message.id}-${part.type}-${i}`}
                          message={message}
                          part={part}
                          index={i}
                          status={status}
                        />
                      ))}
                    </MessageContent>
                    <Actions className='mt-2'>
                      <Action
                        onClick={() => {
                          nowait(regenerate({messageId: message.id}))
                          toast('Regenerating message...')
                        }}
                        label='Regenerate'
                      >
                        <RefreshCcwIcon className='size-3' />
                      </Action>
                      <Action
                        onClick={() => {
                          const messageText = message.parts
                            .filter((m) => m.type === 'text')
                            .map((part, i) => part.text)
                            .join('\n')
                          nowait(globalThis.navigator.clipboard.writeText(messageText))
                          toast('Message Copied')
                        }}
                        label='Copy'
                      >
                        <CopyIcon className='size-3' />
                      </Action>
                    </Actions>
                  </Message>
                )}
              </Fragment>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={handleFormSubmit}
          className='mt-4'
        >
          <PromptInputTextarea
            onChange={(e) => {
              setInput(e.target.value)
            }}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              {/* <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => {
                  setWebSearch(!webSearch)
                }}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton> */}
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setChatModel(selectedChat, value)
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((m) => (
                    <PromptInputModelSelectItem
                      key={m.value}
                      value={m.value}
                    >
                      {m.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input && !status}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}
