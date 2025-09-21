'use client'

import * as React from 'react'
import debug from 'debug'
import { ChevronLeft, MessageSquare, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useStore } from '@/store/use-store'

import { AssistantChatHistory } from './assistant-chat-history'
import { AssistantChatLoader } from './assistant-chat-loader'

const log = debug('app:assistant-panel')

interface AssistantPanelProps {}

export function AssistantPanel() {
  const project = useStore((state) => state.projectSlice.project?.project)
  const assistantPanelView = useStore((state) => state.editorSlice.assistantPanelView)
  const setAssistantPanelView = useStore((state) => state.editorSlice.setAssistantPanelView)

  const projectPublicId = project?.publicId
  if (!projectPublicId) {
    log('expected project public id not found!')
    return null
  }

  // Get the view for this project, default to 'conversation' if not set
  const view = assistantPanelView[projectPublicId] ?? 'conversation'

  return (
    <div className='flex h-full flex-col border-l border-white/10 bg-[#151517]'>
      {/* Header */}
      <div className='flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 px-4'>
        <div className='flex items-center gap-2'>
          <Sparkles className='h-4 w-4 text-blue-500' />
          <h2 className='font-medium text-white'>AI Assistant</h2>
        </div>
        <div className='flex items-center gap-2'>
          {view === 'chat-history' ? (
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-white/60 hover:bg-white/10 hover:text-white'
              onClick={() => {
                setAssistantPanelView('conversation')
              }}
            >
              <ChevronLeft className='h-4 w-4' />
              <span className='ml-1 text-xs'>Back</span>
            </Button>
          ) : (
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-white/60 hover:bg-white/10 hover:text-white'
              onClick={() => {
                setAssistantPanelView('chat-history')
              }}
            >
              <MessageSquare className='h-4 w-4' />
              <span className='ml-1 text-xs'>Chats</span>
            </Button>
          )}
        </div>
      </div>

      {/* Context Bar (optional) */}
      {/* {projectPublicId && (
        <div className='flex-shrink-0 border-b border-white/10 bg-[#0A0A0B] px-4 py-3'>
          <div className='mb-1 text-xs text-white/60'>Project:</div>
          <div className='truncate font-mono text-sm text-white/80'>{project.name}</div>
        </div>
      )} */}

      {/* Main Content */}
      <div className='flex-1 overflow-hidden'>
        {view === 'chat-history' ? <AssistantChatHistory /> : <AssistantChatLoader />}
      </div>
    </div>
  )
}
