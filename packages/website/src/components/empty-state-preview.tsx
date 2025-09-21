'use client'

import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface EmptyStatePreviewProps {
  icon: LucideIcon
  title: string
  description?: string
  details?: string
  className?: string
}

export function EmptyStatePreview({
  icon: Icon,
  title,
  description,
  details,
  className
}: EmptyStatePreviewProps) {
  return (
    <div className={cn('h-full p-4', className)}>
      <div className='h-full overflow-hidden rounded-lg bg-white shadow-lg'>
        <div className='flex h-full items-center justify-center bg-gray-50'>
          <div className='space-y-4 p-8 text-center'>
            <Icon className='mx-auto h-16 w-16 text-gray-400' />
            <div className='text-lg font-medium text-gray-700'>{title}</div>
            {description && (
              <div className='max-w-md text-sm text-gray-500'>{description}</div>
            )}
            {details && (
              <div className='text-xs text-gray-400'>{details}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}