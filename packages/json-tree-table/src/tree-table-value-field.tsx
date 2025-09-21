import debug from 'debug'
import { ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { type FlatNode, isPrimitive, type TreeNode, type TreeTableEditorProps } from './tree-table-editor'

const log = debug('app:tree-table-value-field')

interface TreeTableValueFieldProps {
  id: string
  node: TreeNode
  row: FlatNode
  disableValueFieldEdit: boolean
  openValueSelector: string | null
  setOpenValueSelector: (state: string | null) => void
  updateValue: (path: string[], value: TreeNode['value']) => void
  getPredefinedValues: (key: string) => string[]
}

export function TreeTableValueField(props: TreeTableValueFieldProps) {
  const {
    openValueSelector,
    id,
    node,
    setOpenValueSelector,
    updateValue,
    row,
    disableValueFieldEdit,
    getPredefinedValues
  } = props

  if (node.type === 'Array' || node.type === 'Object') {
    if (isPrimitive(node.value)) {
      return (
        <div className='flex items-center justify-between truncate'>
          <div className='text-sm text-zinc-400'>{node.value}</div>
        </div>
      )
    }
  }

  if (node.type === 'Boolean') {
    return (
      <Popover
        open={openValueSelector === id}
        onOpenChange={(open) => {
          setOpenValueSelector(open ? id : null)
        }}
      >
        <div className='flex items-center justify-between'>
          <div
            className='flex-1 text-sm text-zinc-400'
            onClick={() => {
              setOpenValueSelector(id)
            }}
          >
            {node.value ? 'yes' : 'no'}
          </div>
          <PopoverTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='ml-1 h-4 w-4 p-0'
            >
              <ChevronsUpDown className='h-3 w-3' />
            </Button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          className='p-0'
          side='right'
          align='start'
        >
          <Command>
            {/* <CommandInput placeholder='Search values...' /> */}
            <CommandList>
              <CommandEmpty>No values found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  key={'yes'}
                  onSelect={() => {
                    updateValue(row.path, true)
                    setOpenValueSelector(null)
                  }}
                >
                  {'yes'}
                </CommandItem>
                <CommandItem
                  key={'no'}
                  onSelect={() => {
                    updateValue(row.path, false)
                    setOpenValueSelector(null)
                  }}
                >
                  {'no'}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  if (isPrimitive(node.value)) {
    return (
      <div className='flex items-center'>
        <Input
          value={String(node.value)}
          onChange={(e) => {
            let value = e.target.value
            if (node.type === 'Number') {
              const num = Number(value)
              value = String(isNaN(num) ? 0 : num)
            }
            updateValue(row.path, value)
          }}
          className='h-6 border-none bg-transparent p-0 text-sm focus-visible:ring-0
            focus-visible:ring-offset-0'
        />
        {node.type === 'String' && getPredefinedValues(node.name).length > 0 && (
          <Popover
            open={openValueSelector === id}
            onOpenChange={(open) => {
              setOpenValueSelector(open ? id : null)
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='ml-1 h-4 w-4 p-0'
              >
                <ChevronsUpDown className='h-3 w-3' />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='p-0'
              side='right'
              align='start'
            >
              <Command>
                <CommandInput placeholder='Search values...' />
                <CommandList>
                  <CommandEmpty>No values found.</CommandEmpty>
                  <CommandGroup>
                    {getPredefinedValues(node.name).map((value) => (
                      <CommandItem
                        key={value}
                        onSelect={() => {
                          updateValue(row.path, value)
                          setOpenValueSelector(null)
                        }}
                      >
                        {value}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    )
  }

  return (
    <div className='flex items-center justify-between truncate'>
      <div className='text-sm text-zinc-400'>{`(Field Error)`}</div>
    </div>
  )
}
