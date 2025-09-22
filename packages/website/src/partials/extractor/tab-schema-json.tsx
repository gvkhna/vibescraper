'use client'

import * as React from 'react'
import debug from 'debug'
import { Copy, FileJson2 } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { useStore } from '@/store/use-store'
import { MonacoTextEditor } from '../monaco-editor/monaco-text-editor'
import { TextViewer } from '../monaco-editor/text-viewer'

const log = debug('app:tab-schema-json')

export function TabSchemaJson() {
  const [copied, setCopied] = React.useState(false)

  // Get project and schema from store
  const projectPublicId = useStore((state) => state.projectSlice.project?.project.publicId)
  const loadSchemas = useStore((state) => state.extractorSlice.loadSchemas)
  const projectSchemas = useStore((state) => state.extractorSlice.projectSchemas)

  // Derive schemas from projectSchemas
  const schemas = projectPublicId ? (projectSchemas[projectPublicId]?.schemas ?? null) : null

  // Get the active schema version from project commit
  const activeSchemaVersion = useStore((state) => state.extractorSlice.projectCommit?.activeSchemaVersion)

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
        title='No Schema JSON'
        description='No JSON schema is defined for this project'
        details='Create or edit the schema to specify what data to extract'
      />
    )
  }

  return (
    <div className='relative flex h-full bg-[#0D1117]'>
      <div className='absolute top-4 right-4 z-10 flex items-center gap-2'>
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
