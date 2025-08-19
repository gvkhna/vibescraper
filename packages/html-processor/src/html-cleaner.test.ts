import {describe, it, expect} from 'vitest'
import {htmlCleaner} from './html-cleaner'

// Import test assets using ?raw
import mediumRawHtml from './fixtures/html-to-markdown.test.medium-raw.fixture?raw'
import mediumExpectedResult from './fixtures/html-cleaner.test.medium.fixture?raw'
import mediumExpectedTextResult from './fixtures/html-cleaner.test.medium-text.fixture?raw'

describe('htmlCleaner', async () => {
  it('should extract readable content from Medium article correctly', async () => {
    const result = await htmlCleaner(mediumRawHtml)
    const html = result ? result.html : ''
    expect(html).toBe(mediumExpectedResult)
    const text = result ? result.text : ''
    expect(text).toBe(mediumExpectedTextResult)
  })
})
