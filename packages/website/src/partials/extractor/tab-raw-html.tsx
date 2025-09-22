'use client'

import * as React from 'react'
import { Code, Copy } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { TextViewer } from '@/partials/monaco-editor/text-viewer'
import { useStore } from '@/store/use-store'

export function TabRawHtml() {
  const [copied, setCopied] = React.useState(false)

  // Get cached HTML from project store
  const cachedData = useStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const htmlContent = cachedData?.html

  const handleCopy = () => {
    if (htmlContent) {
      nowait(globalThis.navigator.clipboard.writeText(htmlContent))
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Show empty state if no HTML content
  if (!htmlContent) {
    return (
      <EmptyStateData
        icon={Code}
        title='No HTML Content'
        description='Run a scrape operation to view the raw HTML'
        details='Click the "Scrape" button to fetch the webpage content'
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
          textData={htmlContent}
          lang='html'
        />
      </div>

      {/* Original text view - commented out for now */}
      {/* <ScrollArea className='h-full'>
        <pre className='p-6 font-mono text-sm leading-relaxed text-gray-300'>
          <code>{htmlContent}</code>
        </pre>
      </ScrollArea> */}
    </div>
  )
}
