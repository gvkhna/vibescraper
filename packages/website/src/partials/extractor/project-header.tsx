'use client'

import * as React from 'react'
import { KeyRound, MoreHorizontal, Play, Settings } from 'lucide-react'

import { GlassCard } from '@/components/quick-stats'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import { PipelineStatus } from './pipeline-status'

export function ProjectHeader({
  name,
  onNameChange,
  onRun,
  isProcessing
}: {
  name: string
  onNameChange: (v: string) => void
  onRun: () => void
  isProcessing?: boolean
}) {
  return (
    <GlassCard className='p-5'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='min-w-0'>
          <input
            value={name}
            onChange={(e) => {
              onNameChange(e.target.value)
            }}
            className={cn(
              'w-full border-none bg-transparent text-2xl font-semibold outline-none md:text-3xl',
              'focus-visible:ring-0'
            )}
            aria-label='Project Name'
          />
          <div className='mt-2 flex items-center gap-3'>
            <PipelineStatus isActive={isProcessing ?? false} />
            <Badge className='bg-white/10'>v3 Schema</Badge>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            className='bg-[#3B82F6] shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:bg-[#3B82F6]/80'
            onClick={onRun}
            disabled={isProcessing}
          >
            <Play className='mr-2 h-4 w-4' />
            {isProcessing ? 'Running...' : 'Run Now'}
          </Button>
          <Button
            variant='secondary'
            className='border-white/10 bg-white/10 hover:bg-white/20'
          >
            <Settings className='mr-2 h-4 w-4' />
            Configure
          </Button>
          <Button
            variant='secondary'
            className='border-white/10 bg-white/10 hover:bg-white/20'
          >
            <KeyRound className='mr-2 h-4 w-4' />
            View API
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='hover:bg-white/10'
                aria-label='More actions'
              >
                <MoreHorizontal className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem className='cursor-pointer'>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer'>Archive</DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-red-400'>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </GlassCard>
  )
}
