'use client'

import * as React from 'react'
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/components/ui/hover-card'
import {cn, tw} from '@/lib/utils'
import {Check, Loader2, X, Circle} from 'lucide-react'
import {useProjectStore} from '@/store/use-project-store'
import {
  derivePipelineStatus,
  getPipelineStepLabel,
  getOverallPipelineStatus,
  type DerivedPipelineStatus,
  type PipelineStepStatus
} from '@/lib/pipeline-status-utils'
import debug from 'debug'

const log = debug('app:pipeline-status')

interface PipelineStatusProps {
  isActive?: boolean
  onComplete?: () => void
}

export function PipelineStatus({onComplete}: PipelineStatusProps) {
  // Get scraping state from store (whether currently scraping)
  const isActive = useProjectStore((state) => state.extractorSlice.getScrapingState())

  // Get pipeline data from store
  const cachedData = useProjectStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const activeSchemaVersion = useProjectStore(
    (state) => state.extractorSlice.projectCommit?.activeSchemaVersion
  )
  const activeExtractorVersion = useProjectStore(
    (state) => state.extractorSlice.projectCommit?.activeExtractorVersion
  )

  // Derive actual pipeline status from cached data
  const pipelineStatus = React.useMemo(() => {
    // Debug: log the cached data structure
    log('Pipeline Status Debug - cachedData:', cachedData)
    log('Pipeline Status Debug - fetchStatus:', cachedData?.fetchStatus)
    log('Pipeline Status Debug - processingStatus:', cachedData?.processingStatus)
    log('Pipeline Status Debug - extractionScriptStatus:', cachedData?.extractionScriptStatus)
    log('Pipeline Status Debug - schemaValidationStatus:', cachedData?.schemaValidationStatus)
    log('Pipeline Status Debug - hasSchema:', !!activeSchemaVersion, 'hasScript:', !!activeExtractorVersion)

    const status = derivePipelineStatus(cachedData ?? null, !!activeSchemaVersion, !!activeExtractorVersion)
    log('Pipeline Status Debug - derived status:', status)
    return status
  }, [cachedData, activeSchemaVersion, activeExtractorVersion])

  // Get overall status for badge display
  const overallStatus = React.useMemo(() => {
    return getOverallPipelineStatus(pipelineStatus)
  }, [pipelineStatus])

  // Handle completion callback when status becomes complete
  React.useEffect(() => {
    if (overallStatus.stage === 'complete' && onComplete) {
      onComplete()
    }
  }, [overallStatus.stage, onComplete])

  // Get badge styles based on actual status
  const getBadgeStyles = () => {
    if (overallStatus.stage === 'complete') {
      return tw('border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]')
    }
    if (overallStatus.stage === 'error') {
      return tw('border-red-500/30 bg-red-500/20 text-red-500')
    }
    if (isActive) {
      return tw('border-blue-500/30 bg-blue-500/20 text-blue-500')
    }
    return tw('border-white/20 bg-white/10 text-white/60')
  }

  // Get status icon and color for individual steps
  const getStepIcon = (status: PipelineStepStatus) => {
    switch (status) {
      case 'success':
        return <Check className='h-4 w-4 text-green-500' />
      case 'success-cached':
        return <Check className='h-4 w-4 text-blue-500' />
      case 'error':
        return <X className='h-4 w-4 text-red-500' />
      case 'not-run':
        return <Circle className='h-4 w-4 text-white/20' />
    }
  }

  const getStepColor = (status: PipelineStepStatus) => {
    switch (status) {
      case 'success':
        return tw('text-green-500')
      case 'success-cached':
        return tw('text-blue-500')
      case 'error':
        return tw('text-red-500')
      case 'not-run':
        return tw('text-white/40')
    }
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            `inline-flex cursor-default items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium
            transition-all duration-300`,
            getBadgeStyles()
          )}
        >
          {/* Activity Indicator */}
          <div className='relative h-3.5 w-3.5'>
            {isActive && <Loader2 className='absolute inset-0 h-3.5 w-3.5 animate-spin' />}
            {!isActive && overallStatus.stage === 'complete' && (
              <Check className='absolute inset-0 h-3.5 w-3.5' />
            )}
            {!isActive && overallStatus.stage === 'error' && <X className='absolute inset-0 h-3.5 w-3.5' />}
            {!isActive && overallStatus.stage === 'ready' && (
              <div className='absolute inset-0 flex h-3.5 w-3.5 items-center justify-center'>
                <div className='h-1.5 w-1.5 rounded-full bg-white/40' />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className='text-xs'>{isActive ? 'Processing...' : overallStatus.message}</div>
        </div>
      </HoverCardTrigger>

      <HoverCardContent
        className='w-80 border-white/10 bg-black/90 backdrop-blur-xl'
        align='start'
      >
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='text-xs font-medium text-white/80'>
              {isActive ? 'Pipeline Status' : 'Previous Run Results'}
            </div>
            {pipelineStatus.hasData && (
              <div className='text-xs text-white/40'>
                {cachedData?.responseTimeMs ? `${cachedData.responseTimeMs}ms` : ''}
              </div>
            )}
          </div>

          <div className='space-y-2'>
            {/* Step 1: Fetched */}
            <div className='flex items-center gap-3'>
              <div className='flex h-5 w-5 items-center justify-center'>
                {getStepIcon(pipelineStatus.fetched)}
              </div>
              <div className={cn('flex-1 text-sm', getStepColor(pipelineStatus.fetched))}>Fetched</div>
              {cachedData?.statusCode && <div className='text-xs text-white/40'>{cachedData.statusCode}</div>}
            </div>

            {/* Step 2: Processed */}
            <div className='flex items-center gap-3'>
              <div className='flex h-5 w-5 items-center justify-center'>
                {getStepIcon(pipelineStatus.processed)}
              </div>
              <div className={cn('flex-1 text-sm', getStepColor(pipelineStatus.processed))}>Processed</div>
            </div>

            {/* Step 3: Extracted */}
            <div className='flex items-center gap-3'>
              <div className='flex h-5 w-5 items-center justify-center'>
                {getStepIcon(pipelineStatus.extracted)}
              </div>
              <div className={cn('flex-1 text-sm', getStepColor(pipelineStatus.extracted))}>Extracted</div>
              {!activeExtractorVersion && <div className='text-xs text-white/40'>No script</div>}
            </div>

            {/* Step 4: Validated */}
            <div className='flex items-center gap-3'>
              <div className='flex h-5 w-5 items-center justify-center'>
                {getStepIcon(pipelineStatus.validated)}
              </div>
              <div className={cn('flex-1 text-sm', getStepColor(pipelineStatus.validated))}>Validated</div>
              {!activeSchemaVersion && <div className='text-xs text-white/40'>No schema</div>}
            </div>
          </div>

          {/* Error Message */}
          {pipelineStatus.error && (
            <div className='rounded border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400'>
              {pipelineStatus.error}
            </div>
          )}

          {/* Summary */}
          <div className='flex items-center justify-between text-xs text-white/60'>
            {pipelineStatus.hasData ? (
              <span>Last run for: {cachedData?.url}</span>
            ) : (
              <span>No data available</span>
            )}
            {isActive && <span className='text-blue-500'>Processing...</span>}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
