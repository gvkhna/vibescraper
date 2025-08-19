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
import {Input} from '@/components/ui/input'
import {cn} from '@/lib/utils'
import {UserAvatar} from '@daveyplate/better-auth-ui'
import {authReactClient} from '@/lib/auth-react-client'

export function TopNav() {
  const [apiKeysOpen, setApiKeysOpen] = React.useState(false)

  return (
    <header
      className={cn('sticky top-0 z-30', 'border-b border-white/10 bg-[rgba(26,26,27,0.5)] backdrop-blur-md')}
    >
      <div className='flex h-14 items-center gap-3 px-4 md:px-6'>
        <Brand />
        <ProjectSelector />
        <div className='ml-auto flex items-center gap-2'>
          <Button
            size='sm'
            variant='ghost'
            className='gap-2 text-white hover:bg-white/10'
            onClick={() => {
              setApiKeysOpen(true)
            }}
            aria-label='Manage API Keys'
          >
            <KeyRound className='h-4 w-4 text-[#3B82F6]' />
            <span className='hidden sm:inline'>API Keys</span>
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='gap-2 text-white hover:bg-white/10'
            onClick={() => globalThis.window.open('https://docs.example.com', '_blank')}
            aria-label='Open Documentation'
          >
            <BookOpen className='h-4 w-4' />
            <span className='hidden sm:inline'>Docs</span>
          </Button>
          <Notifications />
          <UserMenu />
        </div>
      </div>
      <ApiKeysDialog
        open={apiKeysOpen}
        onOpenChange={setApiKeysOpen}
      />
    </header>
  )
}

function Brand() {
  return (
    <div className='flex min-w-0 items-center gap-2'>
      <div className='bg-gradient-to-r from-white to-white/60 bg-clip-text font-semibold text-transparent'>
        WebCrawler Studio
      </div>
      <span className='text-xs text-white/30'>MVP</span>
    </div>
  )
}

function ProjectSelector() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='gap-2 text-white/90 hover:bg-white/10'
          aria-label='Select Project'
        >
          <span className='max-w-[28ch] truncate'>Acme Product Crawler</span>
          <ChevronDown className='h-4 w-4 text-white/50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64'>
        <DropdownMenuLabel>Recent Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {['Acme Product Crawler', 'Blog Indexer', 'SaaS Pricing Tracker'].map((p) => (
          <DropdownMenuItem
            key={p}
            className='cursor-pointer'
          >
            {p}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer text-[#3B82F6]'>New Project…</DropdownMenuItem>
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
          className='text-white hover:bg-white/10'
          aria-label='Notifications'
        >
          <Bell className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80'>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className='px-2 py-1.5 text-sm'>
          <div className='flex items-start gap-2'>
            <span className='mt-1 h-2 w-2 rounded-full bg-red-500' />
            <div>
              Crawl failed on 2 URLs (429 rate limit). Retry scheduled.
              <div className='text-muted-foreground mt-1 text-xs'>2m ago</div>
            </div>
          </div>
        </div>
        <div className='px-2 py-1.5 text-sm'>
          <div className='flex items-start gap-2'>
            <span className='mt-1 h-2 w-2 rounded-full bg-green-500' />
            <div>
              Schema validation passed on latest run.
              <div className='text-muted-foreground mt-1 text-xs'>1h ago</div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  const session = authReactClient.useSession()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='gap-2 hover:bg-white/10'
          aria-label='User menu'
        >
          <UserAvatar
            user={session.data?.user}
            className='h-7 w-7'
            classNames={{
              fallback: 'bg-white/10 text-white/70 text-xs'
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56'
        align='end'
      >
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer'>Settings</DropdownMenuItem>
        <DropdownMenuItem className='cursor-pointer'>Billing</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer text-red-400'>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
