'use client'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from '@/components/ai-elements/conversation'
import {Message, MessageContent} from '@/components/ai-elements/message'
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
// import {Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger} from '@/components/ai-elements/task'
import {useState} from 'react'
import {useChat} from '@ai-sdk/react'
import {Response} from '@/components/ai-elements/response'
import {GlobeIcon} from 'lucide-react'
import {Source, Sources, SourcesContent, SourcesTrigger} from '@/components/ai-elements/source'
import {Reasoning, ReasoningContent, ReasoningTrigger} from '@/components/ai-elements/reasoning'
import {Loader} from '@/components/ai-elements/loader'
import {nowait} from '@/lib/async-utils'
import {DefaultChatTransport} from 'ai'

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o'
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1'
  }
]

export function Chat() {
  const [input, setInput] = useState('')
  const [model, setModel] = useState<string>(models[0].value)
  const [webSearch, setWebSearch] = useState(false)
  const {messages, sendMessage, status} = useChat({
    transport: new DefaultChatTransport({
      api: '/api/assistant/chat',
      prepareSendMessagesRequest: ({id, messages: sendMessages, trigger, messageId}) => {
        const lastMessage = sendMessages.slice(-1)
        console.log(lastMessage)
        return {
          // headers: {
          //   'X-Session-ID': id
          // },
          body: {
            // Only send last message
            messages: lastMessage,
            trigger
          }
        }
      }
    })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      nowait(
        sendMessage(
          {text: input}
          // {
          //   body: {
          //     model: model
          //     // webSearch: webSearch
          //   }
          // }
        )
      )
      setInput('')
    }
  }

  return (
    <div className='relative mx-auto size-full h-screen max-w-4xl p-2'>
      <div className='flex h-full flex-col'>
        <Conversation className='h-full'>
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && (
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
                )}
                <Message
                  from={message.role}
                  key={message.id}
                >
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return <Response key={`${message.id}-${i}`}>{part.text}</Response>
                        case 'reasoning':
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
                        default:
                          return null
                      }
                    })}
                  </MessageContent>
                </Message>
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={handleSubmit}
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
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => {
                  setWebSearch(!webSearch)
                }}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
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
