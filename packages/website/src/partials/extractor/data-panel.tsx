'use client'

import * as React from 'react'
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Filter,
  PanelBottomClose,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface DataPanelProps {
  onClose: () => void
}

export function DataPanel({ onClose }: DataPanelProps) {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')

  const data = [
    {
      id: '1',
      product_name: 'ACME Widget',
      price: 19.99,
      availability: true,
      extracted_at: '2025-08-07 11:24'
    },
    {
      id: '2',
      product_name: 'Super Tool',
      price: 29.99,
      availability: false,
      extracted_at: '2025-08-07 11:23'
    },
    {
      id: '3',
      product_name: 'Magic Device',
      price: 39.99,
      availability: true,
      extracted_at: '2025-08-07 11:22'
    },
    {
      id: '4',
      product_name: 'Pro Gadget',
      price: 49.99,
      availability: true,
      extracted_at: '2025-08-07 11:21'
    },
    {
      id: '5',
      product_name: 'Elite Kit',
      price: 59.99,
      availability: false,
      extracted_at: '2025-08-07 11:20'
    }
  ]

  const filteredData = data.filter((item) =>
    item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedRows((prev) => (prev.length === filteredData.length ? [] : filteredData.map((row) => row.id)))
  }

  return (
    <div className='flex h-full flex-col border-t border-white/10 bg-[#151517]'>
      {/* Header */}
      <div className='flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 px-4'>
        <div className='flex items-center gap-3'>
          <Database className='h-4 w-4 text-[#3B82F6]' />
          <h2 className='font-medium'>Extracted Data</h2>
          <Badge
            variant='secondary'
            className='bg-white/10 text-xs'
          >
            {filteredData.length} records
          </Badge>
          <div className='text-xs text-white/60'>Success: 98.4% • Updated: 2m ago</div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white'
          >
            <PanelBottomClose className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className='flex h-10 flex-shrink-0 items-center justify-between border-b border-white/10 px-4'>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 transform text-white/40' />
            <Input
              placeholder='Search records...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              className='h-7 w-48 border-white/20 bg-[#0A0A0B] pl-7 text-sm'
            />
          </div>

          <Button
            variant='ghost'
            size='sm'
            className='h-7 text-white/60 hover:bg-white/10 hover:text-white'
          >
            <Filter className='mr-1 h-3 w-3' />
            Filter
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          {selectedRows.length > 0 && (
            <>
              <Button
                variant='secondary'
                size='sm'
                className='h-7 border-white/10 bg-white/10 text-xs hover:bg-white/20'
              >
                <RefreshCw className='mr-1 h-3 w-3' />
                Re-process ({selectedRows.length})
              </Button>
              <Button
                variant='destructive'
                size='sm'
                className='h-7 text-xs'
              >
                <Trash2 className='mr-1 h-3 w-3' />
                Delete
              </Button>
            </>
          )}

          <Button
            variant='secondary'
            size='sm'
            className='h-7 border-white/10 bg-white/10 text-xs hover:bg-white/20'
          >
            <FileJson className='mr-1 h-3 w-3' />
            JSON
          </Button>

          <Button
            variant='secondary'
            size='sm'
            className='h-7 border-white/10 bg-white/10 text-xs hover:bg-white/20'
          >
            <FileSpreadsheet className='mr-1 h-3 w-3' />
            CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className='flex-1'>
        <Table>
          <TableHeader className='sticky top-0 z-10 bg-[#151517]'>
            <TableRow className='border-white/10'>
              <TableHead className='w-10'>
                <Checkbox
                  checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className='text-white/80'>Product</TableHead>
              <TableHead className='text-white/80'>Price</TableHead>
              <TableHead className='text-white/80'>Status</TableHead>
              <TableHead className='text-white/80'>Extracted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow
                key={row.id}
                className='border-white/10 hover:bg-white/5'
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onCheckedChange={() => {
                      toggleRow(row.id)
                    }}
                  />
                </TableCell>
                <TableCell className='font-medium'>{row.product_name}</TableCell>
                <TableCell className='font-mono text-sm'>${row.price}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      row.availability
                        ? 'border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]'
                        : 'border-red-400/30 bg-red-400/20 text-red-400'
                    }
                  >
                    {row.availability ? 'Available' : 'Out of Stock'}
                  </Badge>
                </TableCell>
                <TableCell className='font-mono text-xs text-white/60'>{row.extracted_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
