import { describe, expect, it } from 'vitest'

import mediumExpectedResult from './fixtures/html-cleaner.test.medium.fixture?raw'
import mediumExpectedTextResult from './fixtures/html-cleaner.test.medium-text.fixture?raw'
// Import test assets using ?raw
import mediumRawHtml from './fixtures/html-to-markdown.test.medium-raw.fixture?raw'
import { htmlCleaner } from './html-cleaner'

describe('test htmlCleaner()', async () => {
  it('should extract readable content from Medium article correctly', async () => {
    expect.assertions(2)

    const result = await htmlCleaner(mediumRawHtml)
    const html = result ? result.html : ''

    expect(html).toBe(mediumExpectedResult)

    const text = result ? result.text : ''

    expect(text).toBe(mediumExpectedTextResult)
  })
})
