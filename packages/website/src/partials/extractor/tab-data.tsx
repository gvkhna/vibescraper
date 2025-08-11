'use client'

import {Database} from 'lucide-react'

export function TabData() {
  return (
    <div className='h-full p-4'>
      <div className='h-full overflow-hidden rounded-lg bg-[#151517] shadow-lg'>
        <div className='flex h-full items-center justify-center'>
          <div className='space-y-4 p-8 text-center'>
            <Database className='mx-auto h-16 w-16 text-gray-400' />
            <div className='text-lg font-medium text-gray-300'>Extracted Data</div>
            <div className='max-w-md text-sm text-gray-500'>
              View and manage extracted data from your scraping operations
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}