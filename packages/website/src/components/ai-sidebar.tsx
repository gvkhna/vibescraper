'use client'

import * as React from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Code,
  Database,
  FileText,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface AISidebarProps {
  currentUrl: string
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AISidebar({ currentUrl, collapsed, onToggleCollapse }: AISidebarProps) {
  const [message, setMessage] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('chat')

  if (collapsed) {
    return (
      <div
        className='flex w-12 flex-shrink-0 flex-col items-center border-l border-white/10 bg-[#151517] py-4'
      >
        <Button
          variant='ghost'
          size='icon'
          onClick={onToggleCollapse}
          className='text-white hover:bg-white/10'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <div className='mt-4'>
          <Sparkles className='h-5 w-5 text-[#3B82F6]' />
        </div>
      </div>
    )
  }

  return (
    <div className='flex w-96 flex-shrink-0 flex-col border-l border-white/10 bg-[#151517]'>
      {/* Header */}
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 px-4'>
        <div className='flex items-center gap-2'>
          <Sparkles className='h-5 w-5 text-[#3B82F6]' />
          <span className='font-medium'>AI Assistant</span>
        </div>
        <div className='flex items-center gap-2'>
          <Badge className='border-[#10B981]/30 bg-[#10B981]/20 text-xs text-[#10B981]'>Online</Badge>
          <Button
            variant='ghost'
            size='icon'
            onClick={onToggleCollapse}
            className='h-8 w-8 text-white hover:bg-white/10'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Context */}
      <div className='flex-shrink-0 border-b border-white/10 bg-[#0A0A0B] px-4 py-3'>
        <div className='mb-1 text-xs text-white/60'>Current context:</div>
        <div className='truncate font-mono text-sm text-white/80'>{currentUrl}</div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='flex flex-1 flex-col'
      >
        <TabsList className='h-12 flex-shrink-0 rounded-none border-b border-white/10 bg-transparent px-4'>
          <TabsTrigger
            value='chat'
            className='gap-2'
          >
            <MessageCircle className='h-4 w-4' />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value='schema'
            className='gap-2'
          >
            <Database className='h-4 w-4' />
            Schema
          </TabsTrigger>
          <TabsTrigger
            value='code'
            className='gap-2'
          >
            <Code className='h-4 w-4' />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value='chat'
          className='m-0 flex flex-1 flex-col'
        >
          <ChatInterface
            message={message}
            onMessageChange={setMessage}
          />
        </TabsContent>

        <TabsContent
          value='schema'
          className='m-0 flex-1 p-4'
        >
          <SchemaEditor />
        </TabsContent>

        <TabsContent
          value='code'
          className='m-0 flex-1 p-4'
        >
          <CodeViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ChatInterface({
  message,
  onMessageChange
}: {
  message: string
  onMessageChange: (message: string) => void
}) {
  const messages = [
    {
      type: 'system',
      content: 'I can see the current page content. What would you like to extract?'
    },
    {
      type: 'user',
      content: 'Extract the product name and price from this page'
    },
    {
      type: 'ai',
      content:
        "I can see a product with the name 'ACME Widget' and price '$19.99'. Would you like me to create a schema for extracting this data?",
      actions: ['Apply this schema', 'Run extraction', 'Test on current page']
    }
  ]

  return (
    <>
      <ScrollArea className='flex-1 px-4'>
        <div className='space-y-4 py-4'>
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
            />
          ))}
        </div>
      </ScrollArea>

      <div className='flex-shrink-0 space-y-3 border-t border-white/10 p-4'>
        {/* Quick Actions */}
        <div className='flex flex-wrap gap-2'>
          {['Extract data', 'Define schema', 'Start crawling', 'Check issues'].map((action) => (
            <Button
              key={action}
              variant='secondary'
              size='sm'
              className='border-white/10 bg-white/10 text-xs hover:bg-white/20'
            >
              {action}
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Textarea
              value={message}
              onChange={(e) => {
                onMessageChange(e.target.value)
              }}
              placeholder='Describe what you want to extract...'
              className='resize-none border-white/20 bg-[#0A0A0B] pr-10'
              rows={2}
            />
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-2 right-2 h-6 w-6 text-white/60 hover:bg-white/10'
            >
              <Paperclip className='h-4 w-4' />
            </Button>
          </div>
          <Button
            size='icon'
            className='self-end bg-[#3B82F6] hover:bg-[#3B82F6]/80'
          >
            <Send className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </>
  )
}

function ChatMessage({
  message
}: {
  message: {
    type: string
    content: string
    actions?: string[]
  }
}) {
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'

  if (isSystem) {
    return <div className='py-2 text-center text-sm text-white/60'>{message.content}</div>
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isUser ? 'border border-[#3B82F6]/30 bg-[#3B82F6]/20' : 'border border-white/10 bg-[#0A0A0B]'
        }`}
      >
        <div className='text-sm leading-relaxed'>{message.content}</div>
        {message.actions && (
          <div className='mt-3 flex flex-wrap gap-2'>
            {message.actions.map((action) => (
              <Button
                key={action}
                variant='secondary'
                size='sm'
                className='border-white/10 bg-white/10 text-xs hover:bg-white/20'
              >
                {action}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SchemaEditor() {
  return (
    <div className='space-y-4'>
      <div className='text-sm font-medium'>Current Schema (v2)</div>
      <div className='rounded-lg border border-white/10 bg-[#0D1117] p-4 font-mono text-sm'>
        <pre className='leading-relaxed text-gray-300'>
          {`{
  "product_name": "string",
  "price": "number", 
  "availability": "boolean",
  "description": "string"
}`}
        </pre>
      </div>
      <div className='flex gap-2'>
        <Button
          size='sm'
          className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'
        >
          Test Schema
        </Button>
        <Button
          size='sm'
          variant='secondary'
          className='border-white/10 bg-white/10 hover:bg-white/20'
        >
          Edit
        </Button>
      </div>
    </div>
  )
}

function CodeViewer() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='text-sm font-medium'>Extraction Code</div>
        <Badge
          variant='secondary'
          className='bg-white/10 text-xs'
        >
          Auto-generated
        </Badge>
      </div>
      <div className='rounded-lg border border-white/10 bg-[#0D1117] p-4 font-mono text-sm'>
        <pre className='leading-relaxed text-gray-300'>
          {`const extractData = (page) => {
  return {
    product_name: page.querySelector('h1')?.textContent,
    price: parseFloat(
      page.querySelector('.price')?.textContent?.replace('$', '')
    ),
    availability: !page.querySelector('.out-of-stock')
  }
}`}
        </pre>
      </div>
      <Button
        size='sm'
        className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'
      >
        Test Code
      </Button>
    </div>
  )
}
