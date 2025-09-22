'use client'

import * as React from 'react'
import debug from 'debug'
import { Copy, FileCode2 } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { TextViewer } from '@/partials/monaco-editor/text-viewer'
import { useStore } from '@/store/use-store'

const log = debug('app:tab-crawler-script')

export function TabCrawlerScript() {
  const [copied, setCopied] = React.useState(false)

  // Get project and crawlers from store
  const projectPublicId = useStore((state) => state.projectSlice.project?.project.publicId)
  const loadCrawlers = useStore((state) => state.extractorSlice.loadCrawlers)
  const projectCrawlers = useStore((state) => state.extractorSlice.projectCrawlers)

  // Derive crawlers from projectCrawlers
  const crawlers = projectPublicId ? projectCrawlers[projectPublicId]?.crawlers ?? null : null

  // Get the active crawler version from project commit
  const activeCrawlerVersion = useStore(
    (state) => state.extractorSlice.projectCommit?.activeCrawlerVersion
  )

  // Get the active crawler from the reactive crawlers array
  const currentCrawler = React.useMemo(() => {
    if (!crawlers || !activeCrawlerVersion) {
      return null
    }
    return crawlers.find((e) => e.version === activeCrawlerVersion) ?? null
  }, [crawlers, activeCrawlerVersion])

  // Load crawlers on mount if not already loaded
  React.useEffect(() => {
    if (projectPublicId) {
      loadCrawlers(projectPublicId).catch((err: unknown) => {
        log('Error loading crawlers:', err)
      })
    }
  }, [projectPublicId, loadCrawlers])

  const scriptContent = currentCrawler?.script

  const handleCopy = () => {
    if (scriptContent) {
      nowait(globalThis.navigator.clipboard.writeText(scriptContent))
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Show empty state if no script content
  if (!scriptContent) {
    return (
      <EmptyStateData
        icon={FileCode2}
        title='No Crawler Script'
        description='No crawler script has been defined yet'
        details='Use the AI assistant to generate a crawler script to discover pages'
      />
    )
  }

  return (
    <div className='relative flex h-full flex-col bg-[#0D1117]'>
      <div className='absolute right-4 top-4 z-10 flex items-center gap-2'>
        {currentCrawler.version && (
          <span className='rounded bg-white/10 px-2 py-1 text-xs text-white/60'>
            v{currentCrawler.version}
          </span>
        )}
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
          textData={scriptContent}
          lang='js'
        />
      </div>
    </div>
  )
}

