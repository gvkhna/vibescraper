'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ProjectCommitSettings } from '@/db/schema/project'

interface CrawlerTabContentProps {
  commitSettings: ProjectCommitSettings
  setCommitSettings: React.Dispatch<React.SetStateAction<ProjectCommitSettings>>
}

export function CrawlerTabContent({
  commitSettings,
  setCommitSettings
}: CrawlerTabContentProps) {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label
              htmlFor='follow-links'
              className='text-white/80'
            >
              Follow Links
            </Label>
            <div className='text-xs text-white/50'>Automatically crawl linked pages</div>
          </div>
          <Switch
            id='follow-links'
            checked={commitSettings.crawler.followLinks}
            onCheckedChange={(checked) => {
              const crawler = { ...commitSettings.crawler, followLinks: checked }
              setCommitSettings({ ...commitSettings, crawler })
            }}
            className='data-[state=checked]:bg-blue-500'
          />
        </div>

        {commitSettings.crawler.followLinks && (
          <>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label
                  htmlFor='max-depth'
                  className='text-white/80'
                >
                  Max Crawl Depth
                </Label>
                <Input
                  id='max-depth'
                  type='number'
                  value={commitSettings.crawler.maxDepth}
                  onChange={(e) => {
                    const crawler = { ...commitSettings.crawler, maxDepth: parseInt(e.target.value) || 3 }
                    setCommitSettings({ ...commitSettings, crawler })
                  }}
                  className='mt-2 border-white/20 bg-[#0A0A0B]'
                />
              </div>

              <div>
                <Label
                  htmlFor='max-concurrency'
                  className='text-white/80'
                >
                  Max Concurrent Requests
                </Label>
                <Input
                  id='max-concurrency'
                  type='number'
                  value={commitSettings.crawler.maxConcurrency}
                  onChange={(e) => {
                    const crawler = {
                      ...commitSettings.crawler,
                      maxConcurrency: parseInt(e.target.value) || 1
                    }
                    setCommitSettings({ ...commitSettings, crawler })
                  }}
                  className='mt-2 border-white/20 bg-[#0A0A0B]'
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor='url-mask'
                className='text-white/80'
              >
                URL Pattern
                <span className='ml-2 text-xs text-white/50'>(optional regex)</span>
              </Label>
              <Input
                id='url-mask'
                value={commitSettings.crawler.urlMask ?? ''}
                onChange={(e) => {
                  const crawler = { ...commitSettings.crawler, urlMask: e.target.value }
                  setCommitSettings({ ...commitSettings, crawler })
                }}
                className='mt-2 border-white/20 bg-[#0A0A0B] font-mono'
                placeholder='/products/.*'
              />
            </div>
          </>
        )}

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label
              htmlFor='respect-robots'
              className='text-white/80'
            >
              Respect robots.txt
            </Label>
            <div className='text-xs text-white/50'>Follow robots.txt rules</div>
          </div>
          <Switch
            id='respect-robots'
            checked={commitSettings.crawler.respectRobotsTxt}
            onCheckedChange={(checked) => {
              const crawler = { ...commitSettings.crawler, respectRobotsTxt: checked }
              setCommitSettings({ ...commitSettings, crawler })
            }}
            className='data-[state=checked]:bg-blue-500'
          />
        </div>
      </div>
    </div>
  )
}
