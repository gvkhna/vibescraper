'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {Bell, BookOpen, ChevronDown, KeyRound} from 'lucide-react'
import {ApiKeysDialog} from '@/components/api-keys-dialog'
import {cn} from '@/lib/utils'
import {authReactClient} from '@/lib/auth-react-client'
import {BetterAuthUserButton} from '@/partials/webapp/better-auth-user-button'

export function DashboardNav() {
  const [apiKeysOpen, setApiKeysOpen] = React.useState(false)

  return (
    <header className={cn('sticky top-0 z-30', 'border-b border-white/10 bg-[#0A0A0B] backdrop-blur-md')}>
      <div className='flex h-14 items-center gap-3 px-4 md:px-6'>
        {/* Brand - hidden on mobile when space is needed */}
        <div className='hidden min-w-0 items-center gap-2 md:flex'>
          <span className='font-semibold text-white'>Vibescraper</span>
        </div>

        {/* Project Selector - takes more space on mobile */}
        <ProjectSelector />

        {/* Actions */}
        <div className='ml-auto flex items-center gap-2'>
          <Button
            size='sm'
            variant='ghost'
            className='gap-2 text-white/70 hover:bg-white/10 hover:text-white'
            onClick={() => {
              setApiKeysOpen(true)
            }}
            aria-label='Manage API Keys'
          >
            <KeyRound className='h-4 w-4 text-blue-500' />
            <span className='hidden sm:inline'>API Keys</span>
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='gap-2 text-white/70 hover:bg-white/10 hover:text-white'
            onClick={() => globalThis.window.open('https://docs.aivibescraper.com', '_blank')}
            aria-label='Open Documentation'
          >
            <BookOpen className='h-4 w-4' />
            <span className='hidden sm:inline'>Docs</span>
          </Button>
          <Notifications />
          <BetterAuthUserButton />
        </div>
      </div>
      <ApiKeysDialog
        open={apiKeysOpen}
        onOpenChange={setApiKeysOpen}
      />
    </header>
  )
}

function ProjectSelector() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex-1 justify-start gap-2 text-white/90 hover:bg-white/10 hover:text-white
            md:flex-initial'
          aria-label='Select Project'
        >
          <span className='max-w-[20ch] truncate md:max-w-[28ch]'>Acme Product Crawler</span>
          <ChevronDown className='ml-auto h-4 w-4 text-white/50 md:ml-2' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64 border-white/10 bg-[#1a1a1b]'>
        <DropdownMenuLabel className='text-white/70'>Recent Projects</DropdownMenuLabel>
        <DropdownMenuSeparator className='bg-white/10' />
        {['Acme Product Crawler', 'Blog Indexer', 'SaaS Pricing Tracker'].map((p) => (
          <DropdownMenuItem
            key={p}
            className='cursor-pointer text-white/90 hover:bg-white/10 focus:bg-white/10'
          >
            {p}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className='bg-white/10' />
        <DropdownMenuItem className='cursor-pointer text-blue-400 hover:bg-white/10 focus:bg-white/10'>
          New Project…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Notifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='text-white/70 hover:bg-white/10 hover:text-white'
          aria-label='Notifications'
        >
          <Bell className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80 border-white/10 bg-[#1a1a1b]'>
        <DropdownMenuLabel className='text-white/70'>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator className='bg-white/10' />
        <div className='px-2 py-1.5 text-sm'>
          <div className='flex items-start gap-2'>
            <span className='mt-1 h-2 w-2 rounded-full bg-red-500' />
            <div className='text-white/90'>
              Crawl failed on 2 URLs (429 rate limit). Retry scheduled.
              <div className='mt-1 text-xs text-white/50'>2m ago</div>
            </div>
          </div>
        </div>
        <div className='px-2 py-1.5 text-sm'>
          <div className='flex items-start gap-2'>
            <span className='mt-1 h-2 w-2 rounded-full bg-green-500' />
            <div className='text-white/90'>
              Schema validation passed on latest run.
              <div className='mt-1 text-xs text-white/50'>1h ago</div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
