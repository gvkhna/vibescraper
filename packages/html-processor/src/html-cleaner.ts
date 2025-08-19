/* eslint-disable no-console */
import * as cheerio from 'cheerio'
import {ElementType} from 'domelementtype'
import type {ChildNode, Element, Text} from 'domhandler'
import prettier from 'prettier'

export interface HtmlCleanerOptions {
  /**
   * Enable/disable debug output
   */
  debug?: boolean
  /**
   * Tags to completely remove (including content)
   */
  tagsToRemove?: string[]

  /**
   * Attributes to preserve by element type
   */
  preserveAttributes?: {
    global?: string[]
    byElement?: Record<string, string[]>
    ariaPrefix?: string
  }
}

export interface HtmlCleanerResult {
  html: string
  text: string
  // debug?: {
  //   loadedHtml: string
  //   cleanedHtml: string
  //   textContent: string
  // }
}

// Default configuration
const DEFAULT_TAGS_TO_REMOVE = [
  'script',
  'style',
  'noscript',
  'iframe',
  'frame',
  'frameset',
  'noframes',
  'svg',
  'canvas',
  'audio',
  'video',
  'source',
  'track',
  'embed',
  'object',
  'applet',
  'img',
  'picture',
  'map',
  'textarea',
  'input',
  // 'button',
  'select',
  'option',
  'textarea'
  // 'form',
  // 'fieldset',
  // 'legend'
]

const DEFAULT_ACCESSIBILITY_ATTRIBUTES = {
  global: ['id', 'role', 'tabindex', 'lang', 'dir'],
  ariaPrefix: 'aria-',
  byElement: {
    a: ['href', 'hreflang', 'rel', 'target'],
    img: ['src', 'alt', 'width', 'height'],
    area: ['href', 'alt', 'coords', 'shape'],
    input: ['type', 'name', 'value', 'required', 'disabled', 'readonly', 'placeholder', 'autocomplete'],
    textarea: ['name', 'required', 'disabled', 'readonly', 'placeholder'],
    select: ['name', 'required', 'disabled', 'multiple'],
    option: ['value', 'selected', 'disabled'],
    button: ['type', 'disabled'],
    label: ['for'],
    fieldset: ['disabled'],
    table: ['summary'],
    th: ['scope', 'colspan', 'rowspan', 'headers'],
    td: ['colspan', 'rowspan', 'headers'],
    ol: ['start', 'type', 'reversed'],
    ul: ['type'],
    li: ['value'],
    iframe: ['src', 'title', 'width', 'height'],
    object: ['type', 'data'],
    embed: ['src', 'type'],
    meta: ['name', 'content', 'charset', 'property', 'http-equiv'],
    link: ['rel', 'href', 'type', 'media']
  }
}

interface TextNodeAnalysis {
  raw: string
  visible: string
  length: number
  trimmedLength: number
  isWhitespaceOnly: boolean
  containsEntities: boolean
}

