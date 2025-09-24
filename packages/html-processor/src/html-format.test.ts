import { describe, expect, it } from 'vitest'

import formattedHtml from './fixtures/format-html.test.hackernews-formatted.fixture?raw'
import rawHtml from './fixtures/format-html.test.hackernews-raw.fixture?raw'
import { htmlFormat } from './html-format'

describe('test formatHtml()', () => {
  it('should format Hacker News HTML correctly', async () => {
    expect.assertions(1)

    // Format the raw HTML
    const result = await htmlFormat(rawHtml)

    // Compare with the pre-formatted version
    expect(result.html).toBe(formattedHtml)
  })
})
