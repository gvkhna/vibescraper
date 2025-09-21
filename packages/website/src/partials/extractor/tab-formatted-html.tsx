'use client'

import * as React from 'react'
import { Copy, FileCode2 } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { TextViewer } from '@/partials/monaco-editor/text-viewer'
import { useStore } from '@/store/use-store'

export function TabFormattedHtml() {
  const [copied, setCopied] = React.useState(false)

  // Get cached formatted HTML from project store
  const cachedData = useStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const formattedHtmlContent = cachedData?.formattedHtml

  const handleCopy = () => {
    // Copy formatted HTML if available, otherwise copy raw HTML
    const contentToCopy = formattedHtmlContent
    if (contentToCopy) {
      nowait(globalThis.navigator.clipboard.writeText(contentToCopy))
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Show empty state if no HTML content
  if (!formattedHtmlContent) {
    return (
      <EmptyStateData
        icon={FileCode2}
        title='No HTML Content'
        description='Run a scrape operation to view the formatted HTML'
        details='Click the "Scrape" button to fetch the webpage content'
      />
    )
  }

  return (
    <div className='relative flex h-full flex-col bg-[#0D1117]'>
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
      <div className='flex-1'>
        <TextViewer
          textData={formattedHtmlContent}
          lang='html'
        />
      </div>
    </div>
  )
}
