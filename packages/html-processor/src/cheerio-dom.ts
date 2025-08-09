import * as cheerio from 'cheerio'

/**
 * Enhanced Cheerio wrapper with DOM-like APIs for better ergonomics
 * and potential implementation swapping in the future
 */
export class CheerioDOM {
  private $: cheerio.CheerioAPI

  constructor(html: string) {
    this.$ = cheerio.load(html)
  }

  /**
   * Get the underlying Cheerio API instance
   */
  get cheerio(): cheerio.CheerioAPI {
    return this.$
  }

  /**
   * querySelector equivalent - returns first match
   */
  querySelector(selector: string): CheerioElement | null {
    const element = this.$(selector).first()
    return element.length > 0 ? new CheerioElement(element, this.$) : null
  }

  /**
   * querySelectorAll equivalent - returns all matches
   */
  querySelectorAll(selector: string): CheerioElement[] {
    const elements = this.$(selector)
    const results: CheerioElement[] = []

    elements.each((_, el) => {
      results.push(new CheerioElement(this.$(el), this.$))
    })

    return results
  }

  /**
   * XPath-like functionality (basic implementation)
   * For full XPath support, consider using a dedicated library
   */
  xpath(expression: string): CheerioElement[] {
    // Basic XPath to CSS selector conversion
    let cssSelector = expression
      .replace(/\/\//g, ' ') // descendant combinator
      .replace(/\//g, ' > ') // child combinator
      .replace(/\[@([^=]+)="([^"]+)"\]/g, '[$1="$2"]') // attribute selectors
      .replace(/\[(\d+)\]/g, ':nth-child($1)') // position selectors
      .replace(/text\(\)/g, '') // remove text() - handle in CheerioElement

    return this.querySelectorAll(cssSelector)
  }

  /**
   * Get root element
   */
  get documentElement(): CheerioElement {
    return new CheerioElement(this.$(':root'), this.$)
  }

  /**
   * Get body element
   */
  get body(): CheerioElement | null {
    return this.querySelector('body')
  }

  /**
   * Get head element
   */
  get head(): CheerioElement | null {
    return this.querySelector('head')
  }

  /**
   * Get title element
   */
  get title(): string {
    return this.$('title').text()
  }

  /**
   * Get HTML content
   */
  get innerHTML(): string {
    return this.$.html()
  }

  /**
   * Get text content
   */
  get textContent(): string {
    return this.$.text()
  }

  /**
   * Create element from HTML string
   */
  createElement(html: string): CheerioElement {
    const element = this.$(html)
    return new CheerioElement(element, this.$)
  }
}

/**
 * DOM element wrapper for Cheerio elements
 */
export class CheerioElement {
  private element: cheerio.Cheerio<any>
  private $: cheerio.CheerioAPI

  constructor(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI) {
    this.element = element
    this.$ = $
  }

  /**
   * Get the underlying Cheerio element
   */
  get cheerio(): cheerio.Cheerio<any> {
    return this.element
  }

  /**
   * DOM-like properties
   */
  get textContent(): string {
    return this.element.text().trim()
  }

  set textContent(value: string) {
    this.element.text(value)
  }

  get innerHTML(): string {
    return this.element.html() || ''
  }

  set innerHTML(value: string) {
    this.element.html(value)
  }

  get outerHTML(): string {
    return this.$.html(this.element) || ''
  }

  /**
   * Attribute methods
   */
  getAttribute(name: string): string | null {
    const value = this.element.attr(name)
    return typeof value === 'string' ? value : null
  }

  setAttribute(name: string, value: string): void {
    this.element.attr(name, value)
  }

  removeAttribute(name: string): void {
    this.element.removeAttr(name)
  }

  hasAttribute(name: string): boolean {
    return this.element.attr(name) !== undefined
  }

  /**
   * Get all attributes as an object
   */
  get attributes(): Record<string, string> {
    const attrs: Record<string, string> = {}
    const node = this.element[0]
    if (node && 'attribs' in node) {
      Object.assign(attrs, node.attribs)
    }
    return attrs
  }

  /**
   * Query methods
   */
  querySelector(selector: string): CheerioElement | null {
    const found = this.element.find(selector).first()
    return found.length > 0 ? new CheerioElement(found, this.$) : null
  }

  querySelectorAll(selector: string): CheerioElement[] {
    const found = this.element.find(selector)
    const results: CheerioElement[] = []

    found.each((_, el) => {
      results.push(new CheerioElement(this.$(el), this.$))
    })

    return results
  }

  /**
   * Parent/child navigation
   */
  get parentElement(): CheerioElement | null {
    const parent = this.element.parent()
    return parent.length > 0 ? new CheerioElement(parent, this.$) : null
  }

  get children(): CheerioElement[] {
    const children = this.element.children()
    const results: CheerioElement[] = []

    children.each((_, el) => {
      results.push(new CheerioElement(this.$(el), this.$))
    })

    return results
  }

  get firstChild(): CheerioElement | null {
    const first = this.element.children().first()
    return first.length > 0 ? new CheerioElement(first, this.$) : null
  }

  get lastChild(): CheerioElement | null {
    const last = this.element.children().last()
    return last.length > 0 ? new CheerioElement(last, this.$) : null
  }

  get nextElementSibling(): CheerioElement | null {
    const next = this.element.next()
    return next.length > 0 ? new CheerioElement(next, this.$) : null
  }

  get previousElementSibling(): CheerioElement | null {
    const prev = this.element.prev()
    return prev.length > 0 ? new CheerioElement(prev, this.$) : null
  }

  /**
   * Utility methods
   */
  matches(selector: string): boolean {
    return this.element.is(selector)
  }

  closest(selector: string): CheerioElement | null {
    const closest = this.element.closest(selector)
    return closest.length > 0 ? new CheerioElement(closest, this.$) : null
  }

  contains(element: CheerioElement): boolean {
    return this.element.has(element.element).length > 0
  }

  /**
   * Get tag name
   */
  get tagName(): string {
    return this.element.prop('tagName')?.toLowerCase() || ''
  }

  /**
   * Get element ID
   */
  get id(): string {
    return this.getAttribute('id') || ''
  }

  set id(value: string) {
    this.setAttribute('id', value)
  }

  /**
   * Class methods
   */
  get className(): string {
    return this.getAttribute('class') || ''
  }

  set className(value: string) {
    this.setAttribute('class', value)
  }

  get classList(): {
    contains: (className: string) => boolean
    add: (...classNames: string[]) => void
    remove: (...classNames: string[]) => void
    toggle: (className: string, force?: boolean) => void
    replace: (oldClass: string, newClass: string) => void
  } {
    return {
      contains: (className: string) => this.element.hasClass(className),
      add: (...classNames: string[]) => {
        classNames.forEach((cls) => this.element.addClass(cls))
      },
      remove: (...classNames: string[]) => {
        classNames.forEach((cls) => this.element.removeClass(cls))
      },
      toggle: (className: string, force?: boolean) => {
        if (force === undefined) {
          this.element.toggleClass(className)
        } else if (force) {
          this.element.addClass(className)
        } else {
          this.element.removeClass(className)
        }
      },
      replace: (oldClass: string, newClass: string) => {
        if (this.element.hasClass(oldClass)) {
          this.element.removeClass(oldClass).addClass(newClass)
        }
      }
    }
  }

  /**
   * Manipulation methods
   */
  append(content: string | CheerioElement): void {
    if (typeof content === 'string') {
      this.element.append(content)
    } else {
      this.element.append(content.element)
    }
  }

  prepend(content: string | CheerioElement): void {
    if (typeof content === 'string') {
      this.element.prepend(content)
    } else {
      this.element.prepend(content.element)
    }
  }

  remove(): void {
    this.element.remove()
  }

  empty(): void {
    this.element.empty()
  }

  /**
   * Clone the element
   */
  clone(deep: boolean = true): CheerioElement {
    const cloned = this.element.clone()
    return new CheerioElement(cloned, this.$)
  }

  /**
   * Check if element exists
   */
  exists(): boolean {
    return this.element.length > 0
  }
}