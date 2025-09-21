'use client'

import * as React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProjectCommitSettings } from '@/db/schema/project'

interface ScheduleTabContentProps {
  commitSettings: ProjectCommitSettings
  setCommitSettings: React.Dispatch<React.SetStateAction<ProjectCommitSettings>>
}

export function ScheduleTabContent({ commitSettings, setCommitSettings }: ScheduleTabContentProps) {
  const [enableDailySchedule, setEnableDailySchedule] = React.useState(false)
  
  // Track which days are enabled (all enabled by default)
  const [enabledDays, setEnabledDays] = React.useState<Record<string, boolean>>({
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true
  })

  // Get user's local timezone efficiently
  const userTimezone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'UTC'
    }
  }, [])

  const timezoneOptions = React.useMemo(() => {
    const zones = Intl.supportedValuesOf('timeZone')
    const now = new Date()
    const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')

    const getOffset = (tz: string) => {
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset'
      })
      const part = fmt.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? ''
      const m = /([+-]\d{1,2})(?::(\d{2}))?/.exec(part)
      if (m) {
        const sign = m[1].startsWith('-') ? -1 : 1
        const hh = Math.abs(parseInt(m[1], 10))
        const mm = m[2] ? parseInt(m[2], 10) : 0
        const minutes = sign * (hh * 60 + mm)
        const text = `UTC${minutes >= 0 ? '+' : '-'}${pad(Math.trunc(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`
        return { minutes, text }
      }
      return { minutes: 0, text: 'UTC' }
    }

    const getFriendly = (tz: string) => {
      try {
        const fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'long'
        })
        const name = fmt.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value
        if (name && !/^GMT|UTC/.test(name)) {
          // e.g. "Pacific Time"
          return name
        }
      } catch {
        // ignore
      }
      return tz
    }

    const items = zones
      .map((tz) => {
        const { minutes, text } = getOffset(tz)
        const friendly = getFriendly(tz)
        const label = `(${text}) ${friendly} [${tz}]`
        return { value: tz, label, minutes }
      })
      .sort((a, b) => a.minutes - b.minutes || a.value.localeCompare(b.value))

    // Deduping rule:
    // - Always keep <=2 segment zones.
    // - If an offset has any <=2 segment zone, drop all >2 segment zones for that offset.
    // - If an offset has only >2 segment zones, keep just the first one encountered.
    const hasTwoSegForOffset = new Set<number>()
    for (const it of items) {
      const depth = it.value.split('/').length
      if (depth <= 2) {
        hasTwoSegForOffset.add(it.minutes)
      }
    }

    const includedDeepOffset = new Set<number>()
    const out: { value: string; label: string }[] = []

    for (const it of items) {
      const depth = it.value.split('/').length
      if (depth <= 2) {
        out.push({ value: it.value, label: it.label })
      } else {
        if (hasTwoSegForOffset.has(it.minutes)) {
          continue
        }
        if (includedDeepOffset.has(it.minutes)) {
          continue
        }
        includedDeepOffset.add(it.minutes)
        out.push({ value: it.value, label: it.label })
      }
    }

    return out
  }, [])

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <Label className='text-white/80'>Schedule</Label>
          <div className='mt-2 flex items-center gap-2'>
            <span className='text-sm text-white/70'>Every</span>
            <Input
              type='number'
              min='0'
              defaultValue='0'
              className='w-20 border-white/20 bg-[#0A0A0B]'
              onChange={(e) => {
                // TODO: Handle interval change
                console.log('Interval:', e.target.value)
              }}
            />
            <Select
              defaultValue='hours'
              onValueChange={(value: string) => {
                // TODO: Handle unit change
                console.log('Unit:', value)
              }}
            >
              <SelectTrigger className='w-24 border-white/20 bg-[#0A0A0B]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='border-white/10 bg-[#1a1a1b]'>
                <SelectItem
                  value='hours'
                  className='text-white/90'
                >
                  hours
                </SelectItem>
                <SelectItem
                  value='days'
                  className='text-white/90'
                >
                  days
                </SelectItem>
                <SelectItem
                  value='weeks'
                  className='text-white/90'
                >
                  weeks
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enable Daily Schedule Checkbox */}
        <div className='flex items-center gap-2'>
          <Checkbox
            id='enable-daily-schedule'
            checked={enableDailySchedule}
            onCheckedChange={(checked) => {
              setEnableDailySchedule(!!checked)
            }}
            className='data-[state=checked]:bg-blue-500'
          />
          <Label
            htmlFor='enable-daily-schedule'
            className='text-sm text-white/80'
          >
            Enable custom daily schedule
          </Label>
        </div>

        <div className={`space-y-4 transition-opacity duration-200 ${enableDailySchedule ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <div>
            <Label
              htmlFor='timezone'
              className='text-white/80'
            >
              Timezone
            </Label>
            <Select
              value={userTimezone}
              onValueChange={(value: string) => {
                // TODO: Handle timezone selection
                console.log('Selected timezone:', value)
              }}
              disabled={!enableDailySchedule}
            >
              <SelectTrigger
                id='timezone'
                className='mt-2 border-white/20 bg-[#0A0A0B]'
              >
                <SelectValue placeholder='Select timezone' />
              </SelectTrigger>
              <SelectContent className='max-h-60 border-white/10 bg-[#1a1a1b]'>
                {timezoneOptions.map((tz) => (
                  <SelectItem
                    key={tz.value}
                    value={tz.value}
                    className='text-white/90'
                  >
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Daily Schedule */}
          <div>
            <Label className='text-white/80'>Daily Schedule</Label>
            <div className='mt-3 grid grid-cols-[auto_auto_auto_auto] items-center justify-start gap-2'>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <React.Fragment key={day}>
                  {/* Row 1: Checkbox, Day name, Start label, Start time */}
                  <Checkbox
                    id={day.toLowerCase()}
                    className='row-span-2 data-[state=checked]:bg-blue-500'
                    checked={enabledDays[day.toLowerCase()]}
                    disabled={!enableDailySchedule}
                    onCheckedChange={(checked) => {
                      setEnabledDays(prev => ({
                        ...prev,
                        [day.toLowerCase()]: !!checked
                      }))
                    }}
                  />
                  <Label
                    htmlFor={day.toLowerCase()}
                    className='row-span-2 text-left text-sm text-white/70'
                  >
                    {day}
                  </Label>
                  <Label className='px-1 text-right text-xs text-white/60'>Start</Label>
                  <Input
                    type='time'
                    defaultValue='09:00'
                    className='border-white/20 bg-[#0A0A0B] text-xs'
                    disabled={!enableDailySchedule || !enabledDays[day.toLowerCase()]}
                    onChange={(e) => {
                      // TODO: Handle start time change
                      console.log(`${day} start:`, e.target.value)
                    }}
                  />

                  {/* Row 2: End label, End time */}
                  <Label className='px-1 text-right text-xs text-white/60'>End</Label>
                  <Input
                    type='time'
                    defaultValue='17:00'
                    className='border-white/20 bg-[#0A0A0B] text-xs'
                    disabled={!enableDailySchedule || !enabledDays[day.toLowerCase()]}
                    onChange={(e) => {
                      // TODO: Handle end time change
                      console.log(`${day} end:`, e.target.value)
                    }}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
