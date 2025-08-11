'use client'

import * as React from 'react'
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/components/ui/hover-card'
import {cn, tw} from '@/lib/utils'
import {Check, Loader2} from 'lucide-react'

export type PipelineStage =
  | 'ready'
  | 'initializing'
  | 'fetching'
  | 'parsing'
  | 'extracting'
  | 'validating'
  | 'storing'
  | 'complete'
  | 'error'

interface PipelineStep {
  id: PipelineStage
  label: string
  // in ms
  duration: number
}

const PIPELINE_STEPS: PipelineStep[] = [
  {id: 'ready', label: 'Ready', duration: 0},
  {id: 'initializing', label: 'Initializing', duration: 800},
  {id: 'fetching', label: 'Fetching', duration: 1500},
  {id: 'parsing', label: 'Parsing', duration: 1200},
  {id: 'extracting', label: 'Extracting', duration: 1800},
  {id: 'validating', label: 'Validating', duration: 600},
  {id: 'storing', label: 'Storing', duration: 400},
  {id: 'complete', label: 'Complete', duration: 0}
]

interface PipelineStatusProps {
  isActive: boolean
  onComplete?: () => void
}

export function PipelineStatus({isActive, onComplete}: PipelineStatusProps) {
  const [currentStage, setCurrentStage] = React.useState<PipelineStage>('ready')
  const [completedStages, setCompletedStages] = React.useState<Set<PipelineStage>>(new Set())
  const [isAnimating, setIsAnimating] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const timeoutsRef = React.useRef<NodeJS.Timeout[]>([])

  const runPipeline = React.useCallback(() => {
    setIsAnimating(true)
    const completed = new Set<PipelineStage>()

    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    let totalDelay = 0
    PIPELINE_STEPS.forEach((step, index) => {
      // Skip 'ready'
      if (index === 0) {
        return
      }

      const timeout = setTimeout(() => {
        setCurrentStage(step.id)
        if (index > 1) {
          completed.add(PIPELINE_STEPS[index - 1].id)
          setCompletedStages(new Set(completed))
        }

        if (step.id === 'complete') {
          // Mark the last actual step as completed
          completed.add('storing')
          setCompletedStages(new Set(completed))
          const completeTimeout = setTimeout(() => {
            setIsAnimating(false)
            onComplete?.()
          }, 500)
          timeoutsRef.current.push(completeTimeout)
        }
      }, totalDelay)

      timeoutsRef.current.push(timeout)
      totalDelay += step.duration
    })
  }, [onComplete])

  React.useEffect(() => {
    if (isActive && currentStage === 'ready') {
      runPipeline()
    } else if (!isActive) {
      // Reset when inactive
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Clear all pipeline timeouts
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []

      setCurrentStage('ready')
      setCompletedStages(new Set())
      setIsAnimating(false)
    }
  }, [isActive, currentStage, runPipeline])

  // Cleanup on unmount
  React.useEffect(() => {
    // Capture refs in effect scope
    const timeoutRefValue = timeoutRef
    const timeoutsRefValue = timeoutsRef

    return () => {
      if (timeoutRefValue.current) {
        clearTimeout(timeoutRefValue.current)
      }
      timeoutsRefValue.current.forEach(clearTimeout)
    }
  }, [])

  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStage)

  const getStageStatus = (stageId: PipelineStage) => {
    if (completedStages.has(stageId)) {
      return 'completed'
    }
    if (currentStage === stageId) {
      return 'active'
    }
    return 'pending'
  }

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return tw('text-green-500')
      case 'active':
        return tw('text-blue-500')
      default:
        return tw('text-white/40')
    }
  }

  const getBadgeStyles = () => {
    if (currentStage === 'complete') {
      return tw('border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]')
    }
    if (currentStage === 'error') {
      return tw('border-red-500/30 bg-red-500/20 text-red-500')
    }
    if (isAnimating) {
      return tw('border-blue-500/30 bg-blue-500/20 text-blue-500')
    }
    return tw('border-white/20 bg-white/10 text-white/60')
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
            {isAnimating && currentStage !== 'complete' && currentStage !== 'ready' && (
              <Loader2 className='absolute inset-0 h-3.5 w-3.5 animate-spin' />
            )}
            {currentStage === 'complete' && <Check className='absolute inset-0 h-3.5 w-3.5' />}
            {!isAnimating && currentStage === 'ready' && (
              <div className='absolute inset-0 flex h-3.5 w-3.5 items-center justify-center'>
                <div className='h-1.5 w-1.5 rounded-full bg-white/40' />
              </div>
            )}
          </div>

          {/* Sliding Text Container */}
          <div className='relative h-4 w-16 overflow-hidden'>
            <div
              className='absolute flex flex-col transition-transform duration-500 ease-in-out'
              style={{
                transform: `translateY(-${currentStepIndex * 16}px)`
              }}
            >
              {PIPELINE_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex h-4 items-center text-xs transition-opacity duration-300',
                    currentStage === step.id ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </HoverCardTrigger>

      <HoverCardContent
        className='w-72 border-white/10 bg-black/90 backdrop-blur-xl'
        align='start'
      >
        <div className='space-y-3'>
          <div className='text-xs font-medium text-white/80'>Pipeline Status</div>

          <div className='space-y-2'>
            {PIPELINE_STEPS.filter((s) => s.id !== 'ready').map((step) => {
              const status = getStageStatus(step.id)
              const color = getStageColor(status)

              return (
                <div
                  key={step.id}
                  className='flex items-center gap-3'
                >
                  {/* Status Icon */}
                  <div className='flex h-5 w-5 items-center justify-center'>
                    {status === 'completed' && <Check className={cn('h-4 w-4', color)} />}
                    {status === 'active' && <Loader2 className={cn('h-4 w-4 animate-spin', color)} />}
                    {status === 'pending' && (
                      <div className={cn('h-2 w-2 rounded-full border', 'border-white/20 bg-white/5')} />
                    )}
                  </div>

                  {/* Stage Label */}
                  <div className={cn('flex-1 text-sm transition-colors duration-300', color)}>
                    {step.label}
                  </div>

                  {/* Duration (for active/completed) */}
                  {(status === 'completed' || status === 'active') && step.duration > 0 && (
                    <div className='text-xs text-white/40'>{(step.duration / 1000).toFixed(1)}s</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className='relative h-1 w-full overflow-hidden rounded-full bg-white/10'>
            <div
              className='absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400
                transition-all duration-500'
              style={{
                width: `${(completedStages.size / (PIPELINE_STEPS.length - 2)) * 100}%`
              }}
            />
          </div>

          {/* Summary */}
          <div className='flex items-center justify-between text-xs text-white/60'>
            <span>
              {completedStages.size} of {PIPELINE_STEPS.length - 2} steps
            </span>
            {currentStage === 'complete' && <span className='text-green-500'>Completed successfully</span>}
            {isAnimating && currentStage !== 'complete' && (
              <span className='text-blue-500'>Processing...</span>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
