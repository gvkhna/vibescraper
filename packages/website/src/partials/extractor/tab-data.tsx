'use client'

import {Database} from 'lucide-react'
import {EmptyStateData} from '@/components/empty-state-data'

export function TabData() {
  return (
    <EmptyStateData
      icon={Database}
      title='Extracted Data'
      description='View and manage extracted data from your scraping operations'
    />
  )
}