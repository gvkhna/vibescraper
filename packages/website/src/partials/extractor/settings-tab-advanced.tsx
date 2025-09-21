'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExtractorSettings, ProjectCommitSettings } from '@/db/schema/project'

interface AdvancedTabContentProps {
  commitSettings: ProjectCommitSettings
  setCommitSettings: React.Dispatch<React.SetStateAction<ProjectCommitSettings>>
  extractorSettings: ExtractorSettings
  setExtractorSettings: React.Dispatch<React.SetStateAction<ExtractorSettings>>
}

export function AdvancedTabContent({
  commitSettings,
  setCommitSettings,
  extractorSettings,
  setExtractorSettings
}: AdvancedTabContentProps) {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label
              htmlFor='max-retries'
              className='text-white/80'
            >
              Max Retries
            </Label>
            <Input
              id='max-retries'
              type='number'
              value={commitSettings.maxRetries}
              onChange={(e) => {
                setCommitSettings({ ...commitSettings, maxRetries: parseInt(e.target.value) || 3 })
              }}
              className='mt-2 border-white/20 bg-[#0A0A0B]'
            />
          </div>

          <div>
            <Label
              htmlFor='retry-delay'
              className='text-white/80'
            >
              Retry Delay
            </Label>
            <div className='mt-2 flex items-center gap-2'>
              <Input
                id='retry-delay'
                type='number'
                value={commitSettings.retryDelay / 1000}
                onChange={(e) => {
                  setCommitSettings({
                    ...commitSettings,
                    retryDelay: parseInt(e.target.value) * 1000 || 5000
                  })
                }}
                className='border-white/20 bg-[#0A0A0B]'
              />
              <span className='text-sm text-white/50'>seconds</span>
            </div>
          </div>
        </div>

        <div>
          <Label
            htmlFor='user-agent'
            className='text-white/80'
          >
            User Agent
            <span className='ml-2 text-xs text-white/50'>(optional)</span>
          </Label>
          <Input
            id='user-agent'
            value={commitSettings.crawler.userAgent ?? ''}
            onChange={(e) => {
              const crawler = { ...commitSettings.crawler, userAgent: e.target.value }
              setCommitSettings({ ...commitSettings, crawler })
            }}
            className='mt-2 border-white/20 bg-[#0A0A0B] font-mono text-xs'
            placeholder='Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
          />
        </div>

        <div>
          <Label
            htmlFor='success-codes'
            className='text-white/80'
          >
            Success Status Codes
          </Label>
          <Input
            id='success-codes'
            value={commitSettings.crawler.successStatusCodes.join(', ')}
            onChange={(e) => {
              const codes = e.target.value
                .split(',')
                .map((c) => parseInt(c.trim()))
                .filter(Boolean)
              const crawler = { ...commitSettings.crawler, successStatusCodes: codes }
              setCommitSettings({ ...commitSettings, crawler })
            }}
            className='mt-2 border-white/20 bg-[#0A0A0B]'
            placeholder='200, 201, 204'
          />
          <div className='mt-1 text-xs text-white/50'>
            Comma-separated HTTP status codes to consider successful
          </div>
        </div>

        <div>
          <Label
            htmlFor='max-output'
            className='text-white/80'
          >
            Max Output Size
          </Label>
          <div className='mt-2 flex items-center gap-2'>
            <Input
              id='max-output'
              type='number'
              value={extractorSettings.maxOutputSize === -1 ? '' : extractorSettings.maxOutputSize}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : -1
                setExtractorSettings({ ...extractorSettings, maxOutputSize: value })
              }}
              className='border-white/20 bg-[#0A0A0B]'
              placeholder='Unlimited'
            />
            <span className='text-sm text-white/50'>bytes</span>
          </div>
          <div className='mt-1 text-xs text-white/50'>Leave empty for unlimited output size</div>
        </div>
      </div>
    </div>
  )
}
