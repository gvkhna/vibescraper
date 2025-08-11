'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export function MonitoringTab() {
  return (
    <div className='space-y-4'>
      {/* Metrics Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6'>
        {[
          {label: 'Success Rate', value: '98.4%', color: '#10B981'},
          {label: 'Pages Crawled (today)', value: '12,430', color: '#3B82F6'},
          {label: 'Data Extracted', value: '4,220', color: '#8B5CF6'},
          {label: 'Avg Response (ms)', value: '420', color: '#F59E0B'},
          {label: 'Error Rate', value: '1.6%', color: '#EF4444'},
          {label: 'Queue Pending', value: '32', color: '#22D3EE'}
        ].map((m, i) => (
          <div
            key={i}
            className='rounded-lg border border-white/10 bg-[#0f0f10] p-4'
          >
            <div className='text-sm text-white/60'>{m.label}</div>
            <div className='text-2xl font-semibold text-white'>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Crawl History */}
      <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-5'>
        <div className='mb-3 font-medium text-white'>Crawl History</div>
        <div className='overflow-auto'>
          <Table>
            <TableHeader className='sticky top-0 border-white/10 bg-white/5 backdrop-blur'>
              <TableRow>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({length: 6}).map((_, i) => (
                <TableRow
                  key={i}
                  className='hover:bg-[#3B82F6]/10'
                >
                  <TableCell>2025-08-07 11:{10 + i}</TableCell>
                  <TableCell>{5 + i}m</TableCell>
                  <TableCell>{1500 + i * 100}</TableCell>
                  <TableCell>{600 + i * 50}</TableCell>
                  <TableCell>
                    {i % 4 === 0 ? (
                      <span className='text-red-400'>Failed</span>
                    ) : (
                      <span className='text-[#10B981]'>Success</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='secondary'
                      className='h-8 border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
                    >
                      Re-run
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-5'>
        <div className='mb-3 font-medium text-white'>Alerts & Notifications</div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <div className='mb-2 text-white/70'>Active Alerts</div>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-red-500' /> Crawl failures detected (2)
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-yellow-500' /> Rate limit hits increased
              </li>
            </ul>
          </div>
          <div>
            <div className='mb-2 text-white/70'>Alert Configuration</div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <div className='flex items-center gap-2'>
                <Checkbox defaultChecked /> <Label>Schema validation failures</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox defaultChecked /> <Label>Crawl failures</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox /> <Label>Rate limit hits</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox /> <Label>Data anomalies</Label>
              </div>
              <div className='md:col-span-2'>
                <Label>Notification channel</Label>
                <Select defaultValue='email'>
                  <SelectTrigger className='mt-1 border-white/10 bg-white/5'>
                    <SelectValue placeholder='Select' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='email'>Email</SelectItem>
                    <SelectItem value='webhook'>Webhook</SelectItem>
                    <SelectItem value='slack'>Slack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity threshold</Label>
                <Input
                  className='mt-1 border-white/10 bg-white/5'
                  placeholder='High'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}