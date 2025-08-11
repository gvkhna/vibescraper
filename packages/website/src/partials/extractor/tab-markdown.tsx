'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Copy} from 'lucide-react'
import {nowait} from '@/lib/async-utils'

export function TabMarkdown() {
  const [copied, setCopied] = React.useState(false)
  
  // Placeholder content for now
  const content = `# ACME Widget

**Price:** $19.99

High-quality widget for all your needs.

## Features
- Durable construction
- Easy to use
- 1-year warranty`

  const handleCopy = () => {
    nowait(globalThis.navigator.clipboard.writeText(content))
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className='relative h-full bg-[#0D1117]'>
      <div className='absolute right-4 top-4 z-10'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCopy}
          className='bg-white/10 text-white hover:bg-white/20'
        >
          <Copy className='h-4 w-4' />
          {copied && <span className='ml-2 text-xs'>Copied!</span>}
        </Button>
      </div>
      <ScrollArea className='h-full'>
        <pre className='p-6 font-mono text-sm leading-relaxed text-gray-300'>
          <code>{content}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}