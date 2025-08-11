'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QuickStats } from '@/components/quick-stats'

export function OverviewTab() {
  return (
    <>
      <QuickStats />
      <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-5'>
          <div className='mb-3 font-medium text-white'>Recent Activity</div>
          <ul className='space-y-3 text-sm'>
            <li className='flex items-center justify-between'>
              <span className='text-white/70'>Crawl completed</span>
              <Badge className='bg-white/10 text-white/70'>1h ago</Badge>
            </li>
            <li className='flex items-center justify-between'>
              <span className='text-white/70'>Schema updated to v3</span>
              <Badge className='bg-white/10 text-white/70'>4h ago</Badge>
            </li>
          </ul>
        </div>
        <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-5'>
          <div className='mb-3 font-medium text-white'>API Endpoints</div>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center justify-between'>
              <code className='font-mono text-sm text-white/80'>GET /projects/123/data</code>
              <Button
                variant='secondary'
                className='h-8 border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
              >
                Copy
              </Button>
            </div>
            <div className='flex items-center justify-between'>
              <code className='font-mono text-sm text-white/80'>POST /projects/123/crawl</code>
              <Button
                variant='secondary'
                className='h-8 border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}