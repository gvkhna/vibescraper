import {describe, it, expect} from 'vitest'

// Import test assets using ?raw
import sampleRawHtml from './fixtures/html-to-markdown.test.sample-raw.fixture?raw'
import sampleConvertedMd from './fixtures/html-to-markdown.test.sample-converted.fixture?raw'
import mediumRawHtml from './fixtures/html-to-markdown.test.medium-raw.fixture?raw'
import mediumConvertedMd from './fixtures/html-to-markdown.test.medium-converted.fixture?raw'
import {htmlMarkdown} from './html-markdown'

describe('htmlToMarkdown', () => {
  it('should convert sample HTML to Markdown correctly', () => {
    const result = htmlMarkdown(sampleRawHtml)
    expect(result).toBe(sampleConvertedMd)
  })

  it('should convert Medium article HTML to Markdown correctly', () => {
    const result = htmlMarkdown(mediumRawHtml)
    expect(result).toBe(mediumConvertedMd)
  })
})
