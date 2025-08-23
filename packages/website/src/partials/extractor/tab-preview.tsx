'use client'

import {Globe, AlertTriangle, Loader2} from 'lucide-react'
import {EmptyStatePreview} from '@/components/empty-state-preview'
import {useStore} from '@/store/use-store'
import {useEffect, useState, useMemo} from 'react'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {PUBLIC_VARS} from '@/vars.public'
import api from '@/lib/api-client'

export function TabPreview() {
  const projectCommitPublicId = useStore((state) => state.extractorSlice.projectCommit?.publicId)
  const cachedHtml = useStore((state) => state.extractorSlice.projectCommit?.cachedData?.html)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = useMemo(() => {
    if (projectCommitPublicId && cachedHtml) {
      const iframeUrl = api.project.preview[':projectCommitPublicId'].$url({
        param: {
          projectCommitPublicId
        }
      })
      return `${iframeUrl}?t=${new Date().getTime()}`
    }
    return null
  }, [projectCommitPublicId, cachedHtml])

  useEffect(() => {
    // Reset states when projectCommit changes
    setError(null)
    setIsLoading(true)
  }, [projectCommitPublicId])

  // If no project commit, show empty state
  if (!projectCommitPublicId) {
    return (
      <EmptyStatePreview
        icon={Globe}
        title='No Project Selected'
        description='Select a project to see the preview'
      />
    )
  }

  // If no cached HTML, show empty state with instructions
  if (!cachedHtml) {
    return (
      <EmptyStatePreview
        icon={Globe}
        title='No Preview Available'
        description='Scrape the URL first to see the preview'
        details='Click the "Scrape" button in the pipeline status bar to fetch the webpage'
      />
    )
  }

  // If we don't have a valid preview URL, something is wrong
  if (!previewUrl) {
    return (
      <EmptyStatePreview
        icon={AlertTriangle}
        title='Preview Error'
        description='Unable to generate preview URL'
      />
    )
  }

  return (
    <div className='relative flex h-full w-full flex-col'>
      {error && (
        <Alert
          variant='destructive'
          className='m-2'
        >
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className='bg-background/50 absolute inset-0 z-10 flex items-center justify-center'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      )}

      {/*
        Using sandbox without allow-same-origin to prevent the iframe from accessing cookies/localStorage.
        This prevents the security warning about escaping sandboxing.
        The trade-off is that some features requiring same-origin may not work.
      */}
      <iframe
        src={previewUrl}
        title='Website Preview'
        className='h-full w-full flex-1 border-0'
        sandbox='allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-modals allow-downloads'
        onLoad={() => {
          setIsLoading(false)
        }}
        onError={() => {
          setIsLoading(false)
          setError('Failed to load preview')
        }}
      />
    </div>
  )
}
