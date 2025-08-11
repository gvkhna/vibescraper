'use client'

import * as React from 'react'
import {ThemeProvider} from '@/components/theme-provider'
import {DashboardNav} from '@/partials/dashboard/dashboard-nav'

export function DashboardShell({children}: {children: React.ReactNode}) {
  return (
    <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
      <div className='min-h-screen bg-[#0A0A0B] text-white'>
        <DashboardNav />
        <div className='mx-auto max-w-7xl px-4 pb-8 pt-6 md:px-6 md:pt-8'>
          {children}
        </div>
      </div>
    </ThemeProvider>
  )
}