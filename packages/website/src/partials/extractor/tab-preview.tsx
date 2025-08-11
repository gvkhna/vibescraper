'use client'

import {Globe} from 'lucide-react'

export function TabPreview() {
  return (
    <div className='h-full p-4'>
      <div className='h-full overflow-hidden rounded-lg bg-white shadow-lg'>
        <div className='flex h-full items-center justify-center bg-gray-50'>
          <div className='space-y-4 p-8 text-center'>
            <Globe className='mx-auto h-16 w-16 text-gray-400' />
            <div className='text-lg font-medium text-gray-700'>Rendered Preview</div>
            <div className='max-w-md text-sm text-gray-500'>Preview will show here</div>
            <div className='text-xs text-gray-400'>
              This would show the actual webpage content as it appears in a browser
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}