import {toZonedTime, fromZonedTime, format as formatTz} from 'date-fns-tz'
import {parse, isValid, parseISO, format} from 'date-fns'

/**
 * Common timezones
 */
export const TIMEZONES = {
  PST: 'America/Los_Angeles',
  EST: 'America/New_York',
  CST: 'America/Chicago',
  MST: 'America/Denver',
  UTC: 'UTC',
  GMT: 'GMT'
} as const

export type TimezoneKey = keyof typeof TIMEZONES

/**
 * Default time when time is not specified
 */
export const DEFAULT_TIME = {hours: 6, minutes: 0} // 6:00 AM default

/**
 * Date parsing result
 */
export interface ParsedDate {
  utcDate: Date
  originalText: string
  timeText?: string
  timezone: string
  displayTimezone?: string
}

/**
 * Date parsing options
 */
export interface DateParseOptions {
  timezone?: string
  defaultTime?: {hours: number; minutes: number}
  formats?: string[]
}

/**
 * Parse date text in various formats and convert to UTC
 * Supports MM/DD/YYYY, YYYY-MM-DD, and other common formats
 */
export function parseDateWithTimezone(
  dateText: string,
  timeText?: string,
  options: DateParseOptions = {}
): ParsedDate {
  const {timezone = TIMEZONES.PST, defaultTime = DEFAULT_TIME} = options

  const cleanDate = dateText.trim().replace(/\s+/g, ' ')

  // Try multiple date formats
  const dateFormats = options.formats || [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})-(\d{1,2})-(\d{4})/ // MM-DD-YYYY
  ]

  let parsedDate: Date | null = null
  let parsedMonth: number | null = null
  let parsedDay: number | null = null
  let parsedYear: number | null = null

  // Try ISO format first
  if (!parsedDate) {
    try {
      parsedDate = parseISO(cleanDate)
      if (isValid(parsedDate)) {
        return createParsedDate(parsedDate, dateText, timeText, timezone)
      }
    } catch {
      // Continue with other formats
    }
  }

  // Try regex patterns
  for (const fmt of dateFormats) {
    if (fmt instanceof RegExp) {
      const match = cleanDate.match(fmt)
      if (match) {
        if (fmt.source.includes('(\\d{4})-(\\d{1,2})-(\\d{1,2})')) {
          // YYYY-MM-DD format
          ;[, parsedYear, parsedMonth, parsedDay] = match.map(Number)
        } else {
          // MM/DD/YYYY or MM-DD-YYYY format
          ;[, parsedMonth, parsedDay, parsedYear] = match.map(Number)
        }
        break
      }
    }
  }

  if (!parsedYear || !parsedMonth || !parsedDay) {
    console.warn(`Could not parse date: "${dateText}", using current date`)
    const now = new Date()
    return createParsedDate(now, dateText, timeText, timezone)
  }

  // Parse time or use default
  let hours = defaultTime.hours
  let minutes = defaultTime.minutes

  if (timeText) {
    const timeMatch = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(A\.?M\.?|P\.?M\.?)?/i.exec(timeText)
    if (timeMatch) {
      const [, hourStr, minuteStr, , meridian] = timeMatch
      hours = parseInt(hourStr, 10)
      minutes = parseInt(minuteStr, 10)

      // Convert to 24-hour format if meridian is present
      if (meridian) {
        if (meridian.toUpperCase().includes('P') && hours !== 12) {
          hours += 12
        } else if (meridian.toUpperCase().includes('A') && hours === 12) {
          hours = 0
        }
      }
    } else {
      console.warn(
        `Could not parse time: "${timeText}", using default ${defaultTime.hours}:${defaultTime.minutes
          .toString()
          .padStart(2, '0')}`
      )
    }
  }

  // Create date in specified timezone
  const localDateString = `${parsedYear}-${parsedMonth.toString().padStart(2, '0')}-${parsedDay
    .toString()
    .padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
  const localDate = parseISO(localDateString)

  return createParsedDate(localDate, dateText, timeText, timezone)
}

/**
 * Parse date text in Pacific timezone (convenience function)
 */
export function parseDateInPacificTimezone(dateText: string, timeText?: string): ParsedDate {
  return parseDateWithTimezone(dateText, timeText, {timezone: TIMEZONES.PST})
}

/**
 * Parse date text in Eastern timezone (convenience function)
 */
export function parseDateInEasternTimezone(dateText: string, timeText?: string): ParsedDate {
  return parseDateWithTimezone(dateText, timeText, {timezone: TIMEZONES.EST})
}

/**
 * Create a ParsedDate object with proper timezone handling
 */
function createParsedDate(
  localDate: Date,
  originalText: string,
  timeText?: string,
  timezone: string = TIMEZONES.PST
): ParsedDate {
  // Convert from specified timezone to UTC
  const utcDate = fromZonedTime(localDate, timezone)

  // Determine display timezone abbreviation
  const displayTimezone = getTimezoneAbbreviation(utcDate, timezone)

  return {
    utcDate,
    originalText,
    timeText,
    timezone,
    displayTimezone
  }
}

/**
 * Get timezone abbreviation (e.g., PST, PDT, EST, EDT)
 */
function getTimezoneAbbreviation(date: Date, timezone: string): string {
  const isDST = isDaylightSavingTime(date, timezone)

  switch (timezone) {
    case TIMEZONES.PST:
      return isDST ? 'PDT' : 'PST'
    case TIMEZONES.EST:
      return isDST ? 'EDT' : 'EST'
    case TIMEZONES.CST:
      return isDST ? 'CDT' : 'CST'
    case TIMEZONES.MST:
      return isDST ? 'MDT' : 'MST'
    default:
      // Try to get abbreviation from date-fns-tz
      try {
        return formatTz(date, 'zzz', {timeZone: timezone})
      } catch {
        return timezone
      }
  }
}

/**
 * Check if a date falls within Daylight Saving Time in specified timezone
 */
export function isDaylightSavingTime(date: Date, timezone: string): boolean {
  // Get the timezone offset for January (standard time) and July (DST)
  const jan = new Date(date.getFullYear(), 0, 1)
  const jul = new Date(date.getFullYear(), 6, 1)

  const janZoned = toZonedTime(jan, timezone)
  const julZoned = toZonedTime(jul, timezone)

  const janOffset = janZoned.getTimezoneOffset()
  const julOffset = julZoned.getTimezoneOffset()

  const dateZoned = toZonedTime(date, timezone)
  const dateOffset = dateZoned.getTimezoneOffset()

  // If current offset matches July (smaller number = more ahead of UTC), it's DST
  return dateOffset === Math.min(janOffset, julOffset)
}

/**
 * Format a UTC date for display in specified timezone
 */
export function formatInTimezone(
  utcDate: Date,
  timezone: string = TIMEZONES.PST,
  formatString = 'yyyy-MM-dd HH:mm:ss zzz'
): string {
  return formatTz(utcDate, formatString, {timeZone: timezone})
}

/**
 * Format a UTC date for display in Pacific timezone
 */
export function formatInPacificTimezone(utcDate: Date, formatString?: string): string {
  return formatInTimezone(utcDate, TIMEZONES.PST, formatString)
}

/**
 * Get current date/time in UTC
 */
export function nowUTC(): Date {
  return new Date()
}

/**
 * Convert UTC date to specified timezone for display
 */
export function toTimezone(utcDate: Date, timezone: string = TIMEZONES.PST): Date {
  return toZonedTime(utcDate, timezone)
}

/**
 * Convert UTC date to Pacific timezone
 */
export function toPacificTimezone(utcDate: Date): Date {
  return toTimezone(utcDate, TIMEZONES.PST)
}

/**
 * Clean and normalize text inputs
 */
export function cleanDateText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export function cleanTimeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/\.$/, '') // Remove trailing period
}

/**
 * Validate that a date is reasonable (not too far in past/future)
 */
export function isReasonableDate(date: Date, yearsBack = 5, yearsForward = 10): boolean {
  const now = new Date()
  const minDate = new Date(now.getFullYear() - yearsBack, 0, 1)
  const maxDate = new Date(now.getFullYear() + yearsForward, 11, 31)

  return date >= minDate && date <= maxDate && isValid(date)
}

/**
 * Parse relative dates like "tomorrow", "next week", etc.
 */
export function parseRelativeDate(text: string, timezone: string = TIMEZONES.PST): ParsedDate | null {
  const lower = text.toLowerCase().trim()
  const now = new Date()

  let targetDate: Date | null = null

  switch (lower) {
    case 'today':
      targetDate = now
      break
    case 'tomorrow':
      targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      break
    case 'yesterday':
      targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    default: {
      // Check for "in X days" pattern
      const inDaysMatch = /in (\d+) days?/.exec(lower)
      if (inDaysMatch) {
        const days = parseInt(inDaysMatch[1], 10)
        targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      }

      // Check for "X days ago" pattern
      const agoMatch = /(\d+) days? ago/.exec(lower)
      if (agoMatch) {
        const days = parseInt(agoMatch[1], 10)
        targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      }
    }
  }

  if (targetDate) {
    return createParsedDate(targetDate, text, undefined, timezone)
  }

  return null
}

/**
 * Format date for human-readable display
 */
export function humanizeDate(date: Date, options?: {includeTime?: boolean; timezone?: string}): string {
  const {includeTime = false, timezone = TIMEZONES.PST} = options || {}

  const formatString = includeTime ? "MMMM d, yyyy 'at' h:mm a zzz" : 'MMMM d, yyyy'
  return formatTz(date, formatString, {timeZone: timezone})
}

/**
 * Debug helper to log date information
 */
export function debugDate(parsedDate: ParsedDate, label = 'Date'): void {
  const zonedDate = toTimezone(parsedDate.utcDate, parsedDate.timezone)
  console.log(`🕐 ${label}:`)
  console.log(
    `  Original: "${parsedDate.originalText}"${parsedDate.timeText ? ` at "${parsedDate.timeText}"` : ''}`
  )
  console.log(`  UTC: ${parsedDate.utcDate.toISOString()}`)
  console.log(
    `  Local: ${formatInTimezone(parsedDate.utcDate, parsedDate.timezone)} ${
      parsedDate.displayTimezone ? `(${parsedDate.displayTimezone})` : ''
    }`
  )
  console.log(`  Timezone: ${parsedDate.timezone}`)
  console.log(
    `  Human: ${humanizeDate(parsedDate.utcDate, {includeTime: true, timezone: parsedDate.timezone})}`
  )
}
