'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Settings, RefreshCw, X, AlertTriangle} from 'lucide-react'
import {cn} from '@/lib/utils'
import type {ProjectCommitSettings, ExtractorSettings} from '@/db/schema/project'
import {nowait} from '@/lib/async-utils'
import {ScheduleTabContent} from './settings-tab-schedule'
import {FetchingTabContent} from './settings-tab-fetching'
import {ExtractionTabContent} from './settings-tab-extraction'
import {CrawlerTabContent} from './settings-tab-crawler'
import {AdvancedTabContent} from './settings-tab-advanced'
import {DangerZoneTabContent} from './settings-tab-danger-zone'

type TabKey = 'schedule' | 'fetching' | 'extraction' | 'crawler' | 'advanced' | 'danger'

interface ScraperSettingsContentProps {
  projectName: string
  initialSettings?: {
    commit?: ProjectCommitSettings
    extractor?: ExtractorSettings | null
  }
  onSave: (settings: {commit: ProjectCommitSettings; extractor: ExtractorSettings}) => Promise<void>
  onClose: () => void
  openConfirmDeleteProjectDialog?: () => void
}

export function ScraperSettingsContent({
  projectName,
  initialSettings,
  onSave,
  onClose,
  openConfirmDeleteProjectDialog
}: ScraperSettingsContentProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<TabKey>('schedule')

  // Initialize settings with defaults from schema
  const [commitSettings, setCommitSettings] = React.useState<ProjectCommitSettings>(
    initialSettings?.commit ?? {
      schedule: 'manual',
      fetchType: 'fetch',
      crawler: {
        followLinks: false,
        maxDepth: 3,
        maxConcurrency: 1,
        requestTimeout: 30000,
        waitBetweenRequests: 750,
        successStatusCodes: [200],
        respectRobotsTxt: true
      },
      maxRetries: 3,
      retryDelay: 5000
    }
  )

  const [extractorSettings, setExtractorSettings] = React.useState<ExtractorSettings>(
    initialSettings?.extractor ?? {
      cleaningMethod: 'filtered-html',
      htmlFilter: {
        stripTags: ['script', 'style', 'noscript', 'iframe', 'svg', 'canvas'],
        preserveTags: [],
        stripAttributes: [],
        preserveAttributes: ['id', 'class', 'href', 'src', 'alt', 'title'],
        removeComments: true,
        removeHead: false
      },
      timeout: 30000,
      maxOutputSize: -1
    }
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        commit: commitSettings,
        extractor: extractorSettings
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const menuItems: Array<{key: TabKey; label: string; icon: React.ReactNode; isDanger?: boolean}> = [
    {key: 'schedule', label: 'Schedule', icon: <RefreshCw className='h-4 w-4' />},
    // {key: 'fetching', label: 'Fetching', icon: <Settings className='h-4 w-4' />},
    // {key: 'extraction', label: 'Extraction', icon: <Settings className='h-4 w-4' />},
    // {key: 'crawler', label: 'Crawler', icon: <Settings className='h-4 w-4' />},
    // {key: 'advanced', label: 'Advanced', icon: <Settings className='h-4 w-4' />},
    {key: 'danger', label: 'Danger Zone', icon: <AlertTriangle className='h-4 w-4' />, isDanger: true}
  ]

  return (
    <div className='flex h-[480px]'>
      {/* Left Sidebar */}
      <div className='w-48 shrink-0 border-r border-white/10 bg-[#0A0A0B]/50 p-3'>
        <div className='mb-4 flex items-center justify-between px-2 py-1'>
          <button
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10'
            aria-label='Close'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='space-y-1'>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key)
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                activeTab === item.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              )}
            >
              <span
                className={cn(
                  activeTab === item.key
                    ? item.isDanger
                      ? 'text-red-400'
                      : 'text-blue-400'
                    : 'text-white/50'
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Content Area */}
      <div className='flex flex-1 flex-col'>
        {/* Header */}
        <div className='border-b border-white/10 px-6 py-4'>
          <h2 className='flex items-center gap-2 text-xl font-medium'>
            <Settings className='h-5 w-5 text-blue-400' />
            Scraper Settings
          </h2>
          <p className='mt-1 text-sm text-white/60'>
            Configure extraction settings for <span className='font-medium text-white'>{projectName}</span>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto px-6 py-6'>
          {activeTab === 'schedule' && (
            <ScheduleTabContent
              commitSettings={commitSettings}
              setCommitSettings={setCommitSettings}
            />
          )}

          {/* {activeTab === 'fetching' && (
            <FetchingTabContent
              commitSettings={commitSettings}
              setCommitSettings={setCommitSettings}
            />
          )} */}

          {/* {activeTab === 'extraction' && (
            <ExtractionTabContent
              extractorSettings={extractorSettings}
              setExtractorSettings={setExtractorSettings}
            />
          )} */}

          {/* {activeTab === 'crawler' && (
            <CrawlerTabContent
              commitSettings={commitSettings}
              setCommitSettings={setCommitSettings}
            />
          )} */}

          {/* {activeTab === 'advanced' && (
            <AdvancedTabContent
              commitSettings={commitSettings}
              setCommitSettings={setCommitSettings}
              extractorSettings={extractorSettings}
              setExtractorSettings={setExtractorSettings}
            />
          )} */}

          {activeTab === 'danger' && (
            <DangerZoneTabContent
              projectName={projectName}
              openConfirmDeleteProjectDialog={openConfirmDeleteProjectDialog}
              onClose={onClose}
            />
          )}
        </div>

        {/* Bottom Actions */}
        <div className='border-t border-white/10 px-6 py-4'>
          <div className='flex justify-end gap-3'>
            <Button
              variant='outline'
              onClick={onClose}
              className='border-white/20 text-white hover:bg-white/10'
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                nowait(handleSave())
              }}
              disabled={isSaving}
              className='bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-700'
            >
              {isSaving ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className='mr-2 h-4 w-4' />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
