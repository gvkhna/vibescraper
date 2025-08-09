import React, {type ReactNode} from 'react'
import {DashboardShell} from '@/components/dashboard-shell'

export function DashboardLayout({children}: {children: ReactNode}) {
  return <DashboardShell>{children}</DashboardShell>
}

export default DashboardLayout
