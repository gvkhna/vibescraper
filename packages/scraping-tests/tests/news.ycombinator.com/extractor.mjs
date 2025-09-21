import * as cheerio from 'cheerio'

/**
 * Parses a Hacker News HTML page into structured JSON data.
 *
 * @async
 * @param {string} html - The raw HTML string of the page.
 * @param {string} url - The URL of the page being parsed.
 * @returns {Promise<Object[]>} A promise that resolves to an array of JSON objects.
 */
export default async function parseHackerNews(html, url) {
  const $ = cheerio.load(html)

  const items = []

  $('tr[id]').each((_, row) => {
    const $row = $(row)
    const id = $row.attr('id')

    // Skip wrapper rows like "bigbox"
    if (!id || !/^\d+$/.test(id)) {
      return
    }

    const rankText = $row.find('td span').first().text().replace(/\./, '')
    const rank = parseInt(rankText, 10)

    const titleLink = $row.find('td span a').first()
    const title = titleLink.text().trim()
    const itemUrl = titleLink.attr('href') || ''

    // metadata row is the next <tr>
    const metaRow = $row.next()
    const pointsText = metaRow.find(`[id^=score_]`).text().trim()
    const points = parseInt(pointsText.replace(/\D/g, ''), 10) || 0

    const submitter = metaRow.find("a[href^='user?id=']").text().trim()

    const timeLink = metaRow.find("a[href^='item?id=']").first()
    const postedAt = null // still relative like "4 hours ago"

    const commentsLink = metaRow.find("a[href^='item?id=']").last()
    const commentsUrl = commentsLink.attr('href') || ''
    const commentsText = commentsLink.text().trim()
    let commentsCount = 0
    if (commentsText !== 'discuss') {
      commentsCount = parseInt(commentsText.replace(/\D/g, ''), 10) || 0
    }
    if (id && rank && title && submitter) {
      items.push({
        id,
        rank,
        title,
        url: itemUrl,
        submitter,
        points,
        commentsCount,
        commentsUrl,
        postedAt
      })
    }
  })

  return items
}
