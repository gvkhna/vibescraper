/* eslint-disable no-console */
import * as cheerio from 'cheerio'
import { ElementType } from 'domelementtype'
import type { ChildNode, Element, Text } from 'domhandler'

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
  ElementType.Directive,
  ElementType.Comment,
  ElementType.CDATA,
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
  'link',
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
  const tagName = element.tagName.toLowerCase()
  const $el = $(element)
  const currentAttribs = { ...element.attribs }

  // Get allowed attributes for this element
  const globalAttrs = preserveAttributes.global
  const elementSpecificAttrs = preserveAttributes.byElement[tagName] ?? []
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

function traverseAndClean(args: {
  api: cheerio.CheerioAPI
  node: ChildNode
  elementsToRemove: ChildNode[]
  tagsToRemove: string[]
  stripAttributes: HtmlCleanerOptions['stripAttributes']
  stripEmptyWhitespace: HtmlCleanerOptions['stripEmptyWhitespace']
  preserveAttributes: HtmlCleanerOptions['preserveAttributes']
  debug: HtmlCleanerOptions['debug']
}): void {
  const {
    api: $,
    node,
    elementsToRemove,
    tagsToRemove,
    stripAttributes,
    stripEmptyWhitespace,
    preserveAttributes,
    debug
  } = args
  switch (node.type) {
    case ElementType.Root:
      node.children.forEach((child) => {
        traverseAndClean({
          api: $,
          node: child,
          elementsToRemove,
          tagsToRemove,
          stripAttributes,
          preserveAttributes,
          stripEmptyWhitespace,
          debug
        })
      })
      break

    case ElementType.Directive:
    case ElementType.Script:
    case ElementType.Style:
    case ElementType.Comment:
    case ElementType.CDATA: {
      const tag = node.type
      if (tagsToRemove.includes(tag)) {
        elementsToRemove.push(node)
      }
      break
    }
    case ElementType.Tag: {
      const element = node
      if (debug) {
        console.log(`Processing tag: <${element.tagName}>`)
      }

      if (stripAttributes) {
        cleanElementAttributes($, element, preserveAttributes)
      }

      // Process children recursively
      element.childNodes.forEach((child) => {
        traverseAndClean({
          api: $,
          node: child,
          elementsToRemove,
          stripAttributes,
          tagsToRemove,
          preserveAttributes,
          stripEmptyWhitespace,
          debug
        })
      })
      break
    }
    case ElementType.Text: {
      if (stripEmptyWhitespace) {
        const textNode = node
        const analysis = analyzeTextNode(textNode)

        if (analysis.isWhitespaceOnly) {
          elementsToRemove.push(node)
        }
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
        lowerCaseAttributeNames: false
        // selfClosingTags: false
      }
    })
    return $.html()
  } catch {
    return null
  }
}

function cleanHtmlCore(
  html: string,
  options: HtmlCleanerOptions
): { loaded: string; cleaned: string } | null {
  const { tagsToRemove, emptyHead, stripAttributes, stripEmptyWhitespace, preserveAttributes, debug } =
    options
  if (debug) {
    console.log('cleanHtmlCore: ', options)
  }

  // console.log('tags to remove', tagsToRemove)
  // const parsedHtml = parseLooseHTML(html)
  // if (!parsedHtml) {
  //   if (debug) {
  //     console.log('Unable to parse HTML with loose parser')
  //   }
  //   return null
  // }

  const $ = cheerio.load(html, {
    xml: false,
    xmlMode: false
  })
  const loaded = $.html()

  // Remove root directives
  const doc = $.root()[0].children
  if (tagsToRemove.includes(ElementType.Directive)) {
    for (let i = 0; i < doc.length; i++) {
      const elem = doc[i]
      if (elem.type === ElementType.Directive) {
        $(elem).remove()
      }
    }
  }

  // Traverse and clean
  const nodesToRemove: ChildNode[] = []
  for (let i = 0; i < doc.length; i++) {
    const elem = doc[i]
    if (elem.type === ElementType.Tag && elem.tagName.toLowerCase() === 'html') {
      traverseAndClean({
        api: $,
        node: elem,
        tagsToRemove,
        elementsToRemove: nodesToRemove,
        stripAttributes,
        stripEmptyWhitespace,
        preserveAttributes,
        debug
      })
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
  if (emptyHead) {
    $('head').empty()
  }

  return { loaded, cleaned: $.html() }
}

export interface HtmlCleanerOptions {
  /**
   * Enable/disable debug output
   * @default false
   */
  debug: boolean
  /**
   * Tags to completely remove (including content)
   * @default `DEFAULT_TAGS_TO_REMOVE`
   */
  tagsToRemove: string[]

  /**
   * Empty Head
   * @default true
   */
  emptyHead: boolean

  /**
   * Remove empty/whitespace only text nodes
   * @default true
   */
  stripEmptyWhitespace: boolean

  /**
   * Enable stripping element attributes
   * @default true
   */
  stripAttributes: boolean
  /**
   * Attributes to preserve by element type
   * @default `DEFAULT_ACCESSIBILITY_ATTRIBUTES`
   */
  preserveAttributes: {
    global: string[]
    byElement: Record<string, string[] | undefined>
    ariaPrefix: string
  }
}

/**
 * Clean and process HTML content
 */
export async function htmlCleaner(
  html: string,
  options: Partial<HtmlCleanerOptions> = {}
): Promise<HtmlCleanerResult | null> {
  const {
    debug = false,
    emptyHead = true,
    stripAttributes = true,
    stripEmptyWhitespace = true,
    tagsToRemove = DEFAULT_TAGS_TO_REMOVE,
    preserveAttributes = DEFAULT_ACCESSIBILITY_ATTRIBUTES
  } = options

  // Clean the HTML
  const cleanResult = cleanHtmlCore(html, {
    debug,
    emptyHead,
    stripAttributes,
    tagsToRemove,
    stripEmptyWhitespace,
    preserveAttributes
  })
  if (!cleanResult) {
    return null
  }

  const { loaded, cleaned } = cleanResult

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
