import { useState } from 'react'
import { AlertCircle, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { ChatFileVersionBlockFileStatus, ChatFileVersionBlockType } from './chat-message-schema'

export type ChatFileVersionControlProps = {
  versionBlock: ChatFileVersionBlockType
  onRestore?: () => void
  isLoading?: boolean
  isViewing?: boolean
}

export function ChatFileVersionBlock({
  versionBlock,
  isLoading = true,
  isViewing = true,
  onRestore = () => {}
}: ChatFileVersionControlProps) {
  const { version, changes, overallStatus } = versionBlock
  // version = 'Version 2',
  // changes = [],
  // isLoading = false,
  // overallStatus = 'complete'

  const [isCollapsed, setIsCollapsed] = useState(false)

  // Map status to display text
  const getStatusDisplay = (status: ChatFileVersionBlockFileStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'generating':
        return 'Generating'
      case 'editing':
        return 'Editing'
      case 'generated':
        return 'Generated'
      case 'edited':
        return 'Edited'
      case 'error':
        return 'Error'
      default:
        return status
    }
  }

  // Determine if the overall process is still in progress
  const isInProgress = overallStatus === 'loading' || overallStatus === 'in-progress'

  return (
    <Card className='not-prose w-full !gap-0 rounded-lg border py-0 shadow-none'>
      <CardHeader className={cn('flex flex-row items-center space-y-0 !p-1.5', !isCollapsed && 'border-b')}>
        <div className='flex min-w-0 flex-1 items-center overflow-hidden'>
          <Button
            variant='ghost'
            className='h-auto flex-shrink-0 p-0 font-normal'
            onClick={() => {
              setIsCollapsed(!isCollapsed)
            }}
          >
            {isCollapsed ? (
              <ChevronUp className='text-muted-foreground h-5 w-5' />
            ) : (
              <ChevronDown className='text-muted-foreground h-5 w-5' />
            )}
          </Button>
          {/* <span className='ml-2 mr-2 truncate text-sm font-medium'>{version}</span> */}

          {isInProgress && (
            <Badge
              variant='outline'
              className='ml-2 border-amber-200 bg-amber-50 text-amber-700'
            >
              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
              Working
            </Badge>
          )}

          {overallStatus === 'complete' && (
            <Badge
              variant='outline'
              className='ml-2 border-green-200 bg-green-50 text-green-700'
            >
              <Check className='mr-1 h-3 w-3' />
              Complete
            </Badge>
          )}

          {overallStatus === 'error' && (
            <Badge
              variant='outline'
              className='ml-2 border-red-200 bg-red-50 text-red-700'
            >
              <AlertCircle className='mr-1 h-3 w-3' />
              Error
            </Badge>
          )}
        </div>
        <div className='flex flex-shrink-0 items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onRestore}
            disabled={isInProgress}
          >
            Restore
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='bg-muted text-muted-foreground h-7'
            disabled
          >
            {isViewing ? 'Viewing' : 'View'}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className='!p-0'>
          {isLoading && changes.length === 0 ? (
            <div className='flex items-center justify-center p-4'>
              <Loader2 className='text-muted-foreground mr-2 h-5 w-5 animate-spin' />
              <span className='text-muted-foreground'>Loading changes...</span>
            </div>
          ) : (
            changes.map((change, index) => (
              <div
                key={index}
                className='hover:bg-accent flex items-center p-2'
              >
                <div className='mr-2.5 flex-shrink-0'>
                  <div className='bg-muted rounded-full p-1'>
                    {change.isLoading ? (
                      <Loader2 className='h-3 w-3 animate-spin' />
                    ) : change.status === 'error' ? (
                      <AlertCircle className='h-3 w-3 text-red-500' />
                    ) : (
                      <Check className='h-3 w-3' />
                    )}
                  </div>
                </div>
                <div className='min-w-0 flex-1 overflow-hidden'>
                  <span className='block truncate text-sm'>{change.path}</span>
                </div>
                <div className='ml-2 flex-shrink-0'>
                  <span
                    className={`text-sm ${
                      change.isLoading
                        ? 'text-amber-600'
                        : change.status === 'error'
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }`}
                  >
                    {getStatusDisplay(change.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  )
}

export const ChatFileProjectVersionBlock = ChatFileVersionBlock
