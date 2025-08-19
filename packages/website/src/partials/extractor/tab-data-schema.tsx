'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Copy, FileJson2} from 'lucide-react'
import {nowait} from '@/lib/async-utils'
import {EmptyStateData} from '@/components/empty-state-data'
import {useProjectStore} from '@/store/use-project-store'
import {MonacoTextEditor} from '../monaco-editor/monaco-text-editor'
import debug from 'debug'
import {TextViewer} from '../monaco-editor/text-viewer'

const log = debug('app:tab-data-schema')

export function TabDataSchema() {
  const [copied, setCopied] = React.useState(false)

  // Get project and schema from store
  const projectPublicId = useProjectStore((state) => state.projectSlice.project?.project.publicId)
  const loadSchemas = useProjectStore((state) => state.extractorSlice.loadSchemas)

  // Subscribe to schema changes with a shallow comparison to ensure reactivity
  const schemas = useProjectStore((state) => {
    if (!projectPublicId) {
      return null
    }
    return state.extractorSlice.projectSchemas[projectPublicId]?.schemas ?? null
  })

  // Get the active schema version from project commit
  const activeSchemaVersion = useProjectStore(
    (state) => state.extractorSlice.projectCommit?.activeSchemaVersion
  )

  // Get the active schema from the reactive schemas array
  const activeSchema = React.useMemo(() => {
    if (!schemas || !activeSchemaVersion) {
      return null
    }
    return schemas.find((s) => s.version === activeSchemaVersion) ?? null
  }, [schemas, activeSchemaVersion])

  // Load schemas on mount if not already loaded
  React.useEffect(() => {
    if (projectPublicId) {
      loadSchemas(projectPublicId).catch((err: unknown) => {
        log('Error loading schemas:', err)
      })
    }
  }, [projectPublicId, loadSchemas])

  // Format the schema JSON for display
  const content = React.useMemo(() => {
    if (!activeSchema?.schemaJson) {
      return ''
    }
    try {
      return JSON.stringify(activeSchema.schemaJson, null, 2)
    } catch (e) {
      log('Error formatting schema:', e)
      return ''
    }
  }, [activeSchema])

  const handleCopy = () => {
    if (content) {
      nowait(globalThis.navigator.clipboard.writeText(content))
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  // Show empty state if no schema
  if (!content) {
    return (
      <EmptyStateData
        icon={FileJson2}
        title='No Data Schema'
        description='Define a schema to structure your extracted data'
        details='Create or edit the schema to specify what data to extract'
      />
    )
  }

  return (
    <div className='relative flex h-full bg-[#0D1117]'>
      <div className='absolute right-4 top-4 z-10 flex items-center gap-2'>
        {activeSchema?.version && <span className='text-xs text-white/60'>v{activeSchema.version}</span>}
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
      <TextViewer
        textData={content}
        lang='json'
      />
    </div>
  )
}
