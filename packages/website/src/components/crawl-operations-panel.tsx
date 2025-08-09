'use client'
declare let setInterval: WindowOrWorkerGlobalScope['setInterval']
declare let clearInterval: WindowOrWorkerGlobalScope['clearInterval']
declare let setTimeout: WindowOrWorkerGlobalScope['setTimeout']
declare let clearTimeout: WindowOrWorkerGlobalScope['clearTimeout']

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'
import {Slider} from '@/components/ui/slider'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {X, Play, Pause, Square, ChevronUp, ChevronDown, Clock, Zap, Globe, AlertTriangle} from 'lucide-react'

interface CrawlOperationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CrawlOperationsPanel({isOpen, onClose}: CrawlOperationsPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isRunning, setIsRunning] = React.useState(true)
  const [progress, setProgress] = React.useState(65)

  React.useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(100, prev + Math.random() * 2))
      }, 1000)
      return () => {
        clearInterval(interval)
      }
    }
  }, [isRunning])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className='fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[rgba(21,21,23,0.95)]
        backdrop-blur-md'
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 animate-pulse rounded-full bg-[#3B82F6]' />
            <span className='font-medium'>Crawling in Progress</span>
          </div>

          <div className='flex items-center gap-6 text-sm'>
            <div>
              <span className='text-white/60'>Progress:</span>
              <span className='ml-2 font-mono'>{Math.round(progress)}%</span>
            </div>
            <div>
              <span className='text-white/60'>Pages/sec:</span>
              <span className='ml-2 font-mono'>2.4</span>
            </div>
            <div>
              <span className='text-white/60'>Success rate:</span>
              <span className='ml-2 font-mono text-[#10B981]'>98.2%</span>
            </div>
            <div>
              <span className='text-white/60'>ETA:</span>
              <span className='ml-2 font-mono'>4m 32s</span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setIsExpanded(!isExpanded)
            }}
            className='text-white hover:bg-white/10'
          >
            {isExpanded ? (
              <>
                <ChevronDown className='mr-2 h-4 w-4' />
                Hide Details
              </>
            ) : (
              <>
                <ChevronUp className='mr-2 h-4 w-4' />
                View Details
              </>
            )}
          </Button>

          {isRunning ? (
            <Button
              variant='secondary'
              size='sm'
              onClick={() => {
                setIsRunning(false)
              }}
              className='border-white/10 bg-white/10 hover:bg-white/20'
            >
              <Pause className='mr-2 h-4 w-4' />
              Pause
            </Button>
          ) : (
            <Button
              size='sm'
              onClick={() => {
                setIsRunning(true)
              }}
              className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'
            >
              <Play className='mr-2 h-4 w-4' />
              Resume
            </Button>
          )}

          <Button
            variant='destructive'
            size='sm'
          >
            <Square className='mr-2 h-4 w-4' />
            Stop
          </Button>

          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='text-white hover:bg-white/10'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='px-4 pb-4'>
        <Progress
          value={progress}
          className='h-2'
        />
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className='space-y-6 border-t border-white/10 p-4'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Queue Status */}
            <div className='space-y-4'>
              <div className='font-medium'>Queue Status</div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-white/60'>Pending URLs</span>
                  <Badge
                    variant='secondary'
                    className='border-[#F59E0B]/30 bg-[#F59E0B]/20 text-[#F59E0B]'
                  >
                    142
                  </Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-white/60'>Processing</span>
                  <Badge
                    variant='secondary'
                    className='border-[#3B82F6]/30 bg-[#3B82F6]/20 text-[#3B82F6]'
                  >
                    8
                  </Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-white/60'>Completed</span>
                  <Badge
                    variant='secondary'
                    className='border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]'
                  >
                    267
                  </Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-white/60'>Failed</span>
                  <Badge
                    variant='secondary'
                    className='border-red-400/30 bg-red-400/20 text-red-400'
                  >
                    5
                  </Badge>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='text-sm font-medium'>Recently Processed</div>
                <div className='space-y-1 font-mono text-xs'>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-[#10B981]' />
                    <span className='truncate'>/products/widget-123</span>
                    <span className='text-white/40'>2s ago</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-[#10B981]' />
                    <span className='truncate'>/products/gadget-456</span>
                    <span className='text-white/40'>3s ago</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-red-400' />
                    <span className='truncate'>/products/tool-789</span>
                    <span className='text-white/40'>5s ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className='space-y-4'>
              <div className='font-medium'>Crawl Configuration</div>

              <div className='space-y-4'>
                <div>
                  <Label className='text-sm'>Concurrent Workers: 8</Label>
                  <Slider
                    defaultValue={[8]}
                    max={20}
                    min={1}
                    step={1}
                    className='mt-2'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-sm'>Rate Limit (req/sec)</Label>
                    <Input
                      defaultValue='2'
                      className='mt-1 border-white/10 bg-white/5'
                    />
                  </div>
                  <div>
                    <Label className='text-sm'>Max Depth</Label>
                    <Input
                      defaultValue='3'
                      className='mt-1 border-white/10 bg-white/5'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Switch
                      id='follow-links'
                      defaultChecked
                    />
                    <Label
                      htmlFor='follow-links'
                      className='text-sm'
                    >
                      Follow links
                    </Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Switch
                      id='respect-robots'
                      defaultChecked
                    />
                    <Label
                      htmlFor='respect-robots'
                      className='text-sm'
                    >
                      Respect robots.txt
                    </Label>
                  </div>
                </div>

                <div>
                  <Label className='text-sm'>Schedule</Label>
                  <div className='mt-2 flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-white/60' />
                    <span className='text-sm text-white/60'>One-time crawl</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Failed URLs */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4 text-red-400' />
              <span className='font-medium'>Failed URLs (5)</span>
            </div>
            <div className='space-y-2 rounded-lg bg-white/5 p-3 font-mono text-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-red-400'>/products/unavailable-item</span>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='secondary'
                    className='border-red-400/30 bg-red-400/20 text-red-400'
                  >
                    404
                  </Badge>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-6 text-xs'
                  >
                    Retry
                  </Button>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-red-400'>/products/timeout-page</span>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='secondary'
                    className='border-red-400/30 bg-red-400/20 text-red-400'
                  >
                    Timeout
                  </Badge>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-6 text-xs'
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
