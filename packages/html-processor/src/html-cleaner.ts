/* eslint-disable no-console */
import * as cheerio from 'cheerio'
import {ElementType} from 'domelementtype'
import type {ChildNode, Element, Text} from 'domhandler'
import {readFile, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {encoding_for_model} from 'tiktoken'
import prettier from 'prettier'

export interface CleanerOptions {
  /**
   * Base directory for file outputs (usually __dirname of caller)
   */
  outputDir?: string

  /**
   * Base filename for output files (e.g., 'bid-detail' => 'bid-detail.loaded.tmp.html')
   */
  outputBasename?: string

  /**
   * Enable/disable debug output files
   */
  debug?: {
    saveOriginal?: boolean // Save original HTML as index.tmp.html
    saveLoaded?: boolean // Save loaded HTML as loaded.tmp.html
    saveCleaned?: boolean // Save cleaned HTML as cleaned.tmp.html
    saveFormatted?: boolean // Save formatted HTML as formatted.tmp.html
    enableLogging?: boolean // Enable console logging
  }

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

  /**
   * Formatting options for prettier
   */
  formatting?: {
    enabled?: boolean
    printWidth?: number
    tabWidth?: number
    useTabs?: boolean
  }

  /**
   * Token counting options
   */
  tokenCounting?: {
    enabled?: boolean
    models?: string[]
  }
}

export interface CleanerResult {
  originalHtml: string
  loadedHtml: string
  cleanedHtml: string
  formattedHtml?: string
  textContent: string
  metadata: {
    originalLength: number
    cleanedLength: number
    formattedLength?: number
    textLength: number
    tokenCounts?: Record<string, number>
  }
  files?: {
    original?: string
    loaded?: string
    cleaned?: string
    formatted?: string
  } | null
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
  preserveAttributes: CleanerOptions['preserveAttributes']
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
  preserveAttributes: CleanerOptions['preserveAttributes'],
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
  preserveAttributes: CleanerOptions['preserveAttributes'],
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

function getTokenCount(text: string, models: string[]): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const model of models) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const encoder = encoding_for_model(model as any)
      const tokens = encoder.encode(text)
      counts[model] = tokens.length
      encoder.free()
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Error calculating tokens for model ${model}:`, error.message)
      }
      counts[model] = 0
    }
  }

  return counts
}

/**
 * Clean and process HTML content
 */
export async function cleanHtml(html: string, options: CleanerOptions = {}): Promise<CleanerResult> {
  const {
    outputDir,
    debug = {},
    tagsToRemove = DEFAULT_TAGS_TO_REMOVE,
    preserveAttributes = DEFAULT_ACCESSIBILITY_ATTRIBUTES,
    formatting = {enabled: true},
    tokenCounting = {enabled: false, models: ['gpt-4', 'gpt-4-1106-preview']}
  } = options

  const enableLogging = debug.enableLogging ?? false

  if (enableLogging) {
    console.log(`Processing HTML (${html.length} characters)`)
  }

  // Clean the HTML
  const cleanResult = cleanHtmlCore(html, tagsToRemove, preserveAttributes, enableLogging)
  if (!cleanResult) {
    throw new Error('Failed to clean HTML')
  }

  const {loaded, cleaned} = cleanResult

  // Load cleaned HTML for text extraction
  const $ = cheerio.load(cleaned)
  const textContent = $.text()

  // Format if requested
  let formattedHtml: string | undefined
  if (formatting.enabled !== false) {
    try {
      formattedHtml = await prettier.format(cleaned, {
        parser: 'html',
        tabWidth: formatting.tabWidth ?? 2,
        useTabs: formatting.useTabs ?? false,
        printWidth: formatting.printWidth ?? 160,
        htmlWhitespaceSensitivity: 'css',
        bracketSameLine: false,
        singleQuote: false,
        bracketSpacing: true,
        semi: true,
        trailingComma: 'none',
        endOfLine: 'lf'
      })
    } catch (error) {
      if (enableLogging) {
        console.warn('Failed to format HTML:', error)
      }
    }
  }

  // Calculate token counts if requested
  let tokenCounts: Record<string, number> | undefined
  if (tokenCounting.enabled && tokenCounting.models && tokenCounting.models.length > 0) {
    tokenCounts = getTokenCount(cleaned, tokenCounting.models)
  }

  // Save debug files if requested
  const files: CleanerResult['files'] = {}
  if (outputDir) {
    const basename = options.outputBasename ?? 'index'

    if (debug.saveOriginal) {
      const path = join(outputDir, `${basename}.original.tmp.html`)
      await writeFile(path, html, 'utf-8')
      files.original = path
      if (enableLogging) {
        console.log('Saved original HTML to:', path)
      }
    }

    if (debug.saveLoaded) {
      const path = join(outputDir, `${basename}.loaded.tmp.html`)
      await writeFile(path, loaded, 'utf-8')
      files.loaded = path
      if (enableLogging) {
        console.log('Saved loaded HTML to:', path)
      }
    }

    if (debug.saveCleaned) {
      const path = join(outputDir, `${basename}.cleaned.tmp.html`)
      await writeFile(path, cleaned, 'utf-8')
      files.cleaned = path
      if (enableLogging) {
        console.log('Saved cleaned HTML to:', path)
      }
    }

    if (debug.saveFormatted && formattedHtml) {
      const path = join(outputDir, `${basename}.formatted.tmp.html`)
      await writeFile(path, formattedHtml, 'utf-8')
      files.formatted = path
      if (enableLogging) {
        console.log('Saved formatted HTML to:', path)
      }
    }
  }

  return {
    originalHtml: html,
    loadedHtml: loaded,
    cleanedHtml: cleaned,
    formattedHtml,
    textContent,
    metadata: {
      originalLength: html.length,
      cleanedLength: cleaned.length,
      formattedLength: formattedHtml?.length,
      textLength: textContent.length,
      tokenCounts
    },
    files: Object.keys(files).length > 0 ? files : null
  }
}

/**
 * Clean HTML from a file
 */
export async function cleanHtmlFile(filePath: string, options: CleanerOptions = {}): Promise<CleanerResult> {
  const html = await readFile(filePath, 'utf-8')
  return cleanHtml(html, options)
}

/**
 * Clean HTML and save all processing stages to files
 */
export async function cleanHtmlWithAllStages(
  html: string,
  outputDir: string,
  outputBasename: string,
  options: Omit<CleanerOptions, 'outputDir' | 'outputBasename' | 'debug'> = {}
): Promise<CleanerResult> {
  return cleanHtml(html, {
    ...options,
    outputDir,
    outputBasename,
    debug: {
      saveOriginal: false, // We already have the raw file
      saveLoaded: true,
      saveCleaned: true,
      saveFormatted: true,
      enableLogging: true
    }
  })
}

/**
 * Fetch and clean HTML from a URL
 */
export async function cleanHtmlFromUrl(
  url: string,
  options: CleanerOptions & {
    fetchOptions?: RequestInit
    maxRetries?: number
    retryDelay?: number
  } = {}
): Promise<CleanerResult> {
  const {fetchOptions = {}, maxRetries = 3, retryDelay = 1000, ...cleanerOptions} = options

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = new Headers(fetchOptions.headers)
      headers.set(
        'user-agent',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )
      headers.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')

      const response = await fetch(url, {
        ...fetchOptions,
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      const html = await response.text()
      if (!html || html.length < 100) {
        throw new Error('Received empty or suspiciously short response')
      }

      return await cleanHtml(html, cleanerOptions)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < maxRetries) {
        const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 5000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Failed to fetch after ${maxRetries} attempts. Last error: ${lastError?.message}`)
}
