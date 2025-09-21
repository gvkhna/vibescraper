'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { CleaningMethod, ExtractorSettings } from '@/db/schema/project'

interface ExtractionTabContentProps {
  extractorSettings: ExtractorSettings
  setExtractorSettings: React.Dispatch<React.SetStateAction<ExtractorSettings>>
}

export function ExtractionTabContent({
  extractorSettings,
  setExtractorSettings
}: ExtractionTabContentProps) {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <Label
            htmlFor='cleaning-method'
            className='text-white/80'
          >
            HTML Processing Method
          </Label>
          <Select
            value={extractorSettings.cleaningMethod}
            onValueChange={(v: CleaningMethod) => {
              setExtractorSettings({ ...extractorSettings, cleaningMethod: v })
            }}
          >
            <SelectTrigger
              id='cleaning-method'
              className='mt-2 border-white/20 bg-[#0A0A0B]'
            >
              <SelectValue placeholder='Select processing method'>
                {extractorSettings.cleaningMethod === 'raw-html' && 'Raw HTML'}
                {extractorSettings.cleaningMethod === 'cleaned-html' && 'Cleaned HTML'}
                {extractorSettings.cleaningMethod === 'filtered-html' && 'Filtered HTML'}
                {extractorSettings.cleaningMethod === 'readability-html' && 'Readability'}
                {extractorSettings.cleaningMethod === 'markdown' && 'Markdown'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className='border-white/10 bg-[#1a1a1b]'>
              <SelectItem
                value='raw-html'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Raw HTML</div>
                  <div className='text-xs text-white/50'>Unprocessed HTML content</div>
                </div>
              </SelectItem>
              <SelectItem
                value='cleaned-html'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Cleaned HTML</div>
                  <div className='text-xs text-white/50'>Basic cleanup and formatting</div>
                </div>
              </SelectItem>
              <SelectItem
                value='filtered-html'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Filtered HTML</div>
                  <div className='text-xs text-white/50'>Removes unwanted tags and attributes</div>
                </div>
              </SelectItem>
              <SelectItem
                value='readability-html'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Readability</div>
                  <div className='text-xs text-white/50'>Extracts main content only</div>
                </div>
              </SelectItem>
              <SelectItem
                value='markdown'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Markdown</div>
                  <div className='text-xs text-white/50'>Converts to Markdown format</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-3'>
          <Label className='text-white/80'>HTML Filter Options</Label>
          <div className='space-y-3 rounded-lg border border-white/10 bg-[#0A0A0B] p-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <div className='text-sm font-medium text-white/80'>Remove Comments</div>
                <div className='text-xs text-white/50'>Strip HTML comments from output</div>
              </div>
              <Switch
                checked={extractorSettings.htmlFilter.removeComments}
                onCheckedChange={(checked) => {
                  const htmlFilter = { ...extractorSettings.htmlFilter, removeComments: checked }
                  setExtractorSettings({ ...extractorSettings, htmlFilter })
                }}
                className='data-[state=checked]:bg-blue-500'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <div className='text-sm font-medium text-white/80'>Remove Head Section</div>
                <div className='text-xs text-white/50'>Exclude &lt;head&gt; content</div>
              </div>
              <Switch
                checked={extractorSettings.htmlFilter.removeHead}
                onCheckedChange={(checked) => {
                  const htmlFilter = { ...extractorSettings.htmlFilter, removeHead: checked }
                  setExtractorSettings({ ...extractorSettings, htmlFilter })
                }}
                className='data-[state=checked]:bg-blue-500'
              />
            </div>
          </div>
        </div>

        <div>
          <Label
            htmlFor='extractor-timeout'
            className='text-white/80'
          >
            Extraction Timeout
          </Label>
          <div className='mt-2 flex items-center gap-2'>
            <Input
              id='extractor-timeout'
              type='number'
              value={extractorSettings.timeout / 1000}
              onChange={(e) => {
                setExtractorSettings({
                  ...extractorSettings,
                  timeout: parseInt(e.target.value) * 1000 || 30000
                })
              }}
              className='border-white/20 bg-[#0A0A0B]'
            />
            <span className='text-sm text-white/50'>seconds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
