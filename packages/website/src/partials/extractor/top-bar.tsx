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
import {Switch} from '@/components/ui/switch'
import {Badge} from '@/components/ui/badge'
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/components/ui/hover-card'
import {ScrapeButtonWithHover} from './scrape-button-with-hover'
import {UrlHistoryCombobox} from './url-history-combobox'
import {useStore} from '@/store/use-store'
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
  const recentProjects = useStore((state) => state.recentProjectsSlice.recentProjects)
  const currentProject = useStore((state) => state.projectSlice.project)
  const session = authReactClient.useSession()

  // Live mode state (temporary React state for UI demo)
  const [isLiveMode, setIsLiveMode] = React.useState(false)

  // Use current project name or fall back to "Scraper"
  const displayName = currentProject?.project.name ?? 'Scraper'

  return (
    <div className='flex h-[56px] flex-shrink-0 items-center gap-3 border-b border-white/10 bg-[#151517] px-4'>
      {/* Logo */}
      <div className='flex-shrink-0'>
        <span className='text-lg font-semibold'>Vibescraper</span>
      </div>

      {/* URL Bar and Controls */}
      {onUrlChange && (
        <>
          <form
            onSubmit={saveUrl}
            className='min-w-0 max-w-2xl flex-1'
          >
            <UrlHistoryCombobox
              value={currentUrl ?? ''}
              onChange={onUrlChange}
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

          {/* Live Mode Toggle - Disabled for now, focusing on UI */}
          {onActivate && (
            <div className='flex items-center gap-4'>
              {/* Live Mode Switch */}
              <Switch
                checked={isLiveMode}
                onCheckedChange={setIsLiveMode}
                className={`ml-2 h-6 w-11 border-0 transition-all duration-300
                data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/20
                data-[state=checked]:shadow-[0_0_12px_rgba(34,197,94,0.4)] [&>span]:h-5 [&>span]:w-5
                [&>span]:shadow-sm [&>span]:data-[state=checked]:translate-x-[1.375rem]
                [&>span]:data-[state=checked]:bg-white [&>span]:data-[state=unchecked]:bg-white/70`}
              />

              {/* Live Mode Badge with Hover */}
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <Badge
                    variant='outline'
                    className={`cursor-default transition-all duration-300 ${
                      isLiveMode
                        ? `border-green-500/50 bg-green-500/15 text-green-400
                          shadow-[0_0_8px_rgba(34,197,94,0.3)] hover:bg-green-500/20`
                        : `hover:bg-green-500/8 border-green-500/20 bg-green-500/5 text-green-400/60
                          hover:text-green-400/80`
                    } `}
                  >
                    <Zap className='h-3 w-3' />
                    Live Mode
                    {isLiveMode && (
                      <div
                        className='ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-400
                          shadow-[0_0_6px_rgba(34,197,94,0.8)]'
                      />
                    )}
                  </Badge>
                </HoverCardTrigger>

                <HoverCardContent
                  className='w-80 border-white/10 bg-black/90 backdrop-blur-xl'
                  align='start'
                >
                  <div className='space-y-3'>
                    {/* <div className='text-xs font-medium text-white/80'>Live Mode Settings</div> */}

                    <div className='space-y-2 text-sm text-white/70'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`h-2 w-2 rounded-full
                          ${isLiveMode ? 'bg-green-400 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-white/40'}`}
                        />
                        <span>Currently in {isLiveMode ? 'Live' : 'Sandbox'} mode</span>
                      </div>

                      <div className='border-l border-white/10 pl-3 text-xs text-white/60'>
                        <div className='mb-1'>
                          <strong className='text-white/80'>Sandbox Mode:</strong> Data is not saved, perfect
                          for testing and experimentation.
                        </div>
                        <div>
                          <strong className='text-white/80'>Live Mode:</strong> Data is saved to your project,
                          enabling real scraping workflows.
                        </div>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          )}

          {/* Original Activate Button - Commented out for reference */}
          {/* {onActivate && (
            <Button
              variant='outline'
              onClick={onActivate}
              className='h-9 border-green-500/50 px-4 text-green-400 hover:bg-green-500/10'
            >
              <Zap className='mr-2 h-4 w-4' />
              Activate
            </Button>
          )} */}
        </>
      )}

      {/* Right side - Project Selector and User Menu */}
      <div className='ml-auto flex flex-shrink-0 items-center gap-3'>
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
                nowait(navigate({to: '/scrapers'}))
              }}
              className='text-white/90 hover:bg-white/10 focus:bg-white/10'
            >
              View All Scrapers
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                nowait(navigate({to: '/'}))
              }}
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
            <DropdownMenuItem
              className='text-white/90 hover:bg-white/10 focus:bg-white/10'
              onClick={() => {
                nowait(navigate({to: '/settings'}))
              }}
            >
              Settings
            </DropdownMenuItem>
            {/* <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>
              Billing
            </DropdownMenuItem> */}
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
