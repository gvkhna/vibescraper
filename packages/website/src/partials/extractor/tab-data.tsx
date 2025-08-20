'use client'

import * as React from 'react'
import {Database, Copy, CheckCircle, AlertCircle, FileJson} from 'lucide-react'
import {EmptyStateData} from '@/components/empty-state-data'
import {useProjectStore} from '@/store/use-project-store'
import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'

export function TabData() {
  const [copiedToClipboard, setCopiedToClipboard] = React.useState(false)
  
  // Get extraction data from project commit cache
  const cachedData = useProjectStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const extractionResult = cachedData?.extractionResult
  const extractionStatus = cachedData?.extractionScriptStatus
  const validationStatus = cachedData?.schemaValidationStatus
  const validationErrors = cachedData?.schemaValidationErrors
  const validationItemErrors = cachedData?.schemaValidationItemErrors

  const copyToClipboard = async () => {
    if (extractionResult) {
      try {
        await globalThis.navigator.clipboard.writeText(JSON.stringify(extractionResult, null, 2))
        setCopiedToClipboard(true)
        setTimeout(() => setCopiedToClipboard(false), 2000)
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

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

  const isArray = Array.isArray(extractionResult)
  const hasValidationErrors = validationStatus === 'failed' && (
    (validationErrors && validationErrors.length > 0) ||
    (validationItemErrors && validationItemErrors.length > 0)
  )

  return (
    <div className='flex h-full flex-col'>
      {/* Header with status and controls */}
      <div className='flex items-center justify-between border-b border-white/10 px-4 py-3'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Database className='h-4 w-4 text-white/70' />
            <span className='text-sm font-medium text-white'>
              Extracted Data {isArray && `(${extractionResult.length} items)`}
            </span>
          </div>
          
          {/* Validation status */}
          {validationStatus !== 'initial' && (
            <div className='flex items-center gap-1.5'>
              {hasValidationErrors ? (
                <AlertCircle className='h-3.5 w-3.5 text-red-400' />
              ) : (
                <CheckCircle className='h-3.5 w-3.5 text-green-400' />
              )}
              <span className={cn(
                'text-xs',
                hasValidationErrors ? 'text-red-400' : 'text-green-400'
              )}>
                {hasValidationErrors ? 'Schema Invalid' : 'Schema Valid'}
              </span>
            </div>
          )}
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={copyToClipboard}
          className='h-7 px-2 text-white/60 hover:text-white'
        >
          {copiedToClipboard ? (
            <CheckCircle className='h-3.5 w-3.5' />
          ) : (
            <Copy className='h-3.5 w-3.5' />
          )}
          <span className='ml-1.5 text-xs'>
            {copiedToClipboard ? 'Copied!' : 'Copy JSON'}
          </span>
        </Button>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-hidden'>
        {/* Validation errors */}
        {hasValidationErrors && (
          <div className='border-b border-red-500/20 bg-red-500/10 px-4 py-3'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='h-4 w-4 text-red-400 mt-0.5 flex-shrink-0' />
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium text-red-400 mb-2'>Schema Validation Failed</div>
                
                {/* General validation errors */}
                {validationErrors && validationErrors.length > 0 && (
                  <div className='mb-3'>
                    <div className='space-y-1'>
                      {validationErrors.map((error, index) => (
                        <div key={index} className='text-xs text-red-300 font-mono'>
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Item-specific validation errors */}
                {validationItemErrors && validationItemErrors.length > 0 && (
                  <div className='space-y-2'>
                    <div className='text-xs font-medium text-red-400'>
                      Item-specific errors:
                    </div>
                    {validationItemErrors.map((itemError, index) => (
                      <div key={index} className='bg-red-500/5 border border-red-500/20 rounded px-2 py-1.5'>
                        <div className='text-xs font-medium text-red-300 mb-1'>
                          {isArray ? `Item ${itemError.itemIndex}:` : 'Object:'}
                        </div>
                        <div className='space-y-0.5'>
                          {itemError.errors.map((error, errorIndex) => (
                            <div key={errorIndex} className='text-xs text-red-200 font-mono ml-2'>
                              • {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data display */}
        <div className='h-full overflow-auto'>
          <pre className='h-full p-4 text-xs font-mono text-white/80 whitespace-pre-wrap break-words'>
            {JSON.stringify(extractionResult, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}