/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {type ComponentPropsWithoutRef} from 'react'
import {cn} from '@/lib/utils'
import {type ExtractionPanelTabType} from '@/store/editor-slice'

// Enhanced props with value type for Root component
type ExtractionTabsProps = Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
  'onValueChange' | 'value' | 'defaultValue'
> & {
  value?: ExtractionPanelTabType
  defaultValue?: ExtractionPanelTabType
  onValueChange?: (value: ExtractionPanelTabType) => void
}

// Root component with simplified typing
function ExtractionTabs({className, ...props}: ExtractionTabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot='tabs'
      className={cn('flex flex-col gap-2', className)}
      onValueChange={props.onValueChange as any}
      {...props}
    />
  )
}
ExtractionTabs.displayName = 'ExtractionTabs'

// List component
function ExtractionTabsList({className, ...props}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className
      )}
      {...props}
    />
  )
}
ExtractionTabsList.displayName = 'ExtractionTabsList'

// Enhanced props with value type for Trigger component
type ExtractionTabsTriggerProps = Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, 'value'> & {
  value: ExtractionPanelTabType
}

// Trigger component with typed value
function ExtractionTabsTrigger({className, value, ...props}: ExtractionTabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      value={value as any}
      className={cn(
        `data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring
        focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input
        dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex
        h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border
        border-transparent px-2 py-1 text-sm font-medium transition-[color,box-shadow] focus-visible:outline-1
        focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50
        data-[state=active]:shadow-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none
        [&_svg]:shrink-0`,
        className
      )}
      {...props}
    />
  )
}
ExtractionTabsTrigger.displayName = 'ExtractionTabsTrigger'

// Enhanced props with value type for Content component
type ExtractionTabsContentProps = Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Content>, 'value'> & {
  value: ExtractionPanelTabType
}

// Content component with typed value
function ExtractionTabsContent({className, value, ...props}: ExtractionTabsContentProps) {
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
      value={value as any}
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}
ExtractionTabsContent.displayName = 'ExtractionTabsContent'

export {ExtractionTabs, ExtractionTabsList, ExtractionTabsTrigger, ExtractionTabsContent}
