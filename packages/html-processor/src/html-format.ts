import prettier, { type Options } from 'prettier'

import { htmlCleaner } from './html-cleaner'
import { formatPrettierError } from './prettier-utils'

export type HtmlFormatOptions = Options
/**
 * Formats HTML string using Prettier
 * @param html - The HTML string to format
 * @param options - Formatting options
 * @returns Formatted HTML string
 */
export async function htmlFormat(
  html: string,
  options: HtmlFormatOptions = {}
): Promise<{ html: string; error?: Error }> {
  const result = await htmlCleaner(html, {
    stripAttributes: false,
    emptyHead: false,
    stripEmptyWhitespace: false,
    tagsToRemove: []
  })
  if (result?.html) {
    let formatted: string | undefined
    let error: Error | undefined
    try {
      formatted = await prettier.format(result.html, {
        parser: 'html',
        tabWidth: options.tabWidth ?? 2,
        useTabs: options.useTabs ?? false,
        printWidth: options.printWidth ?? 120,
        htmlWhitespaceSensitivity: 'css',
        bracketSameLine: false,
        singleQuote: false,
        bracketSpacing: true,
        semi: true,
        trailingComma: 'none',
        endOfLine: 'lf',
        ...options
      })
    } catch (e) {
      error = formatPrettierError(e)
    }
    if (formatted) {
      return {
        html: formatted,
        error: error
      }
    } else {
      throw new Error('Unable to parse and format html')
    }
  } else {
    throw new Error('Unable to parse html')
  }
}
