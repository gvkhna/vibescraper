import debug from 'debug'

const log = debug('app:url-utils')

export interface ExtractedUrlInfo {
  url: string | null
  domain: string | null
}

/**
 * Extracts URL from user prompt using regex patterns
 * Handles various formats:
 * - Full URLs: https://example.com/path
 * - URLs without protocol: example.com/path
 * - Domains: example.com
 * - URLs in quotes: "example.com"
 */
export function extractUrlFromPrompt(prompt: string): ExtractedUrlInfo {
  // First try to match explicit URLs with protocol
  const explicitUrlRegex = /https?:\/\/[^\s"']+/gi
  const explicitMatch = prompt.match(explicitUrlRegex)

  if (explicitMatch?.[0]) {
    try {
      const url = new URL(explicitMatch[0])
      return {
        url: url.href,
        domain: url.hostname
      }
    } catch (e) {
      log('Failed to parse explicit URL:', explicitMatch[0])
    }
  }

  // Try to match domain-like patterns (with common TLDs)
  const domainRegex =
    /(?:^|\s|["'])([a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.(?:com|net|org|io|ai|dev|app|co|edu|gov|mil|int|biz|info|name|pro|museum|us|uk|ca|au|de|fr|jp|cn|in|br|mx|ru|nl|se|no|es|it|pl|be|at|ch|dk|fi|ie|pt|gr|il|sg|hk|tw|kr|th|my|id|vn|ph|nz|za|ar|cl|co\.uk|co\.jp|com\.au|com\.br|com\.cn|com\.mx|org\.uk))(?:\/[^\s"']*)?(?=\s|["']|$)/gi

  const domainMatches = prompt.matchAll(domainRegex)
  for (const match of domainMatches) {
    const domainString = match[1]
    try {
      // Try with https first
      const url = new URL(`https://${domainString}`)
      return {
        url: url.href,
        domain: url.hostname
      }
    } catch (e) {
      log('Failed to parse domain as URL:', domainString)
    }
  }

  // If no URL found, return null
  return {
    url: null,
    domain: null
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
