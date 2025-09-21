'use client'

import * as React from 'react'
import debug from 'debug'
import { Copy, FileCode2 } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { TextViewer } from '@/partials/monaco-editor/text-viewer'
import { useStore } from '@/store/use-store'

const log = debug('app:tab-extraction-script')

export function TabExtractionScript() {
  const [copied, setCopied] = React.useState(false)

  // Get project and extractor from store
  const projectPublicId = useStore((state) => state.projectSlice.project?.project.publicId)
  const loadExtractors = useStore((state) => state.extractorSlice.loadExtractors)
  const projectExtractors = useStore((state) => state.extractorSlice.projectExtractors)

  // Derive extractors from projectExtractors
  const extractors = projectPublicId ? projectExtractors[projectPublicId]?.extractors ?? null : null

  // Get the active extractor version from project commit
  const activeExtractorVersion = useStore(
    (state) => state.extractorSlice.projectCommit?.activeExtractorVersion
  )

  // Get the active extractor from the reactive extractors array
  const currentExtractor = React.useMemo(() => {
    if (!extractors || !activeExtractorVersion) {
      return null
    }
    return extractors.find((e) => e.version === activeExtractorVersion) ?? null
  }, [extractors, activeExtractorVersion])

  // Load extractors on mount if not already loaded
  React.useEffect(() => {
    if (projectPublicId) {
      loadExtractors(projectPublicId).catch((err: unknown) => {
        log('Error loading extractors:', err)
      })
    }
  }, [projectPublicId, loadExtractors])

  const scriptContent = currentExtractor?.script

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
        title='No Extractor Script'
        description='No extractor script has been defined yet'
        details='Use the AI assistant to generate an extractor script for your data'
      />
    )
  }

  return (
    <div className='relative flex h-full flex-col bg-[#0D1117]'>
      <div className='absolute right-4 top-4 z-10 flex items-center gap-2'>
        {currentExtractor.version && (
          <span className='rounded bg-white/10 px-2 py-1 text-xs text-white/60'>
            v{currentExtractor.version}
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