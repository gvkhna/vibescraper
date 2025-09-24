import { describe, expect, it } from 'vitest'

import hackerNewsPassthrough from './fixtures/html-cleaner.test.hackernews-passthrough.fixture?raw'
import hackerNewsRaw from './fixtures/html-cleaner.test.hackernews-raw.fixture?raw'
import mediumExpectedResult from './fixtures/html-cleaner.test.medium.fixture?raw'
import mediumExpectedTextResult from './fixtures/html-cleaner.test.medium-text.fixture?raw'
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

  it('should transparently parse html - medium', async () => {
    expect.assertions(1)

    const result = await htmlCleaner(mediumRawHtml, {
      stripAttributes: false,
      emptyHead: false,
      stripEmptyWhitespace: false,
      tagsToRemove: []
    })

    expect(result?.html).toBe(mediumRawHtml)
  })

  it('should transparently parse html - hackernews', async () => {
    expect.assertions(1)

    // NOTE: not 100% transparent
    // some tags like tbody or even body will be added
    // if they are missing for normalization and compatibility
    // with browsers
    const result = await htmlCleaner(hackerNewsRaw, {
      stripAttributes: false,
      emptyHead: false,
      stripEmptyWhitespace: false,
      tagsToRemove: []
    })

    expect(result?.html).toBe(hackerNewsPassthrough)
  })
})
