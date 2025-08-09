/**
 * HTML Processing Utilities Package
 * 
 * This package provides utilities for:
 * - Cleaning and minifying HTML
 * - DOM manipulation with Cheerio and JSDOM
 * - Date parsing and timezone handling
 * - Token counting for LLMs
 */

// HTML Cleaner - Main functionality
export {
  cleanHtml,
  cleanHtmlFile,
  cleanHtmlFromUrl,
  cleanHtmlWithAllStages,
  type CleanerOptions,
  type CleanerResult
} from './html-cleaner.js'

// Cheerio DOM utilities - Better ergonomics for DOM manipulation
export {
  CheerioDOM,
  CheerioElement
} from './cheerio-dom.js'

// JSDOM utilities - Alternative DOM implementation
export {
  JSDOMWrapper,
  createJSDOM,
  parseWithJSDOM,
  extractTextWithJSDOM,
  cleanAttributesWithJSDOM,
  executeInContext
} from './jsdom-utils.js'

// Date utilities - Timezone-aware date parsing
export {
  // Constants
  TIMEZONES,
  DEFAULT_TIME,
  
  // Types
  type TimezoneKey,
  type ParsedDate,
  type DateParseOptions,
  
  // Main functions
  parseDateWithTimezone,
  parseDateInPacificTimezone,
  parseDateInEasternTimezone,
  
  // Formatting functions
  formatInTimezone,
  formatInPacificTimezone,
  humanizeDate,
  
  // Timezone utilities
  isDaylightSavingTime,
  toTimezone,
  toPacificTimezone,
  nowUTC,
  
  // Helper functions
  cleanDateText,
  cleanTimeText,
  isReasonableDate,
  parseRelativeDate,
  debugDate
} from './date-utils.js'

// Re-export commonly used types from dependencies
export type {Element, Text, Comment, ChildNode} from 'domhandler'
export type {CheerioAPI, Cheerio} from 'cheerio'
export type {JSDOM} from 'jsdom'