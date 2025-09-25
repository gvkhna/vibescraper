import React from 'react'
import { Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

export interface TooltipDescriptionProps {
  disabled?: boolean
  description: string | null | undefined
  onDescriptionChange: (value: string) => void
}

export const TooltipDescription = (props: TooltipDescriptionProps) => {
  const [description, setDescription] = React.useState(props.description ?? '')
  const [isOpen, setIsOpen] = React.useState(false)

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue: string | null = e.target.value
    setDescription(newValue)
    // if (props.onDescriptionChange) {
    props.onDescriptionChange(newValue)
    // }
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='mr-2 h-4 w-4 p-0'
        >
          <Info className='h-3 w-3' />
        </Button>
        {/* <button
          className='inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700
            focus:outline-none focus:ring-2 focus:ring-gray-200'
          aria-label='Edit description'
        >
          <Info size={16} />
        </button> */}
      </PopoverTrigger>
      <PopoverContent
        className='w-64 p-0'
        side='right'
        align='start'
        onInteractOutside={() => {
          setIsOpen(false)
        }}
      >
        {props.disabled ? (
          <p
            className='flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm
              placeholder:text-slate-500 focus-visible:ring-0 focus-visible:outline-none
              disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950
              dark:placeholder:text-slate-400'
          >
            {description}
          </p>
        ) : (
          <Textarea
            placeholder='Add description...'
            className='min-h-24 resize-none border-0 focus:ring-0'
            value={description}
            onChange={handleDescriptionChange}
            autoFocus
            onFocus={(e) => {
              // Place cursor at the end
              const value = e.target.value
              e.target.value = ''
              e.target.value = value
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
