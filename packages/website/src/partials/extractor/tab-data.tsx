'use client'

import * as React from 'react'
import { JsonTreeTable } from '@vibescraper/json-tree-table'
import { AlertCircle, CheckCircle, Copy, Database } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/use-store'

export function TabData() {
  // Get extraction data from project commit cache
  const cachedData = useStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const extractionResult = cachedData?.extractionResult
  const extractionStatus = cachedData?.extractionScriptStatus

  // Show empty state if no extraction has been run yet
  if (!cachedData || extractionStatus === 'initial') {
    return (
      <EmptyStateData
        icon={Database}
        title='No Data Extracted Yet'
        description='Run the scraper to extract data from the current page'
      />
    )
  }

  // Show error state if extraction failed
  if (extractionStatus === 'failed') {
    return (
      <EmptyStateData
        icon={AlertCircle}
        title='Extraction Failed'
        description='The data extraction script encountered an error. Check the Log tab for details.'
      />
    )
  }

  // Show empty result if extraction completed but no data
  if (extractionStatus === 'completed' && !extractionResult) {
    return (
      <EmptyStateData
        icon={Database}
        title='No Data Found'
        description='The extraction script completed but did not return any data'
      />
    )
  }

  // Show the data using JsonTreeTable
  return (
    <JsonTreeTable
      data={extractionResult}
      className='font-mono text-xs'
      expandLevel={1}
    />
  )
}
