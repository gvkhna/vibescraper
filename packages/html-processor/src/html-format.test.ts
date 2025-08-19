import {describe, it, expect} from 'vitest'
import {htmlFormat} from './html-format'

// Import raw HTML files
import rawHtml from './fixtures/format-html.test.hackernews-raw.fixture?raw'
import formattedHtml from './fixtures/format-html.test.hackernews-formatted.fixture?raw'

describe('formatHtml', () => {
  it('should format Hacker News HTML correctly', async () => {
    // Format the raw HTML
    const result = await htmlFormat(rawHtml)

    // Compare with the pre-formatted version
    expect(result).toBe(formattedHtml)
  })
})
