import {describe, it, expect} from 'vitest'
import {htmlCleaner} from './html-cleaner'

// Import test assets using ?raw
import mediumRawHtml from './assets/html-to-markdown.test.medium-raw.html?raw'
import mediumExpectedResult from './assets/html-cleaner.test.medium.html?raw'
import mediumExpectedTextResult from './assets/html-cleaner.test.medium.txt?raw'

describe('htmlCleaner', async () => {
  it('should extract readable content from Medium article correctly', async () => {
    const result = await htmlCleaner(mediumRawHtml)
    const html = result ? result.html : ''
    expect(html).toBe(mediumExpectedResult)
    const text = result ? result.text : ''
    expect(text).toBe(mediumExpectedTextResult)
  })
})
