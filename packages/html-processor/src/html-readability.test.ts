import {describe, it, expect} from 'vitest'
import {htmlReadability} from './html-readability'

// Import test assets using ?raw
import mediumRawHtml from './assets/html-to-markdown.test.medium-raw.html?raw'
import mediumExpectedResult from './assets/html-readability.test.medium.txt?raw'

describe('htmlReadability', () => {
  it('should extract readable content from Medium article correctly', () => {
    const result = htmlReadability(
      mediumRawHtml,
      'https://medium.com/@vipra_singh/ai-agents-introduction-part-1-fbec7edb857d'
    )

    const resultJson = JSON.stringify(result)
    expect(resultJson).toBe(mediumExpectedResult)
  })
})