function analyzeTextNode(node: Text): TextNodeAnalysis {
  const raw = node.data || ''
  const visible = raw.trim()

  return {
    raw,
    visible,
    length: raw.length,
    trimmedLength: visible.length,
    isWhitespaceOnly: visible.length === 0,
    containsEntities: /&[a-zA-Z0-9#]+;/.test(raw)
  }
}

function cleanElementAttributes(
  $: cheerio.CheerioAPI,
  element: Element,
  preserveAttributes: HtmlCleanerOptions['preserveAttributes']
): void {
  preserveAttributes ??= DEFAULT_ACCESSIBILITY_ATTRIBUTES

  const tagName = element.tagName.toLowerCase()
  const $el = $(element)
  const currentAttribs = {...element.attribs}

  // Get allowed attributes for this element
  const globalAttrs = preserveAttributes.global ?? []
  const elementSpecificAttrs = preserveAttributes.byElement?.[tagName] ?? []
  const allowedAttrs = [...globalAttrs, ...elementSpecificAttrs]

  // Remove all attributes first
  Object.keys(currentAttribs).forEach((attr) => {
    $el.removeAttr(attr)
  })

  // Add back essential attributes
  Object.keys(currentAttribs).forEach((attr) => {
    const shouldKeep =
      allowedAttrs.includes(attr) ||
      (preserveAttributes.ariaPrefix && attr.startsWith(preserveAttributes.ariaPrefix))

    if (shouldKeep) {
      $el.attr(attr, currentAttribs[attr])
    }
  })
}

function traverseAndClean(
  $: cheerio.CheerioAPI,
  node: ChildNode,
  elementsToRemove: ChildNode[],
  preserveAttributes: HtmlCleanerOptions['preserveAttributes'],
  debug = false
): void {
  switch (node.type) {
    case ElementType.Root:
      node.children.forEach((child) => {
        traverseAndClean($, child, elementsToRemove, preserveAttributes, debug)
      })
      break

    case ElementType.Directive:
    case ElementType.Script:
    case ElementType.Style:
    case ElementType.Comment:
    case ElementType.CDATA:
      elementsToRemove.push(node)
      break

    case ElementType.Tag: {
      const element = node
      if (debug) {
        console.log(`Processing tag: <${element.tagName}>`)
      }

      cleanElementAttributes($, element, preserveAttributes)

      // Process children recursively
      element.childNodes.forEach((child) => {
        traverseAndClean($, child, elementsToRemove, preserveAttributes, debug)
      })
      break
    }
    case ElementType.Text: {
      const textNode = node
      const analysis = analyzeTextNode(textNode)

      if (analysis.isWhitespaceOnly) {
        elementsToRemove.push(node)
      }
      break
    }
  }
}

function parseLooseHTML(html: string): string | null {
  try {
    const $ = cheerio.load(html, {
      xml: {
        decodeEntities: true,
        xmlMode: true,
        lowerCaseAttributeNames: false,
        selfClosingTags: false
      }
    })
    return $.html()
  } catch {
    return null
  }
}

function cleanHtmlCore(
  html: string,
  tagsToRemove: string[],
  preserveAttributes: HtmlCleanerOptions['preserveAttributes'],
  debug = false
): {loaded: string; cleaned: string} | null {
  const parsedHtml = parseLooseHTML(html)
  if (!parsedHtml) {
    if (debug) {
      console.log('Unable to parse HTML with loose parser')
    }
    return null
  }

  const $ = cheerio.load(html, {})
  const loaded = $.html()

  // Remove directives
  const doc = $.root()[0].children
  for (let i = 0; i < doc.length; i++) {
    const elem = doc[i]
    if (elem.type === ElementType.Directive) {
      $(elem).remove()
    }
  }

  // Traverse and clean
  const nodesToRemove: ChildNode[] = []
  for (let i = 0; i < doc.length; i++) {
    const elem = doc[i]
    if (elem.type === ElementType.Tag && elem.tagName.toLowerCase() === 'html') {
      traverseAndClean($, elem, nodesToRemove, preserveAttributes, debug)
    }
  }

  // Remove collected nodes
  nodesToRemove.forEach((elem) => {
    $(elem).remove()
  })

  // Remove unwanted tags completely
  tagsToRemove.forEach((tag) => {
    $(tag).remove()
  })

  // Clean head but keep the element
  $('head').empty()

  return {loaded, cleaned: $.html()}
}

/**
 * Clean and process HTML content
 */
export async function htmlCleaner(
  html: string,
  options: HtmlCleanerOptions = {}
): Promise<HtmlCleanerResult | null> {
  const {
    debug = false,
    tagsToRemove = DEFAULT_TAGS_TO_REMOVE,
    preserveAttributes = DEFAULT_ACCESSIBILITY_ATTRIBUTES
  } = options

  // Clean the HTML
  const cleanResult = cleanHtmlCore(html, tagsToRemove, preserveAttributes, debug)
  if (!cleanResult) {
    return null
  }

  const {loaded, cleaned} = cleanResult

  // Load cleaned HTML for text extraction
  const $ = cheerio.load(cleaned)
  const textContent = $.text()

  // Format if requested
  // let formattedHtml: string | undefined
  // try {
  //   formattedHtml = await prettier.format(cleaned, {
  //     parser: 'html',
  //     tabWidth: 2,
  //     useTabs: false,
  //     printWidth: 130,
  //     htmlWhitespaceSensitivity: 'css',
  //     bracketSameLine: false,
  //     singleQuote: false,
  //     bracketSpacing: true,
  //     semi: true,
  //     trailingComma: 'none',
  //     endOfLine: 'lf'
  //   })
  // } catch (error) {
  //   if (debug) {
  //     console.warn('Failed to format HTML:', error)
  //     return null
  //   }
  // }

  // if (!formattedHtml) {
  //   return null
  // }

  const output = {
    html: cleaned,
    text: textContent
    // debug: {
    //   loadedHtml: loaded,
    //   cleanedHtml: cleaned,
    //   textContent
    // }
  } satisfies HtmlCleanerResult

  return output
}
