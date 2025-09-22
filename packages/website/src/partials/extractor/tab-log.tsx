'use client'

import * as React from 'react'
import type { CodeExecutionMessage } from '@vibescraper/sandbox'
import { AlertCircle, AlertTriangle, FileText, Info, Terminal } from 'lucide-react'

import { EmptyStateData } from '@/components/empty-state-data'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/use-store'

export function TabLog() {
  const extractionMessages = useStore(
    (state) => state.extractorSlice.projectCommit?.cachedData?.extractionMessages
  )

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // Get icon and styling for different message types
  const getMessageStyle = (message: CodeExecutionMessage) => {
    switch (message.type) {
      case 'log':
        return {
          icon: Terminal,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20'
        }
      case 'exception':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        }
      case 'status':
        return {
          icon: Info,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        }
      default:
        return {
          icon: Info,
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        }
    }
  }

  // Format message content for display
  const getMessageContent = (message: CodeExecutionMessage) => {
    switch (message.type) {
      case 'log':
        return message.log
      case 'exception':
        if (typeof message.exception === 'string') {
          return message.exception
        }
        return `${message.exception.name}: ${message.exception.message}`
      case 'status':
        return `Status: ${message.status}${message.error ? ` - ${message.error}` : ''}`
      case 'result':
        return `Result: ${message.result?.slice(0, 200)}${message.result && message.result.length > 200 ? '...' : ''}`
      default:
        return JSON.stringify(message, null, 2)
    }
  }

  if (!extractionMessages || extractionMessages.length === 0) {
    return (
      <div className='flex h-full flex-col bg-[#0D1117]'>
        <div className='flex-1 overflow-hidden'>
          <EmptyStateData
            icon={FileText}
            title='No Extraction Logs'
            description='Run the extraction script to see logs here'
            details='Console logs, errors, and execution details will appear after running extraction'
          />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col bg-[#0D1117]'>
      {/* Header */}
      <div className='border-b border-white/10 p-4'>
        <h3 className='flex items-center gap-2 text-sm font-medium text-white'>
          <Terminal className='h-4 w-4' />
          Extraction Logs ({extractionMessages.length} messages)
        </h3>
      </div>

      {/* Log Messages */}
      <div className='flex-1 space-y-3 overflow-y-auto p-4'>
        {extractionMessages.map((message, index) => {
          const style = getMessageStyle(message)
          const Icon = style.icon

          return (
            <div
              key={index}
              className={cn('rounded-lg border p-3 transition-colors', style.bgColor, style.borderColor)}
            >
              <div className='flex items-start gap-3'>
                <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', style.iconColor)} />
                <div className='min-w-0 flex-1'>
                  <div className='mb-1 flex items-center gap-2'>
                    <span className='text-xs font-medium text-white/80 uppercase'>{message.type}</span>
                    {'timestamp' in message && (
                      <span className='text-xs text-white/60'>{formatTimestamp(message.timestamp)}</span>
                    )}
                  </div>
                  <div className='font-mono text-sm break-words whitespace-pre-wrap text-white'>
                    {getMessageContent(message)}
                  </div>
                  {message.type === 'exception' &&
                    typeof message.exception === 'object' &&
                    message.exception.stack && (
                      <details className='mt-2'>
                        <summary className='cursor-pointer text-xs text-white/60 hover:text-white/80'>
                          Stack trace
                        </summary>
                        <pre className='mt-1 text-xs whitespace-pre-wrap text-white/60'>
                          {message.exception.stack}
                        </pre>
                      </details>
                    )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
