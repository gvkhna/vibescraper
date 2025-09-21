import { describe, expect, it } from 'vitest'

import mediumExpectedResult from './fixtures/html-readability.test.medium-text.fixture?raw'
// Import test assets using ?raw
import mediumRawHtml from './fixtures/html-to-markdown.test.medium-raw.fixture?raw'
import { htmlReadability } from './html-readability'

describe('test htmlReadability()', () => {
  it('should extract readable content from Medium article correctly', () => {
    const result = htmlReadability(
      mediumRawHtml,
      'https://medium.com/@vipra_singh/ai-agents-introduction-part-1-fbec7edb857d'
    )

    const resultJson = JSON.stringify(result)

    expect(resultJson).toBe(mediumExpectedResult)
  })
})
