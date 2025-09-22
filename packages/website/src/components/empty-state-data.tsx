'use client'

import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface EmptyStateDataProps {
  icon: LucideIcon
  title: string
  description?: string
  details?: string
  className?: string
}

export function EmptyStateData({ icon: Icon, title, description, details, className }: EmptyStateDataProps) {
  return (
    <div className={cn('h-full p-4', className)}>
      <div className='h-full overflow-hidden rounded-lg bg-[#151517] shadow-lg'>
        <div className='flex h-full items-center justify-center'>
          <div className='space-y-4 p-8 text-center'>
            <Icon className='mx-auto h-16 w-16 text-gray-400' />
            <div className='text-lg font-medium text-gray-300'>{title}</div>
            {description && <div className='max-w-md text-sm text-gray-500'>{description}</div>}
            {details && <div className='text-xs text-gray-600'>{details}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
