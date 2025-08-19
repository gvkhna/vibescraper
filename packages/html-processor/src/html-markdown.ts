/**
 * HTML to Markdown Converter
 *
 * Converts HTML strings or elements to Markdown format
 * using the HTMLarkdown library.
 */
import {NodeHtmlMarkdown, type NodeHtmlMarkdownOptions} from 'node-html-markdown'

export type HtmlMarkdownOptions = NodeHtmlMarkdownOptions

export function htmlMarkdown(html: string, options?: HtmlMarkdownOptions): string {
  const htmMarkdown = new NodeHtmlMarkdown({
    keepDataImages: false,
    ...options
  })

  // Convert the HTML to Markdown
  return htmMarkdown.translate(html)
}
