import {describe, it, expect} from 'vitest'
import {htmlFormat} from './html-format'

// Import raw HTML files
import rawHtml from './assets/format-html.test.hackernews-raw.html?raw'
import formattedHtml from './assets/format-html.test.hackernews-formatted.html?raw'

describe('formatHtml', () => {
  it('should format Hacker News HTML correctly', async () => {
    // Format the raw HTML
    const result = await htmlFormat(rawHtml)

    // Compare with the pre-formatted version
    expect(result).toBe(formattedHtml)
  })
})
