'use client'

import * as React from 'react'
import {Database, Copy, CheckCircle, AlertCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {useProjectStore} from '@/store/use-project-store'

export function DataTabPopoverContent() {
  const [copiedToClipboard, setCopiedToClipboard] = React.useState(false)
  
  const cachedData = useProjectStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const extractionResult = cachedData?.extractionResult
  const validationStatus = cachedData?.schemaValidationStatus
  const validationErrors = cachedData?.schemaValidationErrors
  const validationItemErrors = cachedData?.schemaValidationItemErrors
  
  const isArray = Array.isArray(extractionResult)
  const hasValidationErrors = validationStatus === 'failed' && (
    (validationErrors && validationErrors.length > 0) ||
    (validationItemErrors && validationItemErrors.length > 0)
  )
  
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

  if (!extractionResult) {
    return (
      <div className='text-sm text-white/70'>
        No extraction data available
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      <div className='text-sm font-medium text-white'>Extraction Results</div>
      
      {/* Data info */}
      <div className='space-y-2 text-sm text-white/70'>
        <div className='flex items-center gap-2'>
          <Database className='h-4 w-4' />
          <span>{isArray ? `Array with ${extractionResult.length} items` : 'Single object'}</span>
        </div>
        
        {/* Validation status */}
        <div className='flex items-center gap-2'>
          {hasValidationErrors ? (
            <AlertCircle className='h-4 w-4 text-red-400' />
          ) : (
            <CheckCircle className='h-4 w-4 text-green-400' />
          )}
          <span className={hasValidationErrors ? 'text-red-400' : 'text-green-400'}>
            {hasValidationErrors ? 'Schema validation failed' : 'Schema validation passed'}
          </span>
        </div>
      </div>

      {/* Copy button */}
      <Button
        variant='outline'
        size='sm'
        onClick={copyToClipboard}
        className='w-full border-white/20 text-white hover:bg-white/10'
      >
        {copiedToClipboard ? (
          <CheckCircle className='mr-2 h-4 w-4' />
        ) : (
          <Copy className='mr-2 h-4 w-4' />
        )}
        {copiedToClipboard ? 'Copied!' : 'Copy JSON'}
      </Button>
    </div>
  )
}