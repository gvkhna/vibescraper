'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Checkbox} from '@/components/ui/checkbox'
import {GlassCard} from '@/components/quick-stats'

export function DataSchemaEditor() {
  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      {/* Left: Schema Definition */}
      <GlassCard className='p-5'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div className='md:col-span-2'>
            <Label>Schema Name</Label>
            <Input
              className='border-white/10 bg-white/5'
              defaultValue='product_schema'
            />
          </div>
          <div>
            <Label>Version</Label>
            <Input
              className='border-white/10 bg-white/5'
              defaultValue='3'
              readOnly
            />
          </div>
        </div>

        <div className='mt-5 space-y-4'>
          {[
            {name: 'title', type: 'string', required: true},
            {name: 'price', type: 'number', required: true}
          ].map((f, i) => (
            <div
              key={i}
              className='rounded-lg border border-white/10 bg-white/5 p-4'
            >
              <div className='grid grid-cols-1 gap-3 md:grid-cols-5'>
                <div className='md:col-span-2'>
                  <Label>Field name</Label>
                  <Input
                    className='border-white/10 bg-white/5 font-mono'
                    defaultValue={f.name}
                  />
                </div>
                <div className='md:col-span-2'>
                  <Label>Field type</Label>
                  <Select defaultValue={f.type}>
                    <SelectTrigger className='border-white/10 bg-white/5'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['string', 'number', 'boolean', 'date', 'array', 'object'].map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex items-end gap-2'>
                  <Switch
                    id={`req-${i}`}
                    defaultChecked={f.required}
                  />
                  <Label htmlFor={`req-${i}`}>Required</Label>
                </div>
              </div>
              <div className='mt-3'>
                <details>
                  <summary className='cursor-pointer text-white/80'>Validation rules</summary>
                  <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
                    <div>
                      <Label>Min length/value</Label>
                      <Input
                        className='border-white/10 bg-white/5'
                        placeholder='0'
                      />
                    </div>
                    <div>
                      <Label>Max length/value</Label>
                      <Input
                        className='border-white/10 bg-white/5'
                        placeholder='255'
                      />
                    </div>
                    <div>
                      <Label>Regex</Label>
                      <Input
                        className='border-white/10 bg-white/5 font-mono'
                        placeholder='^\\d+(\\.\\d{2})?$'
                      />
                    </div>
                    <div className='md:col-span-3'>
                      <Label>Custom validation function</Label>
                      <Textarea
                        className='border-white/10 bg-white/5 font-mono'
                        rows={4}
                        placeholder='function validate(value) { return true }'
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ))}
          <Button
            className='border-white/10 bg-white/10 hover:bg-white/20'
            variant='secondary'
          >
            Add Field
          </Button>
        </div>

        <div className='mt-5'>
          <div className='font-medium'>Data Processing</div>
          <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
            {[
              'Convert to Markdown',
              'Clean HTML (readability)',
              'Deep clean (content only)',
              'Extract text only',
              'Preserve images'
            ].map((label, i) => (
              <div
                key={i}
                className='flex items-center gap-2'
              >
                <Checkbox id={`proc-${i}`} />
                <Label htmlFor={`proc-${i}`}>{label}</Label>
              </div>
            ))}
          </div>
          <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='trim'
                defaultChecked
              />
              <Label htmlFor='trim'>Trim whitespace</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='iso'
                defaultChecked
              />
              <Label htmlFor='iso'>Convert dates to ISO</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='normalize'
                defaultChecked
              />
              <Label htmlFor='normalize'>Normalize URLs</Label>
            </div>
            <div className='md:col-span-3'>
              <Label>Custom transformation functions</Label>
              <Textarea
                className='border-white/10 bg-white/5 font-mono'
                rows={6}
                placeholder='// JavaScript code&#10;export default (record) => record'
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Right: Live Preview */}
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Live Preview</div>
        <div className='mb-3'>
          <Label>Test Against URL</Label>
          <div className='mt-2 flex gap-2'>
            <Input
              className='border-white/10 bg-white/5 font-mono'
              placeholder='https://example.com/products/123'
            />
            <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Test</Button>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-3'>
          <div>
            <div className='mb-2 text-sm text-white/70'>Sample Data</div>
            <pre className='overflow-auto rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-sm'>
              {`{
  "title": "ACME Widget",
  "price": 19.99,
  "in_stock": true
}`}
            </pre>
          </div>
          <div>
            <div className='mb-2 text-sm text-white/70'>Validation Results</div>
            <ul className='space-y-1 text-sm'>
              <li className='text-[#10B981]'>✓ All fields valid</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}