import * as React from 'react'
import { GripVerticalIcon } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/lib/utils'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot='resizable-panel-group'
      className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return (
    <ResizablePrimitive.Panel
      data-slot='resizable-panel'
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot='resizable-handle'
      className={cn(
        'relative flex w-1 items-center justify-center bg-transparent transition-colors duration-200',
        'hover:bg-white/20',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2',
        'focus-visible:bg-white/20 focus-visible:outline-none',
        'data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-full',
        'data-[panel-group-direction=vertical]:hover:bg-white/20',
        'data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-4',
        `data-[panel-group-direction=vertical]:after:w-full
        data-[panel-group-direction=vertical]:after:translate-x-0`,
        'data-[panel-group-direction=vertical]:after:-translate-y-1/2',
        '[&[data-panel-group-direction=vertical]>div]:rotate-90',
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className='bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border opacity-0'>
          <GripVerticalIcon className='size-2.5' />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
