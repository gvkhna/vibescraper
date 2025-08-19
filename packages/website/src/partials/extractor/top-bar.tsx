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
import {ChevronDown, Plus, Zap, Settings} from 'lucide-react'
import {ScrapeButtonWithHover} from './scrape-button-with-hover'
import {useProjectStore} from '@/store/use-project-store'
import {useNavigate} from '@tanstack/react-router'
import {UserAvatar} from '@daveyplate/better-auth-ui'
import {authReactClient} from '@/lib/auth-react-client'
import {nowait} from '@/lib/async-utils'

export interface TopBarProps {
  onNewSite: () => void
  currentUrl?: string
  onUrlChange?: (url: string) => void
  saveUrl: (e: React.FormEvent) => boolean
  onScrape?: () => Promise<void>
  isLoading?: boolean
  onActivate?: () => void
  onSettings?: () => void
  onClearCache?: () => void
  onForceRefetch?: () => void
  cacheInfo?: {
    isCached: boolean
    timestamp?: Date | null
    size?: string | null
  }
}

export function TopBar({
  onNewSite,
  currentUrl,
  onUrlChange,
  saveUrl,
  onScrape,
  isLoading,
  onActivate,
  onSettings,
  onClearCache,
  onForceRefetch,
  cacheInfo
}: TopBarProps) {
  const navigate = useNavigate()
  const recentProjects = useProjectStore((state) => state.recentProjectsSlice.recentProjects)
  const currentProject = useProjectStore((state) => state.projectSlice.project)
  const session = authReactClient.useSession()

  // Use current project name or fall back to "Scraper"
  const displayName = currentProject?.project.name ?? 'Scraper'

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

          {onSettings && (
            <Button
              variant='outline'
              onClick={onSettings}
              className='h-9 border-white/20 px-4 text-white hover:bg-white/10'
            >
              <Settings className='mr-2 h-4 w-4' />
              Settings
            </Button>
          )}

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
              className='flex max-w-[200px] gap-2 text-white hover:bg-white/10'
            >
              <span className='truncate font-medium'>{displayName}</span>
              <ChevronDown className='h-4 w-4 flex-shrink-0 text-white/60' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-64 border-white/10 bg-[#1a1a1b]'>
            <div className='px-2 py-1.5 text-sm font-medium text-white/70'>Scrapers</div>
            <DropdownMenuSeparator className='bg-white/10' />
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <DropdownMenuItem
                  key={project.publicId}
                  className='text-white/90 hover:bg-white/10 focus:bg-white/10'
                  onClick={() => {
                    // Navigate to project if it's not the current one
                    if (currentProject?.project.publicId !== project.publicId) {
                      nowait(
                        navigate({
                          to: '/scraper/$project-public-id/edit',
                          params: {'project-public-id': project.publicId}
                        })
                      )
                    }
                  }}
                >
                  {project.name}
                  {currentProject?.project.publicId === project.publicId && (
                    <span className='ml-auto text-xs text-white/40'>Current</span>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className='px-2 py-1.5 text-sm text-white/40'>No recent scrapers</div>
            )}
            <DropdownMenuSeparator className='bg-white/10' />
            <DropdownMenuItem
              onClick={() => {
                nowait(navigate({to: '/projects'}))
              }}
              className='text-white/90 hover:bg-white/10 focus:bg-white/10'
            >
              View All Scrapers
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onNewSite}
              className='text-blue-400 hover:bg-white/10 focus:bg-white/10'
            >
              <Plus className='mr-2 h-4 w-4' />
              New Scraper
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
              <UserAvatar
                user={session.data?.user}
                className='h-6 w-6'
                classNames={{
                  fallback: 'bg-white/10 text-xs text-white/70'
                }}
              />
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
