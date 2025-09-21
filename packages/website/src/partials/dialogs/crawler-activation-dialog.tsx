'use client'

import * as React from 'react'
import { AlertCircle, Calendar, Globe, Link2, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectPublicId } from '@/db/schema'
import type { SQLUTCTimestamp } from '@/db/schema/common'
import { nowait } from '@/lib/async-utils'
import { sqlFormatTimestamp } from '@/lib/format-dates'
import { cn } from '@/lib/utils'

interface CrawlerActivationDialogConfig {
  schedule: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  time?: string
  timezone: string
  followLinks: boolean
  maxDepth: number
  sameOriginOnly: boolean
  includePattern?: string
  excludePattern?: string
  maxPages?: number
}

interface CrawlerActivationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: ProjectPublicId
  projectName: string
  createdAt: SQLUTCTimestamp
  // onActivate: (config: CrawlerActivationDialogConfig) => void
  // projectName?: string
}

export function CrawlerActivationDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  createdAt
  // onActivate,
  // projectName = 'Example Store'
}: CrawlerActivationDialogProps) {
  const [isActivating, setIsActivating] = React.useState(false)
  const [config, setConfig] = React.useState<CrawlerActivationDialogConfig>({
    schedule: 'daily',
    time: '09:00',
    timezone: 'UTC',
    followLinks: false,
    maxDepth: 3,
    sameOriginOnly: true,
    maxPages: 100
  })

  const formattedDate = sqlFormatTimestamp(createdAt)

  async function activateProject() {
    // setIsActivating(true)
    // try {
    //   const response = await api.projects.delete.$post({
    //     json: {
    //       projectPublicId: projectId
    //     }
    //   })
    //   if (!response.ok) {
    //     toast.error('Failed to delete project. Please try again.', {
    //       duration: 0
    //     })
    //     return
    //   }
    //   toast.success(`${projectName} has been successfully deleted.`)
    //   onOpenChange(false)
    //   await navigate({to: '/'})
    // } catch (error) {
    //   toast.error('Failed to delete project. Please try again.', {
    //     duration: 0
    //   })
    // } finally {
    //   setIsDeleting(false)
    // }
  }

  // const handleActivate = () => {
  //   // onActivate(config)
  //   onOpenChange(false)
  // }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='border-white/10 bg-[#151517] p-0 text-white sm:!max-w-2xl'>
        <DialogTitle className='sr-only'>Activate Extraction</DialogTitle>
        <DialogDescription className='sr-only'>
          Configure automated extraction for your project
        </DialogDescription>
        <div className='flex h-[480px] flex-col'>
          {/* Header */}
          <div className='border-b border-white/10 px-6 py-4'>
            <h2 className='flex items-center gap-2 text-xl font-medium'>
              <Zap className='h-5 w-5 text-green-400' />
              Activate Extraction
            </h2>
            <p className='mt-1 text-sm text-white/60'>
              Configure automated extraction for <span className='font-medium text-white'>{projectName}</span>
            </p>
          </div>

          {/* Scrollable Content */}
          <div className='flex-1 overflow-y-auto px-6 py-6'>
            <div className='space-y-6'>
              {/* Schedule Section */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-white/60' />
                  <h3 className='font-medium'>Schedule</h3>
                </div>

                <div className='grid gap-4 pl-6'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label
                        htmlFor='schedule'
                        className='text-white/80'
                      >
                        Frequency
                      </Label>
                      <Select
                        value={config.schedule}
                        onValueChange={(v: typeof config.schedule) => {
                          setConfig({ ...config, schedule: v })
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
                            value='hourly'
                            className='text-white/90'
                          >
                            Hourly
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
                          <SelectItem
                            value='monthly'
                            className='text-white/90'
                          >
                            Monthly
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {config.schedule !== 'manual' && config.schedule !== 'hourly' && (
                      <div>
                        <Label
                          htmlFor='time'
                          className='text-white/80'
                        >
                          Time
                        </Label>
                        <Input
                          id='time'
                          type='time'
                          value={config.time}
                          onChange={(e) => {
                            setConfig({ ...config, time: e.target.value })
                          }}
                          className='mt-2 border-white/20 bg-[#0A0A0B]'
                        />
                      </div>
                    )}
                  </div>

                  {config.schedule !== 'manual' && (
                    <div>
                      <Label
                        htmlFor='timezone'
                        className='text-white/80'
                      >
                        Timezone
                      </Label>
                      <Select
                        value={config.timezone}
                        onValueChange={(v) => {
                          setConfig({ ...config, timezone: v })
                        }}
                      >
                        <SelectTrigger
                          id='timezone'
                          className='mt-2 border-white/20 bg-[#0A0A0B]'
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='border-white/10 bg-[#1a1a1b]'>
                          <SelectItem
                            value='UTC'
                            className='text-white/90'
                          >
                            UTC
                          </SelectItem>
                          <SelectItem
                            value='America/New_York'
                            className='text-white/90'
                          >
                            Eastern Time
                          </SelectItem>
                          <SelectItem
                            value='America/Chicago'
                            className='text-white/90'
                          >
                            Central Time
                          </SelectItem>
                          <SelectItem
                            value='America/Denver'
                            className='text-white/90'
                          >
                            Mountain Time
                          </SelectItem>
                          <SelectItem
                            value='America/Los_Angeles'
                            className='text-white/90'
                          >
                            Pacific Time
                          </SelectItem>
                          <SelectItem
                            value='Europe/London'
                            className='text-white/90'
                          >
                            London
                          </SelectItem>
                          <SelectItem
                            value='Europe/Paris'
                            className='text-white/90'
                          >
                            Paris
                          </SelectItem>
                          <SelectItem
                            value='Asia/Tokyo'
                            className='text-white/90'
                          >
                            Tokyo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Crawl Settings Section - Basic Toggle */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Link2 className='h-4 w-4 text-white/60' />
                  <h3 className='font-medium'>Crawl Settings</h3>
                </div>

                <div className='pl-6'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label
                        htmlFor='follow-links'
                        className='text-white/80'
                      >
                        Follow links
                      </Label>
                      <div className='text-xs text-white/50'>Automatically crawl linked pages</div>
                    </div>
                    <Switch
                      id='follow-links'
                      checked={config.followLinks}
                      onCheckedChange={(checked) => {
                        setConfig({ ...config, followLinks: checked })
                      }}
                      className='data-[state=checked]:bg-green-500'
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Crawl Settings (only when followLinks is true) */}
              {config.followLinks && (
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <Globe className='h-4 w-4 text-white/60' />
                    <h3 className='font-medium'>Advanced Crawl Options</h3>
                  </div>

                  <div className='space-y-4 pl-6'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label
                          htmlFor='max-depth'
                          className='text-white/80'
                        >
                          Max depth
                        </Label>
                        <Select
                          value={config.maxDepth.toString()}
                          onValueChange={(v) => {
                            setConfig({ ...config, maxDepth: parseInt(v) })
                          }}
                        >
                          <SelectTrigger
                            id='max-depth'
                            className='mt-2 border-white/20 bg-[#0A0A0B]'
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className='border-white/10 bg-[#1a1a1b]'>
                            {[1, 2, 3, 4, 5, 10].map((d) => (
                              <SelectItem
                                key={d}
                                value={d.toString()}
                                className='text-white/90'
                              >
                                {d} {d === 1 ? 'level' : 'levels'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor='max-pages'
                          className='text-white/80'
                        >
                          Max pages
                        </Label>
                        <Input
                          id='max-pages'
                          type='number'
                          value={config.maxPages}
                          onChange={(e) => {
                            setConfig({ ...config, maxPages: parseInt(e.target.value) || 100 })
                          }}
                          className='mt-2 border-white/20 bg-[#0A0A0B]'
                          placeholder='100'
                        />
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label
                          htmlFor='same-origin'
                          className='text-white/80'
                        >
                          Same origin only
                        </Label>
                        <div className='text-xs text-white/50'>Only crawl pages from the same domain</div>
                      </div>
                      <Switch
                        id='same-origin'
                        checked={config.sameOriginOnly}
                        onCheckedChange={(checked) => {
                          setConfig({ ...config, sameOriginOnly: checked })
                        }}
                        className='data-[state=checked]:bg-green-500'
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor='include-pattern'
                        className='text-white/80'
                      >
                        Include pattern
                        <span className='ml-2 text-xs text-white/50'>(optional regex)</span>
                      </Label>
                      <Input
                        id='include-pattern'
                        value={config.includePattern ?? ''}
                        onChange={(e) => {
                          setConfig({ ...config, includePattern: e.target.value })
                        }}
                        className='mt-2 border-white/20 bg-[#0A0A0B] font-mono'
                        placeholder='/products/.*'
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor='exclude-pattern'
                        className='text-white/80'
                      >
                        Exclude pattern
                        <span className='ml-2 text-xs text-white/50'>(optional regex)</span>
                      </Label>
                      <Input
                        id='exclude-pattern'
                        value={config.excludePattern ?? ''}
                        onChange={(e) => {
                          setConfig({ ...config, excludePattern: e.target.value })
                        }}
                        className='mt-2 border-white/20 bg-[#0A0A0B] font-mono'
                        placeholder='.*\?page=.*'
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className='rounded-lg border border-green-500/30 bg-green-500/10 p-4'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='mt-0.5 h-4 w-4 text-green-400' />
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <div className='font-medium text-green-400'>Ready to activate</div>
                      {config.schedule !== 'manual' && (
                        <Badge className='border-green-500/30 bg-green-500/20 text-green-400'>
                          Next run: {new Date().toLocaleDateString()} {config.time}
                        </Badge>
                      )}
                    </div>
                    <div className='mt-2 text-sm text-white/70'>
                      Your extractor will run{' '}
                      <span className='font-medium text-white'>
                        {config.schedule === 'manual' ? 'manually' : config.schedule}
                      </span>
                      {config.schedule !== 'manual' && config.time && (
                        <span className='font-medium text-white'> at {config.time}</span>
                      )}
                      .
                      {config.followLinks && (
                        <div className='mt-2 space-y-1'>
                          <div>
                            • Will crawl up to{' '}
                            <span className='font-medium text-white'>{config.maxDepth} levels deep</span>
                          </div>
                          <div>
                            • Maximum{' '}
                            <span className='font-medium text-white'>{config.maxPages ?? 100} pages</span>
                          </div>
                          {config.sameOriginOnly && (
                            <div>
                              • <span className='font-medium text-white'>Same origin only</span>
                            </div>
                          )}
                          {config.includePattern && (
                            <div>
                              • Include: <span className='font-mono text-white'>{config.includePattern}</span>
                            </div>
                          )}
                          {config.excludePattern && (
                            <div>
                              • Exclude: <span className='font-mono text-white'>{config.excludePattern}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className='border-t border-white/10 px-6 py-4'>
            <div className='flex justify-end gap-3'>
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
                  nowait(activateProject())
                }}
                className='bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-700'
              >
                <Zap className='mr-2 h-4 w-4' />
                Activate Extraction
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
