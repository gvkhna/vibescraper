'use client'

import * as React from 'react'
import { MoreHorizontal, Play, Settings } from 'lucide-react'

import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ProjectHeaderProps {
  name: string
  onNameChange: (v: string) => void
  onRun: () => void
}

export function ProjectHeader({ name, onNameChange, onRun }: ProjectHeaderProps) {
  return (
    <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='min-w-0 flex-1'>
          <input
            value={name}
            onChange={(e) => {
              onNameChange(e.target.value)
            }}
            className={cn(
              'w-full border-none bg-transparent text-2xl font-semibold outline-none md:text-3xl',
              'focus-visible:ring-0 text-white'
            )}
            aria-label='Project Name'
          />
          <div className='mt-2 flex items-center gap-2'>
            <StatusBadge status='ready' />
            <Badge className='bg-white/10 text-white/70'>v3 Schema</Badge>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            className='bg-blue-600 text-white hover:bg-blue-700'
            onClick={onRun}
          >
            <Play className='mr-2 h-4 w-4' />
            Run Now
          </Button>
          <Button
            variant='secondary'
            className='border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
          >
            <Settings className='mr-2 h-4 w-4' />
            Configure
          </Button>
          {/* Removed View API button as requested */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='text-white/70 hover:bg-white/10 hover:text-white'
                aria-label='More actions'
              >
                <MoreHorizontal className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='border-white/10 bg-[#1a1a1b]'>
              <DropdownMenuItem className='cursor-pointer text-white/90 hover:bg-white/10'>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-white/90 hover:bg-white/10'>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-red-400 hover:bg-white/10'>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}