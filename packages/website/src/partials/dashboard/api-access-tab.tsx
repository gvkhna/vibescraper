'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function APIAccessTab() {
  return (
    <div className='space-y-4'>
      {/* Endpoint Information */}
      <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-5'>
        <div className='mb-3 font-medium text-white'>Endpoint Information</div>
        <div className='space-y-3 text-sm'>
          <div>
            <span className='text-white/60'>Base URL:</span> https://api.webcrawlerstudio.com/v1/
          </div>
          <div>
            <span className='text-white/60'>Authentication:</span> API key header{' '}
            <code className='font-mono'>Authorization: Bearer sk_***</code>
          </div>
          <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              GET /projects/123/data
            </code>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              POST /projects/123/crawl
            </code>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              GET /projects/123/status
            </code>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              PATCH /projects/123/schema
            </code>
          </div>
        </div>
      </div>

      {/* Interactive API Tester */}
      <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-5'>
        <div className='mb-3 font-medium text-white'>Interactive API Tester</div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div>
            <Label>Method</Label>
            <Select defaultValue='GET'>
              <SelectTrigger className='border-white/10 bg-white/5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['GET', 'POST', 'PATCH', 'DELETE'].map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='md:col-span-2'>
            <Label>Endpoint</Label>
            <Input
              className='border-white/10 bg-white/5 font-mono'
              defaultValue='/projects/123/data'
            />
          </div>
          <div className='md:col-span-3'>
            <Label>Parameters / Body (JSON)</Label>
            <Textarea
              className='h-32 border-white/10 bg-white/5 font-mono'
              defaultValue={`{}`}
            />
          </div>
          <div className='flex items-center gap-2 md:col-span-3'>
            <Button className='bg-blue-600 text-white hover:bg-blue-700'>Send</Button>
            <Button
              variant='secondary'
              className='border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
            >
              Test Webhook
            </Button>
          </div>
        </div>
        <div className='mt-4'>
          <Label>Response</Label>
          <pre
            className='mt-2 overflow-auto rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-sm'
          >
            {`{
  "status": "ok",
  "data": []
}`}
          </pre>
        </div>
      </div>

      {/* Webhooks */}
      <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-5'>
        <div className='mb-3 font-medium text-white'>Webhooks</div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div className='md:col-span-2'>
            <Label>Webhook URL</Label>
            <Input
              className='border-white/10 bg-white/5 font-mono'
              placeholder='https://example.com/webhook'
            />
          </div>
          <div className='flex items-end'>
            <Button className='bg-blue-600 text-white hover:bg-blue-700'>Save</Button>
          </div>
          <div className='md:col-span-3'>
            <div className='mb-2 text-white/70'>Events</div>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-4'>
              {['Crawl completed', 'Data updated', 'Errors detected', 'Schema changed'].map((e, i) => (
                <div
                  key={i}
                  className='flex items-center gap-2'
                >
                  <Checkbox id={`wh-${i}`} />
                  <Label htmlFor={`wh-${i}`}>{e}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className='md:col-span-3'>
            <Label>Payload Preview</Label>
            <pre
              className='mt-2 overflow-auto rounded-lg border border-white/10 bg-white/5 p-3 font-mono
                text-sm'
            >
              {`{ "event": "crawl.completed", "projectId": "123", "timestamp": 1690000000 }`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}