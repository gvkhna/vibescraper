'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FetchType, ProjectCommitSettings, ScheduleType } from '@/db/schema/project'

interface FetchingTabContentProps {
  commitSettings: ProjectCommitSettings
  setCommitSettings: React.Dispatch<React.SetStateAction<ProjectCommitSettings>>
}

export function FetchingTabContent({
  commitSettings,
  setCommitSettings
}: FetchingTabContentProps) {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <Label
            htmlFor='fetch-type'
            className='text-white/80'
          >
            Fetch Method
          </Label>
          <Select
            value={commitSettings.fetchType}
            onValueChange={(v: FetchType) => {
              setCommitSettings({ ...commitSettings, fetchType: v })
            }}
          >
            <SelectTrigger
              id='fetch-type'
              className='mt-2 border-white/20 bg-[#0A0A0B]'
            >
              <SelectValue placeholder='Select fetch method'>
                {commitSettings.fetchType === 'fetch' && 'Simple Fetch'}
                {commitSettings.fetchType === 'playwright' && 'Playwright'}
                {commitSettings.fetchType === 'playwright-stealth' && 'Playwright Stealth'}
                {commitSettings.fetchType === 'camoufox' && 'Camoufox'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className='border-white/10 bg-[#1a1a1b]'>
              <SelectItem
                value='fetch'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Simple Fetch</div>
                  <div className='text-xs text-white/50'>Fast, lightweight HTTP requests</div>
                </div>
              </SelectItem>
              <SelectItem
                value='playwright'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Playwright</div>
                  <div className='text-xs text-white/50'>Full browser rendering for JS sites</div>
                </div>
              </SelectItem>
              <SelectItem
                value='playwright-stealth'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Playwright Stealth</div>
                  <div className='text-xs text-white/50'>Bypasses basic anti-bot detection</div>
                </div>
              </SelectItem>
              <SelectItem
                value='camoufox'
                className='text-white/90'
              >
                <div className='space-y-0.5'>
                  <div>Camoufox</div>
                  <div className='text-xs text-white/50'>Advanced anti-detection browser</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor='schedule'
            className='text-white/80'
          >
            Schedule
          </Label>
          <Select
            value={commitSettings.schedule}
            onValueChange={(v: ScheduleType) => {
              setCommitSettings({ ...commitSettings, schedule: v })
            }}
          >
            <SelectTrigger
              id='schedule'
              className='mt-2 border-white/20 bg-[#0A0A0B]'
            >
              <SelectValue placeholder='Select schedule'>
                {commitSettings.schedule === 'manual' && 'Manual'}
                {commitSettings.schedule === 'every-6-hours' && 'Every 6 hours'}
                {commitSettings.schedule === 'daily' && 'Daily'}
                {commitSettings.schedule === 'weekly' && 'Weekly'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className='border-white/10 bg-[#1a1a1b]'>
              <SelectItem
                value='manual'
                className='text-white/90'
              >
                Manual
              </SelectItem>
              <SelectItem
                value='every-6-hours'
                className='text-white/90'
              >
                Every 6 hours
              </SelectItem>
              <SelectItem
                value='daily'
                className='text-white/90'
              >
                Daily
              </SelectItem>
              <SelectItem
                value='weekly'
                className='text-white/90'
              >
                Weekly
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label
              htmlFor='timeout'
              className='text-white/80'
            >
              Request Timeout
            </Label>
            <div className='mt-2 flex items-center gap-2'>
              <Input
                id='timeout'
                type='number'
                value={commitSettings.crawler.requestTimeout / 1000}
                onChange={(e) => {
                  const crawler = {
                    ...commitSettings.crawler,
                    requestTimeout: parseInt(e.target.value) * 1000 || 30000
                  }
                  setCommitSettings({ ...commitSettings, crawler })
                }}
                className='border-white/20 bg-[#0A0A0B]'
              />
              <span className='text-sm text-white/50'>seconds</span>
            </div>
          </div>

          <div>
            <Label
              htmlFor='wait-between'
              className='text-white/80'
            >
              Wait Between Requests
            </Label>
            <div className='mt-2 flex items-center gap-2'>
              <Input
                id='wait-between'
                type='number'
                value={commitSettings.crawler.waitBetweenRequests}
                onChange={(e) => {
                  const crawler = {
                    ...commitSettings.crawler,
                    waitBetweenRequests: parseInt(e.target.value) || 750
                  }
                  setCommitSettings({ ...commitSettings, crawler })
                }}
                className='border-white/20 bg-[#0A0A0B]'
              />
              <span className='text-sm text-white/50'>ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
