'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'
import {Checkbox} from '@/components/ui/checkbox'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Code2, Globe} from 'lucide-react'
import {GlassCard} from '@/components/quick-stats'

export function DataExplorer() {
  const [mode, setMode] = React.useState<'sql' | 'visual'>('sql')

  return (
    <div className='space-y-4'>
      <GlassCard className='p-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant={mode === 'sql' ? 'default' : 'secondary'}
              className={
                mode === 'sql'
                  ? 'bg-[#3B82F6] hover:bg-[#3B82F6]/80'
                  : 'border-white/10 bg-white/10 hover:bg-white/20'
              }
              onClick={() => {
                setMode('sql')
              }}
            >
              <Code2 className='mr-2 h-4 w-4' /> SQL
            </Button>
            <Button
              variant={mode === 'visual' ? 'default' : 'secondary'}
              className={
                mode === 'visual'
                  ? 'bg-[#3B82F6] hover:bg-[#3B82F6]/80'
                  : 'border-white/10 bg-white/10 hover:bg-white/20'
              }
              onClick={() => {
                setMode('visual')
              }}
            >
              <Globe className='mr-2 h-4 w-4' /> Visual
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <Select defaultValue='recent'>
              <SelectTrigger className='min-w-48 border-white/10 bg-white/5'>
                <SelectValue placeholder='Saved Queries' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='recent'>Recent Products</SelectItem>
                <SelectItem value='errors'>Records With Errors</SelectItem>
              </SelectContent>
            </Select>
            <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Run Query</Button>
            <Button
              variant='secondary'
              className='border-white/10 bg-white/10 hover:bg-white/20'
            >
              Export
            </Button>
          </div>
        </div>
        <div className='mt-3'>
          {mode === 'sql' ? (
            <Textarea
              className='h-40 border-white/10 bg-white/5 font-mono'
              defaultValue={
                'SELECT title, price, in_stock FROM products WHERE price > 0 ORDER BY updated_at DESC LIMIT 100;'
              }
            />
          ) : (
            <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
              <div>
                <Label>Fields</Label>
                <Select defaultValue='title,price,in_stock'>
                  <SelectTrigger className='border-white/10 bg-white/5'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='title,price,in_stock'>title, price, in_stock</SelectItem>
                    <SelectItem value='title,price'>title, price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='md:col-span-2'>
                <Label>Condition</Label>
                <Input
                  className='border-white/10 bg-white/5'
                  placeholder='price > 0 AND in_stock = TRUE'
                />
              </div>
              <div>
                <Label>Sort</Label>
                <Input
                  className='border-white/10 bg-white/5'
                  placeholder='updated_at DESC'
                />
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className='overflow-hidden p-0'>
        <div className='flex items-center justify-between p-3'>
          <div className='text-sm text-white/70'>234 records</div>
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Columns
            </Button>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Filters
            </Button>
          </div>
        </div>
        <div className='overflow-auto'>
          <Table>
            <TableHeader className='sticky top-0 border-white/10 bg-white/5 backdrop-blur'>
              <TableRow>
                <TableHead className='w-10'></TableHead>
                <TableHead>title</TableHead>
                <TableHead>price</TableHead>
                <TableHead>in_stock</TableHead>
                <TableHead>json</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({length: 10}).map((_, i) => (
                <TableRow
                  key={i}
                  className='hover:bg-[#3B82F6]/10'
                >
                  <TableCell>
                    <Checkbox aria-label={`Select row ${i + 1}`} />
                  </TableCell>
                  <TableCell className='truncate'>ACME Widget {i + 1}</TableCell>
                  <TableCell>$19.{(90 + i) % 100}</TableCell>
                  <TableCell>{i % 3 === 0 ? 'false' : 'true'}</TableCell>
                  <TableCell>
                    <pre
                      className='max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap font-mono
                        text-xs'
                    >
                      {'{ "colors": ["red","blue"], "sku": "ACME-' + String(1000 + i) + '" }'}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-between border-t border-white/10 p-3'>
          <div className='text-sm text-white/70'>Completeness: 97% • Anomalies: 3 • Updated: just now</div>
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Export selected
            </Button>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Delete selected
            </Button>
            <Button className='h-8 bg-[#10B981] hover:bg-[#10B981]/80'>Re-process selected</Button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}