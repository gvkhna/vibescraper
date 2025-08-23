'use client'

import * as React from 'react'
import {Database, Copy, CheckCircle, AlertCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/components/ui/hover-card'
import {useStore} from '@/store/use-store'
import {ExtractionTabsTrigger} from './extraction-tabs'
import {nowait} from '@/lib/async-utils'

export function DataTabWithHover() {
  const [copiedToClipboard, setCopiedToClipboard] = React.useState(false)

  const cachedData = useStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const extractionResult = cachedData?.extractionResult
  const validationStatus = cachedData?.schemaValidationStatus
  const validationErrors = cachedData?.schemaValidationErrors
  const validationItemErrors = cachedData?.schemaValidationItemErrors

  const isArray = Array.isArray(extractionResult)
  const hasValidationErrors =
    validationStatus === 'failed' &&
    ((validationErrors && validationErrors.length > 0) ??
      (validationItemErrors && validationItemErrors.length > 0))

  const copyToClipboard = async () => {
    if (extractionResult) {
      try {
        await globalThis.navigator.clipboard.writeText(JSON.stringify(extractionResult, null, 2))
        setCopiedToClipboard(true)
        setTimeout(() => {
          setCopiedToClipboard(false)
        }, 2000)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  return (
    <>
      <HoverCardTrigger>
        <ExtractionTabsTrigger
          value='data-table'
          className='gap-1.5 px-3 py-1.5 text-sm hover:bg-white/5 data-[state=active]:bg-white/10'
        >
          <Database className='h-3.5 w-3.5' />
          Data
        </ExtractionTabsTrigger>
      </HoverCardTrigger>

      {extractionResult && (
        <HoverCardContent
          className='w-80 border-white/10 bg-black/90 backdrop-blur-xl'
          align='start'
        >
          <div className='space-y-3'>
            <div className='text-xs font-medium text-white/80'>Extraction Results</div>

            <div className='space-y-2 text-sm text-white/70'>
              <div className='flex items-center gap-2'>
                <div
                  className={`h-2 w-2 rounded-full ${hasValidationErrors ? 'bg-red-400' : 'bg-green-400'}`}
                />
                <span>
                  {isArray ? `${extractionResult.length} items extracted` : 'Single object extracted'}
                </span>
              </div>

              <div className='border-l border-white/10 pl-3 text-xs text-white/60'>
                <div className='mb-1'>
                  <strong className='text-white/80'>Status:</strong>{' '}
                  {hasValidationErrors ? 'Schema validation failed' : 'Schema validation passed'}
                </div>
                {hasValidationErrors && (
                  <div className='text-red-400'>{validationItemErrors?.length ?? 0} items with errors</div>
                )}
              </div>
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                nowait(copyToClipboard())
              }}
              className='h-7 w-full border-white/20 text-white hover:bg-white/10'
            >
              {copiedToClipboard ? (
                <CheckCircle className='mr-2 h-3 w-3' />
              ) : (
                <Copy className='mr-2 h-3 w-3' />
              )}
              {copiedToClipboard ? 'Copied!' : 'Copy JSON'}
            </Button>
          </div>
        </HoverCardContent>
      )}
    </>
  )
}
