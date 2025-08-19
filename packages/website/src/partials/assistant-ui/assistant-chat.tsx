'use client'

import {useEffect, useState} from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from '@/components/ai-elements/conversation'
import {Message, MessageContent} from '@/components/ai-elements/message'
import {toast} from 'sonner'
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
  PromptInputTools
} from '@/components/ai-elements/prompt-input'
import {useChat} from '@ai-sdk/react'
import {Response} from '@/components/ai-elements/response'
import {CopyIcon, GlobeIcon, RefreshCcwIcon} from 'lucide-react'
import {Source, Sources, SourcesContent, SourcesTrigger} from '@/components/ai-elements/source'
import {Reasoning, ReasoningContent, ReasoningTrigger} from '@/components/ai-elements/reasoning'
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
import {useProjectStore} from '@/store/use-project-store'
import debug from 'debug'
import api from '@/lib/api-client'
import {convertChatMessageToUIMessage, isDataKey, isToolKey, type SLUIMessage} from './chat-message-schema'
import {Action, Actions} from '@/components/ai-elements/actions'
import {Tool, ToolContent, ToolHeader, ToolOutput, ToolInput} from '@/components/ai-elements/tool'

const log = debug('app:assistant-chat')

const models = [
  {
    name: 'Small',
    value: 'small'
  },
  {
    name: 'Medium',
    value: 'medium'
  },
  {
    name: 'Large',
    value: 'Large'
  }
]

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
  const chatMessages = useProjectStore((state) => state.assistantSlice.chatMessages)
  const fetchProjectChatMessage = useProjectStore((state) => state.assistantSlice.fetchProjectChatMessage)
  const loadProjectChatTitle = useProjectStore((state) => state.assistantSlice.loadProjectChatTitle)
  const reloadProjectCommit = useProjectStore((state) => state.extractorSlice.reloadProjectCommit)
  const pendingInitialMessage = useProjectStore(
    (state) => state.assistantSlice.pendingInitialMessage[projectPublicId]
  )

  const editorSliceActiveTab = useProjectStore((state) => state.editorSlice.activeTab)

  const [input, setInput] = useState('')
  const [model, setModel] = useState<string>(models[2].value)
  // const [webSearch, setWebSearch] = useState(false)

  const initialMessages = initialMessageIds.map((messageId) => {
    const message = chatMessages[messageId]
    if (!message) {
      throw new Error('unknown condition message not found')
    }
    return convertChatMessageToUIMessage(message)
  })

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
  } = useChat<SLUIMessage>({
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
    // onError(err) {
    //   log('onError', err)
    //   // toast.error(err.message)
    //   // clearError()
    // },
    onFinish(opts) {
      log('onFinish', opts)
      if (opts.message.id) {
        // Fetch the message which will trigger schema sync if needed
        nowait(fetchProjectChatMessage(selectedChat, opts.message.id as ProjectChatMessagePublicId))

        // Check if message contains any write tool calls that completed successfully
        const hasWriteToolCall = opts.message.parts.some((part) => {
          // Check for any write tool completion
          if (
            (part.type === 'tool-writeSchema' || part.type === 'tool-writeScript') &&
            part.state === 'output-available'
          ) {
            log(`Found successful tool call in message part:`, part)
            return true
          }
          return false
        })

        if (hasWriteToolCall) {
          log('Detected write tool call in message, reloading project commit...')
          // Use queueMicrotask to avoid updating state during render
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
  //   log('messages: ', messages)

  //   // Update tool call states in the store
  //   messages.forEach(message => {
  //     updateToolCallsFromMessage(message)
  //   })
  // }, [messages])

  // Monitor for schema update completions
  // useEffect(() => {
  //   const cleanup = monitorSchemaUpdates(messages, (filename, version) => {
  //     log('Schema update completed:', filename, version)
  //     // TODO: Trigger backend sync to reload schema
  //     // For now, just log that we detected the completion
  //     log('Would trigger schema reload for:', projectPublicId, filename, version)
  //   })

  //   return cleanup
  // }, [messages, projectPublicId])

  useEffect(() => {
    if (chatError) {
      // log('error', error)
      // Get the last message
      const lastMessage = messages[messages.length - 1]

      // Check if last message is an empty assistant message
      if (lastMessage.role === 'assistant' && lastMessage.parts.length === 0) {
        // Update the last message to show error
        const updatedMessages: SLUIMessage[] = [
          ...messages.slice(0, -1),
          {
            ...lastMessage,
            metadata: {
              error: true
            },
            parts: [
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
    }
  }, [messages, setMessages, clearError, chatError])

  // Handle automatic initial message submission when chat is first loaded with a pending message
  useEffect(() => {
    if (pendingInitialMessage === selectedChat && status === 'ready' && initialMessageIds.length === 1) {
      log('Initiating initial message submission')

      // Use the promise-based approach with callback to ensure idempotency
      nowait(
        assistantPendingInitialMessageAwait(projectPublicId, selectedChat, () => {
          // This callback is guaranteed to be called only once by the await function
          log('Sending initial message after state confirmation', initialMessageIds)
          nowait(sendMessage({messageId: initialMessageIds[0], files: []}))
        })
      )
    }
  }, [initialMessageIds, pendingInitialMessage, projectPublicId, selectedChat, sendMessage, status])

  const handleSubmitMessage = async (prompt: string) => {
    log('handling subsequent message submit')
    if (status !== 'ready') {
      return
    }
    if (input.trim()) {
      setInput('')
      await sendMessage({text: prompt})
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
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
              <div key={message.id}>
                {/* {message.role === 'assistant' && (
                  <Sources>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'source-url':
                          return (
                            <>
                              <SourcesTrigger
                                count={message.parts.filter((part_) => part_.type === 'source-url').length}
                              />
                              <SourcesContent key={`${message.id}-${i}`}>
                                <Source
                                  key={`${message.id}-${i}`}
                                  href={part.url}
                                  title={part.url}
                                />
                              </SourcesContent>
                            </>
                          )
                        default: {
                          return <></>
                        }
                      }
                    })}
                  </Sources>
                )} */}
                <Message
                  from={message.role}
                  key={message.id}
                >
                  {/* <div> */}
                  <MessageContent data-error={message.metadata?.error}>
                    {/* Use aggregator for tool calls in assistant messages */}
                    {/* {message.role === 'assistant' && (
                      <ToolCallAggregator
                        message={message}
                        messageIndex={messageIndex}
                        chatId={selectedChat}
                      />
                    )} */}

                    {/* Render non-tool parts */}
                    {message.parts.map((part, i) => {
                      const type = part.type
                      switch (true) {
                        case isDataKey(type): {
                          if (type === 'data-error') {
                            return <Response key={`${message.id}-${i}`}>{part.data}</Response>
                          }
                          return null
                        }
                        case isToolKey(type): {
                          if (
                            type === 'tool-ping' ||
                            type === 'tool-readSchema' ||
                            type === 'tool-writeSchema' ||
                            type === 'tool-readScript' ||
                            type === 'tool-writeScript'
                          ) {
                            // console.log('tool', type, part.toolCallId, part.state)
                            return (
                              <Tool
                                defaultOpen={false}
                                key={`${message.id}-${i}`}
                              >
                                <ToolHeader
                                  type={type}
                                  state={part.state}
                                />
                                <ToolContent>
                                  <ToolInput input={part.input} />
                                  <ToolOutput
                                    output={<Response>{JSON.stringify(part.output)}</Response>}
                                    errorText={part.errorText}
                                  />
                                </ToolContent>
                              </Tool>
                            )
                          }

                          return null
                        }
                        case type === 'file': {
                          return null
                        }
                        case type === 'dynamic-tool': {
                          return null
                        }
                        case type === 'source-url': {
                          return null
                        }
                        case type === 'source-document': {
                          return null
                        }
                        case type === 'step-start': {
                          return null
                        }
                        case type === 'text':
                          return <Response key={`${message.id}-${i}`}>{part.text}</Response>
                        case type === 'reasoning':
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className='w-full'
                              isStreaming={status === 'streaming'}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          )
                        default: {
                          const _exhaustive: never = type
                          return null
                        }
                      }
                    })}
                    {/* {message.role === 'assistant' && messageIndex === messages.length - 1 && (
                      <Actions className='mt-2'>
                        <Action
                          onClick={() => {
                            nowait(regenerate())
                          }}
                          label='Retry'
                        >
                          <RefreshCcwIcon className='size-3' />
                        </Action>
                        <Action
                          onClick={() => {
                            nowait(globalThis.navigator.clipboard.writeText(part.text))
                          }}
                          label='Copy'
                        >
                          <CopyIcon className='size-3' />
                        </Action>
                      </Actions>
                    )} */}
                  </MessageContent>
                </Message>
              </div>
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
                  setModel(value)
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model_) => (
                    <PromptInputModelSelectItem
                      key={model_.value}
                      value={model_.value}
                    >
                      {model_.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}
