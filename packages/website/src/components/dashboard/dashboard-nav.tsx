'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Bell, BookOpen, ChevronDown, KeyRound } from 'lucide-react'
import { ApiKeysDialog } from '@/components/api-keys-dialog'
import { cn } from '@/lib/utils'

export function DashboardNav() {
  const [apiKeysOpen, setApiKeysOpen] = React.useState(false)

  return (
    <header
      className={cn('sticky top-0 z-30', 'border-b border-white/10 bg-[#0A0A0B] backdrop-blur-md')}
    >
      <div className='flex h-14 items-center gap-3 px-4 md:px-6'>
        {/* Brand - hidden on mobile when space is needed */}
        <div className='hidden md:flex min-w-0 items-center gap-2'>
          <span className='font-semibold text-white'>Scrapeloop</span>
        </div>
        
        {/* Project Selector - takes more space on mobile */}
        <ProjectSelector />
        
        {/* Actions */}
        <div className='ml-auto flex items-center gap-2'>
          <Button
            size='sm'
            variant='ghost'
            className='gap-2 text-white/70 hover:bg-white/10 hover:text-white'
            onClick={() => { setApiKeysOpen(true); }}
            aria-label='Manage API Keys'
          >
            <KeyRound className='h-4 w-4 text-blue-500' />
            <span className='hidden sm:inline'>API Keys</span>
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='gap-2 text-white/70 hover:bg-white/10 hover:text-white'
            onClick={() => window.open('https://docs.example.com', '_blank')}
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

function ProjectSelector() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='gap-2 text-white/90 hover:bg-white/10 hover:text-white flex-1 md:flex-initial justify-start'
          aria-label='Select Project'
        >
          <span className='max-w-[20ch] md:max-w-[28ch] truncate'>Acme Product Crawler</span>
          <ChevronDown className='h-4 w-4 text-white/50 ml-auto md:ml-2' />
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

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='gap-2 hover:bg-white/10 p-1 md:px-3'
          aria-label='User menu'
        >
          <Avatar className='h-7 w-7'>
            <AvatarImage
              alt='User'
              src='/placeholder.svg?height=32&width=32'
            />
            <AvatarFallback className='bg-white/10 text-white/70 text-xs'>US</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56 border-white/10 bg-[#1a1a1b]'
        align='end'
      >
        <DropdownMenuLabel className='text-white/70'>Account</DropdownMenuLabel>
        <DropdownMenuSeparator className='bg-white/10' />
        <DropdownMenuItem className='cursor-pointer text-white/90 hover:bg-white/10 focus:bg-white/10'>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className='cursor-pointer text-white/90 hover:bg-white/10 focus:bg-white/10'>
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator className='bg-white/10' />
        <DropdownMenuItem className='cursor-pointer text-red-400 hover:bg-white/10 focus:bg-white/10'>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}