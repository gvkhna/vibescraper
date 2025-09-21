import * as cheerio from 'cheerio'

/**
 * Extracts next-page URLs from a Hacker News page, or returns the base URL if no HTML is provided.
 *
 * @async
 * @param {string} [html] - Optional HTML string of the page. If omitted, only the base URL is returned.
 * @param {string} [url="https://news.ycombinator.com/"] - The base URL of the page being parsed. Default is
 *   `"https://news.ycombinator.com/"`
 * @returns {Promise<string[] | null>} A promise that resolves to an array of JSON data (URLs), or null/empty
 *   if none.
 */
export default async function parseNextUrls(html, url = 'https://news.ycombinator.com/') {
  // If no HTML is passed, just return the base queue starter
  if (!html) {
    return [url]
  }

  const $ = cheerio.load(html)

  // Find the "More" link
  const moreLink = $("a[rel='next']").attr('href')
  if (!moreLink) {
    return []
  }

  // Convert relative link to absolute
  const fullUrl = new URL(moreLink, url).toString()

  // Extract page number if "?p=N"
  const params = new URL(fullUrl).searchParams
  const pageNum = parseInt(params.get('p') || '1', 10)

  if (pageNum > 5) {
    return []
  }

  return [fullUrl]
}
