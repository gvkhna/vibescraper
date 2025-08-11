'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {Label} from '@/components/ui/label'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Input} from '@/components/ui/input'
import {Settings, Globe, RefreshCw, Shield, Filter} from 'lucide-react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import type {ProjectPublicId} from '@/db/schema'
import type {
  ProjectCommitSettings,
  FetchType,
  ScheduleType,
  ExtractorSettings,
  CleaningMethod
} from '@/db/schema/project'
import {nowait} from '@/lib/async-utils'

interface ScraperSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: ProjectPublicId
  projectName: string
  initialSettings?: {
    commit?: ProjectCommitSettings
    extractor?: ExtractorSettings | null
  }
  onSave: (settings: {commit: ProjectCommitSettings; extractor: ExtractorSettings}) => Promise<void>
}

export function ScraperSettingsDialog({
  open,
  onOpenChange,
  projectName,
  initialSettings,
  onSave
}: ScraperSettingsDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('fetching')

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
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='border-white/10 bg-[#151517] text-white sm:!max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Settings className='h-5 w-5 text-blue-400' />
            Scraper Settings
          </DialogTitle>
          <DialogDescription className='text-white/60'>
            Configure extraction settings for <span className='font-medium text-white'>{projectName}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='mt-4'
        >
          <TabsList className='grid w-full grid-cols-4 bg-[#0A0A0B]'>
            <TabsTrigger
              value='fetching'
              className='data-[state=active]:bg-white/10'
            >
              <Globe className='mr-2 h-3.5 w-3.5' />
              Fetching
            </TabsTrigger>
            <TabsTrigger
              value='extraction'
              className='data-[state=active]:bg-white/10'
            >
              <Filter className='mr-2 h-3.5 w-3.5' />
              Extraction
            </TabsTrigger>
            <TabsTrigger
              value='crawler'
              className='data-[state=active]:bg-white/10'
            >
              <RefreshCw className='mr-2 h-3.5 w-3.5' />
              Crawler
            </TabsTrigger>
            <TabsTrigger
              value='advanced'
              className='data-[state=active]:bg-white/10'
            >
              <Shield className='mr-2 h-3.5 w-3.5' />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Fetching Tab */}
          <TabsContent
            value='fetching'
            className='mt-6 space-y-6'
          >
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
                    setCommitSettings({...commitSettings, fetchType: v})
                  }}
                >
                  <SelectTrigger
                    id='fetch-type'
                    className='mt-2 border-white/20 bg-[#0A0A0B]'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='border-white/10 bg-[#1a1a1b]'>
                    <SelectItem
                      value='fetch'
                      className='text-white/90'
                    >
                      Simple Fetch
                    </SelectItem>
                    <SelectItem
                      value='playwright'
                      className='text-white/90'
                    >
                      Playwright
                    </SelectItem>
                    <SelectItem
                      value='playwright-stealth'
                      className='text-white/90'
                    >
                      Playwright Stealth
                    </SelectItem>
                    <SelectItem
                      value='camoufox'
                      className='text-white/90'
                    >
                      Camoufox
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
                    setCommitSettings({...commitSettings, schedule: v})
                  }}
                >
                  <SelectTrigger
                    id='schedule'
                    className='mt-2 border-white/20 bg-[#0A0A0B]'
                  >
                    <SelectValue />
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
                        setCommitSettings({...commitSettings, crawler})
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
                        setCommitSettings({...commitSettings, crawler})
                      }}
                      className='border-white/20 bg-[#0A0A0B]'
                    />
                    <span className='text-sm text-white/50'>ms</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Extraction Tab */}
          <TabsContent
            value='extraction'
            className='mt-6 space-y-6'
          >
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
                    setExtractorSettings({...extractorSettings, cleaningMethod: v})
                  }}
                >
                  <SelectTrigger
                    id='cleaning-method'
                    className='mt-2 border-white/20 bg-[#0A0A0B]'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='border-white/10 bg-[#1a1a1b]'>
                    <SelectItem
                      value='raw-html'
                      className='text-white/90'
                    >
                      Raw HTML
                    </SelectItem>
                    <SelectItem
                      value='cleaned-html'
                      className='text-white/90'
                    >
                      Cleaned HTML
                    </SelectItem>
                    <SelectItem
                      value='filtered-html'
                      className='text-white/90'
                    >
                      Filtered HTML
                    </SelectItem>
                    <SelectItem
                      value='readability-html'
                      className='text-white/90'
                    >
                      Readability
                    </SelectItem>
                    <SelectItem
                      value='markdown'
                      className='text-white/90'
                    >
                      Markdown
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
                        const htmlFilter = {...extractorSettings.htmlFilter, removeComments: checked}
                        setExtractorSettings({...extractorSettings, htmlFilter})
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
                        const htmlFilter = {...extractorSettings.htmlFilter, removeHead: checked}
                        setExtractorSettings({...extractorSettings, htmlFilter})
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
          </TabsContent>

          {/* Crawler Tab */}
          <TabsContent
            value='crawler'
            className='mt-6 space-y-6'
          >
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
                    const crawler = {...commitSettings.crawler, followLinks: checked}
                    setCommitSettings({...commitSettings, crawler})
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
                          const crawler = {...commitSettings.crawler, maxDepth: parseInt(e.target.value) || 3}
                          setCommitSettings({...commitSettings, crawler})
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
                          setCommitSettings({...commitSettings, crawler})
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
                        const crawler = {...commitSettings.crawler, urlMask: e.target.value}
                        setCommitSettings({...commitSettings, crawler})
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
                    const crawler = {...commitSettings.crawler, respectRobotsTxt: checked}
                    setCommitSettings({...commitSettings, crawler})
                  }}
                  className='data-[state=checked]:bg-blue-500'
                />
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent
            value='advanced'
            className='mt-6 space-y-6'
          >
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
                      setCommitSettings({...commitSettings, maxRetries: parseInt(e.target.value) || 3})
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
                    const crawler = {...commitSettings.crawler, userAgent: e.target.value}
                    setCommitSettings({...commitSettings, crawler})
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
                    const crawler = {...commitSettings.crawler, successStatusCodes: codes}
                    setCommitSettings({...commitSettings, crawler})
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
                      setExtractorSettings({...extractorSettings, maxOutputSize: value})
                    }}
                    className='border-white/20 bg-[#0A0A0B]'
                    placeholder='Unlimited'
                  />
                  <span className='text-sm text-white/50'>bytes</span>
                </div>
                <div className='mt-1 text-xs text-white/50'>Leave empty for unlimited output size</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className='mt-6'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false)
            }}
            className='border-white/20 text-white hover:bg-white/10'
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              nowait(handleSave())
            }}
            disabled={isSaving}
            className='bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-700'
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
