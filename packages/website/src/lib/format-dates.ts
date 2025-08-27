import {formatDistanceToNow, toDate, parseISO} from 'date-fns'
import {utc} from '@date-fns/utc'
import type {SQLUTCTimestamp} from '@/db/schema/common'

export function sqlTimestampToDate(sqlTimestamp: SQLUTCTimestamp): Date {
  // Parse the PostgreSQL timestamp directly as UTC
  return new Date(toDate(parseISO(sqlTimestamp, {in: utc})))
}

export function dateToSqlTimestamp(date: Date): SQLUTCTimestamp {
  return date.toISOString() as SQLUTCTimestamp
}

export function sqlFormatTimestamp(sqlTimestamp: SQLUTCTimestamp): string {
  const utcDate = sqlTimestampToDate(sqlTimestamp)
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
  return formatter.format(utcDate)
}

export function sqlFormatTimestampUTC(sqlTimestamp: SQLUTCTimestamp): string {
  const utcDate = sqlTimestampToDate(sqlTimestamp)
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC'
  })
  return formatter.format(utcDate)
}

export function sqlFormatRelativeTimeFromUTC(sqlTimestamp: SQLUTCTimestamp): string {
  const utcDate = sqlTimestampToDate(sqlTimestamp)
  return formatDistanceToNow(utcDate, {addSuffix: true})
}
