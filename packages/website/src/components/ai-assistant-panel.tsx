'use client'

import * as React from 'react'
import {useChat} from '@ai-sdk/react'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Send, Paperclip, Sparkles, PanelRightClose} from 'lucide-react'
import {Conversation} from '@/components/ai-elements/conversation'
import {Message} from '@/components/ai-elements/message'
import {Suggestions, Suggestion} from '@/components/ai-elements/suggestion'
import {Loader} from '@/components/ai-elements/loader'
import {Chat} from './chat'

interface AIAssistantPanelProps {
  currentUrl: string
  onClose: () => void
}

export function AIAssistantPanel({currentUrl, onClose}: AIAssistantPanelProps) {
  const [input, setInput] = React.useState('')
  // const {messages, sendMessage, status} = useChat({
  //   body: {
  //     currentUrl
  //   },
  //   initialMessages: [
  //     {
  //       id: 'welcome',
  //       role: 'assistant' as const,
  //       parts: [{type: 'text', text: 'I can see the current page content. What would you like to extract?'}]
  //     }
  //   ]
  // })

  // const isLoading = status === 'streaming'

  // const handleSuggestionClick = async (suggestion: string) => {
  //   await sendMessage({
  //     text: suggestion
  //   })
  // }

  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()
  //   if (!input.trim() || isLoading) {
  //     return
  //   }

  //   const message = input
  //   setInput('')
  //   await sendMessage({
  //     text: message
  //   })
  // }

  // const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  //   if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
  //     e.preventDefault()
  //     const form = e.currentTarget.form
  //     if (form) {
  //       form.requestSubmit()
  //     }
  //   }
  // }

  return (
    <div className='flex h-full flex-col border-l border-white/10 bg-[#151517]'>
      {/* Header */}
      <div className='flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 px-4'>
        <div className='flex items-center gap-2'>
          <Sparkles className='h-5 w-5 text-blue-500' />
          <h2 className='font-medium'>AI Assistant</h2>
        </div>
        {/* Hide button moved to MainContentArea */}
      </div>

      {/* Context */}
      <div className='flex-shrink-0 border-b border-white/10 bg-[#0A0A0B] px-4 py-3'>
        <div className='mb-1 text-xs text-white/60'>Analyzing:</div>
        <div className='truncate font-mono text-sm text-white/80'>{currentUrl}</div>
      </div>

      <Chat />

      {/* Messages */}
      {/* <ScrollArea className='flex-1'> */}
      {/* <div className='p-4'>
          <Conversation>
            {messages.map((message) => (
              <Message
                key={message.id}
                from={message.role}
              >
                <div>
                  {message.parts.map((part, partIndex) =>
                    part.type === 'text' ? <span key={partIndex}>{part.text}</span> : null
                  )}
                  {message.role === 'assistant' && !isLoading && (
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <Button
                        variant='secondary'
                        size='sm'
                        className='border-white/10 bg-white/10 text-xs hover:bg-white/20'
                      >
                        Create Schema
                      </Button>
                      <Button
                        variant='secondary'
                        size='sm'
                        className='border-white/10 bg-white/10 text-xs hover:bg-white/20'
                      >
                        Test Extraction
                      </Button>
                    </div>
                  )}
                </div>
              </Message>
            ))}
            {isLoading && (
              <div className='flex justify-start'>
                <div className='rounded-lg border border-white/10 bg-[#0A0A0B] p-3'>
                  <Loader size={12} />
                  <span className='ml-2 text-sm text-white/60'>Analyzing page...</span>
                </div>
              </div>
            )}
          </Conversation>
        </div> */}
      {/* </ScrollArea> */}

      {/* Quick Actions & Input */}
      {/* <div className='flex-shrink-0 border-t border-white/10 px-4 py-2'>
        {messages.length === 1 && !isLoading && (
          <div className='mb-3'>
            <Suggestions>
              <Suggestion
                suggestion='Extract data from this page'
                onClick={handleSuggestionClick}
              >
                Extract data from this page
              </Suggestion>
              <Suggestion
                suggestion='Generate CSS selectors'
                onClick={handleSuggestionClick}
              >
                Generate CSS selectors
              </Suggestion>
              <Suggestion
                suggestion='Suggest improvements'
                onClick={handleSuggestionClick}
              >
                Suggest improvements
              </Suggestion>
              <Suggestion
                suggestion='Create scraping schema'
                onClick={handleSuggestionClick}
              >
                Create scraping schema
              </Suggestion>
            </Suggestions>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className='flex gap-2'
        >
          <div className='relative flex-1'>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder='Ask me anything about extracting data...'
              className='min-h-[60px] resize-none border-white/20 bg-[#0A0A0B] pr-10'
              rows={2}
              disabled={isLoading}
            />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='absolute right-2 top-2 h-6 w-6 text-white/60 hover:bg-white/10'
            >
              <Paperclip className='h-4 w-4' />
            </Button>
          </div>
          <Button
            type='submit'
            disabled={!input.trim() || isLoading}
            className='self-end bg-[#3B82F6] hover:bg-[#3B82F6]/80'
          >
            <Send className='h-4 w-4' />
          </Button>
        </form>
        <div className='mt-2 text-xs text-white/40'>Ctrl+Enter to send</div>
      </div> */}
    </div>
  )
}
