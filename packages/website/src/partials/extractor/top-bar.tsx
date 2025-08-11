'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {ChevronDown, Plus, Download, Zap, RefreshCwOff} from 'lucide-react'
import {ScrapeButtonWithHover} from './scrape-button-with-hover'

export interface TopBarProps {
  siteName: string
  onNewSite: () => void
  currentUrl?: string
  onUrlChange?: (url: string) => void
  saveUrl: (e: React.FormEvent) => boolean
  onScrape?: () => Promise<void>
  isLoading?: boolean
  dataSource?: 'fetch' | 'cached'
  onDataSourceChange?: (source: 'fetch' | 'cached') => void
  onActivate?: () => void
  onClearCache?: () => void
  onForceRefetch?: () => void
  cacheInfo?: {
    isCached: boolean
    timestamp?: Date | null
    size?: string | null
  }
}

export function TopBar({
  siteName,
  onNewSite,
  currentUrl,
  onUrlChange,
  saveUrl,
  onScrape,
  isLoading,
  dataSource = 'cached',
  onDataSourceChange,
  onActivate,
  onClearCache,
  onForceRefetch,
  cacheInfo
}: TopBarProps) {
  return (
    <div className='flex h-[56px] flex-shrink-0 items-center gap-3 border-b border-white/10 bg-[#151517] px-4'>
      {/* Logo */}
      <div className='flex items-center'>
        <span className='text-lg font-semibold'>Scrapeloop</span>
      </div>

      {/* URL Bar and Controls */}
      {currentUrl && onUrlChange && (
        <>
          <form onSubmit={saveUrl}>
            <Input
              value={currentUrl}
              onChange={(e) => {
                onUrlChange(e.target.value)
              }}
              className='max-w-lg border-white/20 bg-[#0A0A0B] font-mono text-sm'
              placeholder='Enter URL to scrape...'
            />
          </form>

          {onScrape && (
            <ScrapeButtonWithHover
              onScrape={onScrape}
              onClearCache={onClearCache}
              onForceRefetch={onForceRefetch}
              isLoading={isLoading}
              cacheInfo={cacheInfo}
            />
          )}

          {/* {onDataSourceChange && (
            <Select
              value={dataSource}
              onValueChange={(v: 'fetch' | 'cached') => {
                onDataSourceChange(v)
              }}
            >
              <SelectTrigger className='w-40 border-white/20 bg-[#0A0A0B]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='border-white/10 bg-[#1a1a1b]'>
                <SelectItem
                  value='cached'
                  className='text-white/90 hover:bg-white/10'
                >
                  <div className='flex items-center gap-2'>
                    <RefreshCwOff className='h-4 w-4' />
                    <span>Cached</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value='fetch'
                  className='text-white/90 hover:bg-white/10'
                >
                  <div className='flex items-center gap-2'>
                    <Download className='h-4 w-4' />
                    <span>Re-fetch</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )} */}

          {onActivate && (
            <Button
              variant='outline'
              onClick={onActivate}
              className='h-9 border-green-500/50 px-4 text-green-400 hover:bg-green-500/10'
            >
              <Zap className='mr-2 h-4 w-4' />
              Activate
            </Button>
          )}
        </>
      )}

      {/* Right side - Project Selector and User Menu */}
      <div className='ml-auto flex items-center gap-3'>
        {/* Project Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='gap-2 text-white hover:bg-white/10'
            >
              <span className='font-medium'>{siteName}</span>
              <ChevronDown className='h-4 w-4 text-white/60' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-64 border-white/10 bg-[#1a1a1b]'>
            <div className='px-2 py-1.5 text-sm font-medium text-white/70'>Recent Projects</div>
            <DropdownMenuSeparator className='bg-white/10' />
            <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>
              Example Store
            </DropdownMenuItem>
            <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>
              Tech Blog Scraper
            </DropdownMenuItem>
            <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>
              Product Catalog
            </DropdownMenuItem>
            <DropdownMenuSeparator className='bg-white/10' />
            <DropdownMenuItem
              onClick={onNewSite}
              className='text-blue-400 hover:bg-white/10 focus:bg-white/10'
            >
              <Plus className='mr-2 h-4 w-4' />
              New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='hover:bg-white/10'
            >
              <Avatar className='h-6 w-6'>
                <AvatarImage src='/placeholder.svg?height=24&width=24' />
                <AvatarFallback className='bg-white/10 text-xs text-white/70'>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='border-white/10 bg-[#1a1a1b]'
          >
            <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className='bg-white/10' />
            <DropdownMenuItem className='text-red-400 hover:bg-white/10 focus:bg-white/10'>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
