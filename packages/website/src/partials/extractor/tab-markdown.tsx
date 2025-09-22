'use client'

import * as React from 'react'
import { Copy, FileType2 } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { TextViewer } from '@/partials/monaco-editor/text-viewer'
import { useStore } from '@/store/use-store'

export function TabMarkdown() {
  const [copied, setCopied] = React.useState(false)

  // Get cached markdown from project store
  const cachedData = useStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const content = cachedData?.markdown ?? ''

  const handleCopy = () => {
    if (content) {
      nowait(globalThis.navigator.clipboard.writeText(content))
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Show empty state if no markdown content
  if (!content) {
    return (
      <EmptyStateData
        icon={FileType2}
        title='No Markdown Content'
        description='Run extraction to view markdown'
        details='Markdown converts HTML content into clean, readable text format'
      />
    )
  }

  return (
    <div className='relative flex h-full flex-col bg-[#0D1117]'>
      <div className='absolute top-4 right-4 z-10'>
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
      <div className='flex-1'>
        <TextViewer
          textData={content}
          lang='md'
        />
      </div>
    </div>
  )
}
