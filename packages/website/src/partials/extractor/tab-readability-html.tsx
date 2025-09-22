'use client'

import * as React from 'react'
import { BookOpen, Copy } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { TextViewer } from '@/partials/monaco-editor/text-viewer'
import { useStore } from '@/store/use-store'

export function TabReadabilityHtml() {
  const [copied, setCopied] = React.useState(false)

  // Get cached readability result from project store
  const cachedData = useStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const readabilityResult = cachedData?.readabilityResult
  const readabilityContent = readabilityResult?.content ?? null

  const handleCopy = () => {
    if (readabilityContent) {
      nowait(globalThis.navigator.clipboard.writeText(readabilityContent))
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Show empty state if no readability content
  if (!readabilityContent) {
    return (
      <EmptyStateData
        icon={BookOpen}
        title='No Readability Content'
        description='Run extraction to view article content'
        details='Readability extracts the main article content in a clean format'
      />
    )
  }

  return (
    <div className='relative flex h-full flex-col bg-[#0D1117]'>
      <div className='absolute top-4 right-4 z-10 flex gap-2'>
        {/* {readabilityResult?.title && (
          <div className='rounded bg-white/10 px-3 py-1 text-sm text-white'>
            {readabilityResult.title}
          </div>
        )} */}
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
          textData={readabilityContent}
          lang='html'
        />
      </div>
      {/* {readabilityResult && (
        <div className='border-t border-white/10 bg-[#0A0A0B] p-3'>
          <div className='flex flex-wrap gap-4 text-xs text-gray-400'>
            {readabilityResult.byline && (
              <div>
                <span className='font-semibold'>Author:</span> {readabilityResult.byline}
              </div>
            )}
            {readabilityResult.siteName && (
              <div>
                <span className='font-semibold'>Site:</span> {readabilityResult.siteName}
              </div>
            )}
            {readabilityResult.length !== null && (
              <div>
                <span className='font-semibold'>Length:</span> {readabilityResult.length} chars
              </div>
            )}
            {readabilityResult.lang && (
              <div>
                <span className='font-semibold'>Language:</span> {readabilityResult.lang}
              </div>
            )}
          </div>
          {readabilityResult.excerpt && (
            <div className='mt-2 text-xs text-gray-500'>
              <span className='font-semibold'>Excerpt:</span> {readabilityResult.excerpt}
            </div>
          )}
        </div>
      )} */}
    </div>
  )
}
