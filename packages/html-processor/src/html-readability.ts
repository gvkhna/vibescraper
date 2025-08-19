/**
 * HTML Readability Extractor
 *
 * Extracts readable content from HTML using Mozilla's Readability.js
 * library executed in a JSDOM environment.
 */

import {JSDOM} from 'jsdom'
import readabilityScript from './readability-js.payload?raw'

export interface ReadabilityResult {
  /**
   * Article title
   */
  title: string | null
  /**
   * Author name
   */
  byline: string | null
  /**
   * Direction (ltr/rtl)
   */
  dir: string | null
  /**
   * Language of the article
   */
  lang: string | null
  /**
   * Main article content as HTML
   */
  content: string | null
  /**
   * Plain text version of the content
   */
  textContent: string | null
  /**
   * Article excerpt
   */
  excerpt: string | null
  /**
   * Length of the content
   */
  length: number | null
  /**
   * Site name
   */
  siteName: string | null
}

/**
 * Extract readable content from HTML using Readability.js
 *
 * @param html - HTML string to process
 * @param url - Optional URL for better parsing (helps with relative links)
 * @param options - Readability options
 * @returns Extracted article content or null if extraction fails
 */
export function htmlReadability(
  html: string,
  url?: string,
  referrer?: string
  // options: ReadabilityOptions = {}
): ReadabilityResult | null {
  try {
    const dom = new JSDOM(html, {
      runScripts: 'outside-only',
      ...(url
        ? {
            url
          }
        : {}),
      ...(referrer
        ? {
            referrer
          }
        : {})
    })
    const readability = dom.window.eval(readabilityScript)
    const output = dom.window.eval(`new Readability(document).parse()`)

    if (output && typeof output === 'object') {
      return {
        title: 'title' in output && typeof output.title === 'string' ? output.title : null,
        byline: 'byline' in output && typeof output.byline === 'string' ? output.byline : null,
        dir: 'dir' in output && typeof output.dir === 'string' ? output.dir : null,
        lang: 'lang' in output && typeof output.lang === 'string' ? output.lang : null,
        content: 'content' in output && typeof output.content === 'string' ? output.content : null,
        textContent:
          'textContent' in output && typeof output.textContent === 'string' ? output.textContent : null,
        excerpt: 'excerpt' in output && typeof output.excerpt === 'string' ? output.excerpt : null,
        length: 'length' in output && typeof output.length === 'number' ? output.length : null,
        siteName: 'siteName' in output && typeof output.siteName === 'string' ? output.siteName : null
      }
    }
  } catch (e) {
    console.log('e', e)
  }
  return null
}
