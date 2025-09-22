'use client'

import * as React from 'react'
import { PanelLeftClose, Play, Plus, Save, Trash2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface SchemaPanelProps {
  currentUrl: string
  onClose: () => void
}

export function SchemaPanel({ currentUrl, onClose }: SchemaPanelProps) {
  const [fields, setFields] = React.useState([
    { id: '1', name: 'product_name', type: 'string', selector: 'h1', required: true },
    { id: '2', name: 'price', type: 'number', selector: '.price', required: true },
    { id: '3', name: 'availability', type: 'boolean', selector: '.in-stock', required: false }
  ])

  const addField = () => {
    const newField = {
      id: Date.now().toString(),
      name: '',
      type: 'string',
      selector: '',
      required: false
    }
    setFields([...fields, newField])
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<(typeof fields)[0]>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  return (
    <div className='flex h-full flex-col border-r border-white/10 bg-[#151517]'>
      {/* Header */}
      <div className='flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 px-4'>
        <div className='flex items-center gap-2'>
          <h2 className='font-medium'>Schema Editor</h2>
          <Badge
            variant='secondary'
            className='bg-white/10 text-xs'
          >
            v2
          </Badge>
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClose}
          className='h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white'
        >
          <PanelLeftClose className='h-4 w-4' />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className='flex-1'>
        <div className='space-y-4 p-4'>
          {/* Schema Info */}
          <div className='space-y-3'>
            <div>
              <Label className='text-sm'>Schema Name</Label>
              <Input
                defaultValue='product_schema'
                className='mt-1 border-white/20 bg-[#0A0A0B]'
              />
            </div>
            <div>
              <Label className='text-sm'>Target URL Pattern</Label>
              <Input
                defaultValue='/products/*'
                className='mt-1 border-white/20 bg-[#0A0A0B] font-mono text-sm'
              />
            </div>
          </div>

          {/* Fields */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium'>Fields</Label>
              <Button
                size='sm'
                onClick={addField}
                className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'
              >
                <Plus className='mr-2 h-4 w-4' />
                Add Field
              </Button>
            </div>

            {fields.map((field) => (
              <div
                key={field.id}
                className='space-y-3 rounded-lg border border-white/10 bg-[#0A0A0B] p-3'
              >
                <div className='flex items-center justify-between'>
                  <Input
                    placeholder='Field name'
                    value={field.name}
                    onChange={(e) => {
                      updateField(field.id, { name: e.target.value })
                    }}
                    className='border-none bg-transparent p-0 font-medium'
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => {
                      removeField(field.id)
                    }}
                    className='h-8 w-8 text-red-400 hover:bg-red-400/10 hover:text-red-300'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Label className='text-xs text-white/60'>Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => {
                        updateField(field.id, { type: value })
                      }}
                    >
                      <SelectTrigger className='h-8 border-white/20 bg-transparent'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='string'>String</SelectItem>
                        <SelectItem value='number'>Number</SelectItem>
                        <SelectItem value='boolean'>Boolean</SelectItem>
                        <SelectItem value='array'>Array</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex items-end'>
                    <div className='flex items-center gap-2'>
                      <Switch
                        id={`required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => {
                          updateField(field.id, { required: checked })
                        }}
                      />
                      <Label
                        htmlFor={`required-${field.id}`}
                        className='text-xs text-white/60'
                      >
                        Required
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className='text-xs text-white/60'>CSS Selector</Label>
                  <Input
                    placeholder='e.g., .price, h1, [data-price]'
                    value={field.selector}
                    onChange={(e) => {
                      updateField(field.id, { selector: e.target.value })
                    }}
                    className='mt-1 border-white/20 bg-transparent font-mono text-sm'
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className='space-y-2 border-t border-white/10 pt-4'>
            <Button className='w-full bg-[#3B82F6] hover:bg-[#3B82F6]/80'>
              <Play className='mr-2 h-4 w-4' />
              Test Extraction
            </Button>
            <Button
              variant='secondary'
              className='w-full border-white/10 bg-white/10 hover:bg-white/20'
            >
              <Save className='mr-2 h-4 w-4' />
              Save Schema
            </Button>
          </div>

          {/* Preview */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>Schema Preview</Label>
            <div className='rounded-lg border border-white/10 bg-[#0D1117] p-3'>
              <pre className='font-mono text-xs text-gray-300'>
                {JSON.stringify(
                  fields.reduce<Record<string, string>>((acc, field) => {
                    if (field.name) {
                      acc[field.name] = field.type
                    }
                    return acc
                  }, {}),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
