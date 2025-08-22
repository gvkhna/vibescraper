'use client'

import * as React from 'react'
import {Database, AlertCircle} from 'lucide-react'
import {EmptyStateData} from '@/components/empty-state-data'
import {useProjectStore} from '@/store/use-project-store'
import ReactJson from '@uiw/react-json-view'
import {nordTheme} from '@uiw/react-json-view/nord'

export function TabDataJson() {
  // Get extraction data from project commit cache
  const cachedData = useProjectStore((state) => state.extractorSlice.projectCommit?.cachedData)
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

  // ||
  //   !extractionResult ||

  if (
    !extractionResult ||
    typeof extractionResult === 'number' ||
    typeof extractionResult === 'string' ||
    typeof extractionResult === 'boolean'
  ) {
    return null
  }

  // Show the data using ReactJson
  return (
    <div className='relative flex h-full flex-col bg-[#0D1117]'>
      <div className='flex-1 overflow-auto'>
        <ReactJson
          style={nordTheme}
          value={extractionResult}
          indentWidth={10}
          displayDataTypes={false}
          displayObjectSize={true}
          collapsed={2}
          enableClipboard={true}
          objectSortKeys={false}
          shortenTextAfterLength={0}
        />
      </div>
    </div>
  )
}
