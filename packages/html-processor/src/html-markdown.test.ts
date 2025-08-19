import {describe, it, expect} from 'vitest'

// Import test assets using ?raw
import sampleRawHtml from './assets/html-to-markdown.test.sample-raw.html?raw'
import sampleConvertedMd from './assets/html-to-markdown.test.sample-converted.md?raw'
import mediumRawHtml from './assets/html-to-markdown.test.medium-raw.html?raw'
import mediumConvertedMd from './assets/html-to-markdown.test.medium-converted.md?raw'
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
