'use client'

import * as React from 'react'
import {Clock, Globe, X} from 'lucide-react'

import {cn} from '@/lib/utils'
import {Input} from '@/components/ui/input'
import {Command, CommandEmpty, CommandGroup, CommandItem, CommandList} from '@/components/ui/command'
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover'
import {useStore} from '@/store/use-store'
import {nowait} from '@/lib/async-utils'
import debug from 'debug'

const log = debug('app:url-history-combobox')

type UrlHistoryItem = {
  url: string
  title?: string
  visitedAt: string
  favicon?: string
}

interface UrlHistoryComboboxProps {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
}

export function UrlHistoryCombobox({
  value,
  onChange,
  placeholder = 'Enter URL to scrape...',
  className
}: UrlHistoryComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [commandValue, setCommandValue] = React.useState('')
  const blurTimeoutRef = React.useRef<number | null>(null)
  const divElement = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Get recent URLs from the store
  const projectCommit = useStore((state) => state.extractorSlice.projectCommit)
  const clearRecentUrls = useStore((state) => state.extractorSlice.clearRecentUrls)

  // Convert URLs to history items with timestamps (fake for now)
  const recentUrls = React.useMemo(() => {
    const urls = projectCommit?.recentUrls.urls ?? []
    return urls.map((url, index) => ({
      url,
      visitedAt: index === 0 ? 'just now' : `${index + 1} ${index === 0 ? 'minute' : 'minutes'} ago`
    }))
  }, [projectCommit?.recentUrls.urls])

  const handleUrlSelect = (url: string) => {
    // Clear any pending blur timeout
    // if (blurTimeoutRef.current) {
    //   clearTimeout(blurTimeoutRef.current)
    // }
    onChange(url)
    setCommandValue('')
    setOpen(false)
  }

  const handleBlur = () => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
    }
    // Set new timeout
    blurTimeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 150)
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.stopPropagation()
    log('Clear history clicked')
    const result = await clearRecentUrls()
    if (result.success) {
      log('History cleared successfully')
      // Close the popover after clearing
      setOpen(false)
    } else {
      log('Failed to clear history')
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    log('Input key pressed:', e.key)

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      log('Arrow key detected, opening popover')
      setOpen(true)

      // Set the command value to the first URL to select it
      if (recentUrls.length > 0) {
        setCommandValue(recentUrls[0].url)
      }

      // Focus the command list after a brief delay
      setTimeout(() => {
        const commandRoot = globalThis.document.querySelector<HTMLElement>('[cmdk-root]')
        if (commandRoot) {
          commandRoot.focus()
        }
        // const commandList = globalThis.document.querySelector<HTMLElement>('[cmdk-list]')
        // if (commandList) {
        //   const firstItem = commandList.querySelector<HTMLElement>('[cmdk-item]')
        //   log('Found first item:', firstItem)
        //   if (firstItem) {
        //     firstItem.focus()
        //   }
        // }
      }, 100)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setCommandValue('')
      inputRef.current?.blur()
    }
  }

  //
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <div>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
            }}
            onKeyDown={handleInputKeyDown}
            onClick={() => {
              log('Input clicked, opening popover')
              setOpen(true)
              // Reset selection on click
              setCommandValue('')
            }}
            className={cn(
              'w-full cursor-text border-white/20 bg-[#0A0A0B] text-left font-mono text-sm',
              className
            )}
            placeholder={placeholder}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className='border-white/10 bg-[#1a1a1b] p-0'
        align='start'
        side='bottom'
        sideOffset={4}
        style={{
          width: 'var(--radix-popover-trigger-width)'
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        <Command
          className='bg-transparent focus-within:!outline-0'
          shouldFilter={false}
          value={commandValue}
          onValueChange={setCommandValue}
          onFocus={(e) => {
            log('received focus', e.currentTarget.tagName)
          }}
        >
          {/* Hide the command input since we don't want search */}
          <div className='hidden'>
            <input />
          </div>
          <CommandList className='max-h-[300px] overflow-y-auto focus-within:!outline-0'>
            <CommandEmpty className='py-6 text-center text-sm text-white/60'>
              No recent URLs found.
            </CommandEmpty>
            <CommandGroup>
              <div
                className='flex items-center justify-between border-b border-white/10 px-2 py-2 text-xs
                  font-medium text-white/70'
              >
                <div className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  Recently Visited
                </div>
                <button
                  onClick={(e) => {
                    nowait(handleClearHistory(e))
                  }}
                  className='flex items-center gap-1 text-white/50 transition-colors hover:text-white/80'
                >
                  <X className='h-3 w-3' />
                  Clear
                </button>
              </div>
              {recentUrls.length > 0 && (
                <CommandItem
                  value='-'
                  className='hidden'
                />
              )}

              {recentUrls.map((item, index) => (
                <CommandItem
                  key={`${item.url}-${index}`}
                  value={item.url}
                  onSelect={() => {
                    handleUrlSelect(item.url)
                  }}
                  className={cn(
                    'cursor-pointer px-3 py-3 hover:bg-white/5 aria-selected:bg-white/10',
                    'flex items-center gap-3 text-white/90'
                  )}
                  defaultChecked={false}
                  defaultValue={''}
                  aria-selected={false}
                >
                  <div className='flex min-w-0 flex-1 items-center justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-mono text-sm text-white'>{item.url}</div>
                    </div>
                    <div className='flex-shrink-0 text-xs text-white/50'>{item.visitedAt}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
