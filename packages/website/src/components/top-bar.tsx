'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {ChevronDown, Plus, Database} from 'lucide-react'

interface TopBarProps {
  siteName: string
  onNewSite: () => void
}

export function TopBar({siteName, onNewSite}: TopBarProps) {
  return (
    <div className='flex h-[60px] flex-shrink-0 items-center gap-6 border-b border-white/10 bg-[#151517] px-6'>
      {/* Logo */}
      <div className='flex items-center gap-3'>
        <span className='text-lg font-semibold'>Scrapeloop</span>
      </div>

      {/* Site Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='gap-2 text-white hover:bg-white/10'
          >
            <span className='font-medium'>{siteName}</span>
            <ChevronDown className='h-4 w-4 text-white/60' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-64 border-white/10 bg-[#1a1a1b]'>
          <div className='px-2 py-1.5 text-sm font-medium text-white/70'>Recent Sites</div>
          <DropdownMenuSeparator className='bg-white/10' />
          <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Example Store</DropdownMenuItem>
          <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Tech Blog Scraper</DropdownMenuItem>
          <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Product Catalog</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onNewSite}
            className='text-blue-400 hover:bg-white/10 focus:bg-white/10'
          >
            <Plus className='mr-2 h-4 w-4' />
            New Site
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status & Stats */}
      <div className='ml-auto flex items-center gap-4'>
        {/* <div className='hidden items-center gap-4 text-sm text-white/70 md:flex'>
          <div>
            <span className='font-medium text-white'>1,247</span> records
          </div>
          <div>
            Last run: <span className='text-white'>2m ago</span>
          </div>
        </div> */}

        {/* <Badge className='border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]'>Active</Badge> */}

        <Button
          variant='ghost'
          size='sm'
          className='text-white hover:bg-white/10'
        >
          <Database className='mr-2 h-4 w-4' />
          Data
        </Button>

        {/* <Button
          variant='ghost'
          size='icon'
          className='text-white hover:bg-white/10'
        >
          <Settings className='h-4 w-4' />
        </Button> */}

        {/* <Button
          variant='ghost'
          size='icon'
          className='text-white hover:bg-white/10'
        >
          <HelpCircle className='h-4 w-4' />
        </Button> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='hover:bg-white/10'
            >
              <Avatar className='h-6 w-6'>
                <AvatarImage src='/placeholder.svg?height=24&width=24' />
                <AvatarFallback className='bg-white/10 text-white/70 text-xs'>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='border-white/10 bg-[#1a1a1b]'>
            <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Settings</DropdownMenuItem>
            <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Billing</DropdownMenuItem>
            <DropdownMenuSeparator className='bg-white/10' />
            <DropdownMenuItem className='text-red-400 hover:bg-white/10 focus:bg-white/10'>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
