'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, HardDrive, Play, RefreshCw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { nowait } from '@/lib/async-utils'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/use-store'

interface ScrapeButtonWithHoverProps {
  onScrape: () => Promise<void>
  onClearCache?: () => void
  onForceRefetch?: () => void
  isLoading?: boolean
  cacheInfo?: {
    isCached: boolean
    timestamp?: Date | null
    size?: string | null
  }
}

export function ScrapeButtonWithHover({
  onScrape,
  onClearCache,
  onForceRefetch,
  isLoading = false,
  cacheInfo
}: ScrapeButtonWithHoverProps) {
  const [isHovering, setIsHovering] = React.useState(false)
  const scrapeMode = useStore((state) => state.extractorSlice.scrapeMode)
  const toggleScrapeMode = useStore((state) => state.extractorSlice.toggleScrapeMode)

  const formatCacheAge = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    }
    return 'Just now'
  }

  return (
    <HoverCard
      openDelay={200}
      open={isHovering && !isLoading}
      onOpenChange={setIsHovering}
    >
      <HoverCardTrigger asChild>
        <Button
          onClick={() => {
            setIsHovering(false)
            nowait(onScrape())
          }}
          disabled={isLoading}
          className='h-9 bg-blue-600 px-4 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-700'
        >
          {isLoading ? (
            <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Play className='mr-2 h-4 w-4' />
          )}
          {scrapeMode === 'crawl-and-scrape' ? 'Crawl & Scrape' : 'Scrape'}
        </Button>
      </HoverCardTrigger>

      <HoverCardContent
        className='w-80 border-white/10 bg-black/90 backdrop-blur-xl'
        align='start'
        sideOffset={5}
      >
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-white/80'>Scrape Options</div>
            {cacheInfo?.isCached && (
              <div className='flex items-center gap-1.5 text-xs text-green-500'>
                <CheckCircle2 className='h-3.5 w-3.5' />
                <span>Cached</span>
              </div>
            )}
          </div>

          {/* Cache Status */}
          {cacheInfo && (
            <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-3'>
              <div className='flex items-center gap-2 text-xs text-white/60'>
                <HardDrive className='h-3.5 w-3.5' />
                <span className='font-medium'>Cache Status</span>
              </div>

              {cacheInfo.isCached ? (
                <div className='space-y-1.5'>
                  {cacheInfo.timestamp && (
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-white/40'>Last fetched:</span>
                      <span className='text-white/60'>{formatCacheAge(cacheInfo.timestamp)}</span>
                    </div>
                  )}
                  {cacheInfo.size && (
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-white/40'>Size:</span>
                      <span className='text-white/60'>{cacheInfo.size}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex items-center gap-2 text-xs text-white/40'>
                  <AlertCircle className='h-3.5 w-3.5' />
                  <span>No cached data available</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className='space-y-2'>
            {/* Mode Toggle */}
            <button
              onClick={() => {
                toggleScrapeMode()
                setIsHovering(false)
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm',
                'text-white/90 transition-colors duration-200 hover:bg-white/10'
              )}
            >
              <RefreshCw className='h-4 w-4 flex-shrink-0' />
              <div className='flex-1'>
                <div className='font-medium'>
                  {scrapeMode === 'crawl-and-scrape' ? 'Switch to Scrape Only' : 'Switch to Crawl & Scrape'}
                </div>
                <div className='text-xs text-white/50'>
                  {scrapeMode === 'crawl-and-scrape'
                    ? 'Single-page fetch on click'
                    : 'Crawl site and then scrape'}
                </div>
              </div>
            </button>

            {/* <button
              onClick={() => {
                setIsHovering(false)
                nowait(onScrape())
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm',
                'transition-colors duration-200',
                'hover:bg-white/10',
                cacheInfo?.isCached ? 'text-white/90' : 'cursor-not-allowed text-white/40'
              )}
              disabled={!cacheInfo?.isCached}
            >
              <Clock className='h-4 w-4 flex-shrink-0' />
              <div className='flex-1'>
                <div className='font-medium'>Use Cached</div>
                <div className='text-xs text-white/50'>
                  {cacheInfo?.isCached ? 'Use existing cached data (fastest)' : 'No cache available'}
                </div>
              </div>
            </button> */}

            {/* Force Refetch */}
            {/* {onForceRefetch && (
              <button
                onClick={() => {
                  setIsHovering(false)
                  onForceRefetch()
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm',
                  'text-white/90 transition-colors duration-200 hover:bg-white/10'
                )}
              >
                <Download className='h-4 w-4 flex-shrink-0' />
                <div className='flex-1'>
                  <div className='font-medium'>Force Refetch</div>
                  <div className='text-xs text-white/50'>Bypass cache and fetch fresh data</div>
                </div>
              </button>
            )} */}

            {/* Clear Cache */}
            {onClearCache && cacheInfo?.isCached && (
              <>
                <div className='my-2 h-px bg-white/10' />
                <button
                  onClick={() => {
                    setIsHovering(false)
                    onClearCache()
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm',
                    'text-red-400 transition-colors duration-200 hover:bg-red-500/10'
                  )}
                >
                  <Trash2 className='h-4 w-4 flex-shrink-0' />
                  <div className='flex-1'>
                    <div className='font-medium'>Clear Cache</div>
                    <div className='text-xs text-red-400/70'>Remove cached data for this URL</div>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Footer Info */}
          <div className='text-xs text-white/40'>
            {cacheInfo?.isCached
              ? 'Cached page available • Will not fetch new page data'
              : 'Will make a network request for page'}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
