'use client'

import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface SplitButtonDropdownTab<T extends string = string> {
  value: T
  label: string
  icon: LucideIcon
}

interface SplitButtonDropdownProps<T extends string> {
  tabs: SplitButtonDropdownTab<T>[]
  activeTab: T
  lastDropdownTab?: T
  onTabChange: (value: T) => void
}

export function SplitButtonDropdown<T extends string>({
  tabs, 
  activeTab, 
  lastDropdownTab, 
  onTabChange
}: SplitButtonDropdownProps<T>) {
  // Check if the active tab is one of the dropdown tabs
  const activeDropdownTab = tabs.find((tab) => tab.value === activeTab)
  const isDropdownTabActive = Boolean(activeDropdownTab)

  // Get the display info for the trigger
  // Use: active dropdown tab if one is selected, otherwise last selected, otherwise first tab
  const displayTab = activeDropdownTab ?? 
    (lastDropdownTab ? tabs.find(tab => tab.value === lastDropdownTab) : null) ?? 
    tabs[0]
  const DisplayIcon = displayTab.icon

  // Base button classes that both parts share
  const baseButtonClasses = cn(
    // Copy ALL the exact classes from the real tab button
    'dark:data-[state=active]:text-foreground',
    'focus-visible:border-ring',
    'focus-visible:ring-ring/50',
    'focus-visible:outline-ring',
    'dark:data-[state=active]:border-input',
    'dark:data-[state=active]:bg-input/30',
    'text-foreground',
    'dark:text-muted-foreground',
    'inline-flex',
    'h-[calc(100%-1px)]',
    'items-center',
    'justify-center',
    'whitespace-nowrap',
    'border',
    'border-transparent',
    'font-medium',
    'transition-[color,box-shadow]',
    'focus-visible:outline-1',
    'focus-visible:ring-[3px]',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'data-[state=active]:shadow-sm',
    '[&_svg:not([class*="size-"])]:size-4',
    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    // The specific overrides from extraction-panel
    'text-sm',
    'data-[state=active]:bg-white/10',
    // Apply active state if dropdown tab is selected
    isDropdownTabActive ? 'bg-white/10 shadow-sm' : ''
  )

  return (
    <div className='inline-flex h-full'>
      {/* Main button - directly activates the last selected tab */}
      <button
        type="button"
        role='tab'
        onClick={() => {
          onTabChange(displayTab.value)
        }}
        className={cn(
          baseButtonClasses,
          'flex-1',
          'gap-1.5 px-3 py-1.5',
          'rounded-l-md',
          'border-r-0',
          'hover:bg-white/5'
        )}
        data-state={isDropdownTabActive ? 'active' : 'inactive'}
      >
        <DisplayIcon className='h-3.5 w-3.5' />
        <span>{displayTab.label}</span>
      </button>

      {/* Divider line */}
      <div className={cn(
        'w-px self-stretch',
        'bg-white/20',
        isDropdownTabActive ? 'opacity-60' : 'opacity-30'
      )} />

      {/* Dropdown trigger button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              baseButtonClasses,
              'px-2',
              'rounded-r-md',
              'border-l-0',
              'hover:bg-white/5',
              // Apply open state styling
              'data-[state=open]:bg-white/10',
              'data-[state=open]:shadow-sm'
            )}
            data-state={isDropdownTabActive ? 'active' : 'inactive'}
          >
            <ChevronDown className='h-3.5 w-3.5 opacity-70' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='start'
          className={cn(
            'min-w-[160px] p-1',
            'bg-[#151517] backdrop-blur-md',
            'border border-white/10',
            'rounded-md shadow-lg'
          )}
          sideOffset={8}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <DropdownMenuItem
                key={tab.value}
                onSelect={() => {
                  onTabChange(tab.value)
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2',
                  'rounded-sm px-2.5 py-1.5',
                  'text-sm font-medium',
                  'transition-colors duration-150',

                  // Text colors
                  activeTab === tab.value ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white',

                  // Hover/focus states
                  'hover:bg-white/10 focus:bg-white/10',
                  'outline-none focus:outline-none',

                  // Icon sizing
                  '[&_svg]:h-3.5 [&_svg]:w-3.5'
                )}
              >
                <Icon className='h-3.5 w-3.5' />
                <span>{tab.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}