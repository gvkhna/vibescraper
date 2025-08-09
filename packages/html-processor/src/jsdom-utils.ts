import {JSDOM} from 'jsdom'

/**
 * JSDOM wrapper for consistent API with CheerioDOM
 */
export class JSDOMWrapper {
  private dom: JSDOM
  private document: Document
  private window: Window

  constructor(html: string, options?: ConstructorParameters<typeof JSDOM>[1]) {
    this.dom = new JSDOM(html, {
      contentType: 'text/html',
      ...options
    })
    this.document = this.dom.window.document
    this.window = this.dom.window as unknown as Window
  }

  /**
   * Get the JSDOM instance
   */
  get jsdom(): JSDOM {
    return this.dom
  }

  /**
   * Get the document
   */
  get doc(): Document {
    return this.document
  }

  /**
   * Get the window
   */
  get win(): Window {
    return this.window
  }

  /**
   * querySelector - returns first match
   */
  querySelector(selector: string): Element | null {
    return this.document.querySelector(selector)
  }

  /**
   * querySelectorAll - returns all matches
   */
  querySelectorAll(selector: string): Element[] {
    return Array.from(this.document.querySelectorAll(selector))
  }

  /**
   * Get element by ID
   */
  getElementById(id: string): Element | null {
    return this.document.getElementById(id)
  }

  /**
   * Get elements by class name
   */
  getElementsByClassName(className: string): Element[] {
    return Array.from(this.document.getElementsByClassName(className))
  }

  /**
   * Get elements by tag name
   */
  getElementsByTagName(tagName: string): Element[] {
    return Array.from(this.document.getElementsByTagName(tagName))
  }

  /**
   * Get HTML content
   */
  get innerHTML(): string {
    return this.document.documentElement.outerHTML
  }

  /**
   * Get text content
   */
  get textContent(): string {
    return this.document.body?.textContent || ''
  }

  /**
   * Get title
   */
  get title(): string {
    return this.document.title
  }

  set title(value: string) {
    this.document.title = value
  }

  /**
   * Serialize to HTML string
   */
  serialize(): string {
    return this.dom.serialize()
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.window.close()
  }

  /**
   * Execute script in the context
   */
  executeScript(script: string): any {
    return (this.window as any).eval(script)
  }

  /**
   * Add event listener to element
   */
  addEventListener(selector: string, event: string, handler: EventListener): void {
    const element = this.querySelector(selector)
    if (element) {
      element.addEventListener(event, handler)
    }
  }

  /**
   * Trigger event on element
   */
  triggerEvent(selector: string, eventType: string, eventInit?: EventInit): void {
    const element = this.querySelector(selector)
    if (element) {
      const Event = (this.window as any).Event
      const event = new Event(eventType, eventInit)
      element.dispatchEvent(event)
    }
  }

  /**
   * Set cookie
   */
  setCookie(cookie: string): void {
    Object.defineProperty(this.document, 'cookie', {
      writable: true,
      value: cookie
    })
  }

  /**
   * Get cookies
   */
  get cookies(): string {
    return this.document.cookie
  }

  /**
   * Set user agent
   */
  setUserAgent(userAgent: string): void {
    Object.defineProperty(this.window.navigator, 'userAgent', {
      writable: true,
      value: userAgent
    })
  }

  /**
   * Navigate to URL (simulated)
   */
  navigate(url: string): void {
    this.window.location.href = url
  }

  /**
   * Get current URL
   */
  get url(): string {
    return this.window.location.href
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
    const startTime = Date.now()

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const element = this.querySelector(selector)
        if (element) {
          clearInterval(checkInterval)
          resolve(element)
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval)
          resolve(null)
        }
      }, 100)
    })
  }
}

/**
 * Create a JSDOM instance from HTML
 */
export function createJSDOM(html: string, options?: ConstructorParameters<typeof JSDOM>[1]): JSDOMWrapper {
  return new JSDOMWrapper(html, options)
}

/**
 * Parse HTML with JSDOM and return cleaned HTML
 */
export function parseWithJSDOM(html: string, options?: {removeScripts?: boolean; removestyles?: boolean}): string {
  const dom = new JSDOM(html)
  const document = dom.window.document

  if (options?.removeScripts) {
    const scripts = document.querySelectorAll('script')
    scripts.forEach((script) => script.remove())
  }

  if (options?.removestyles) {
    const styles = document.querySelectorAll('style')
    styles.forEach((style) => style.remove())
  }

  const result = dom.serialize()
  dom.window.close()
  return result
}

/**
 * Extract text content using JSDOM
 */
export function extractTextWithJSDOM(html: string): string {
  const dom = new JSDOM(html)
  const text = dom.window.document.body?.textContent || ''
  dom.window.close()
  return text.trim()
}

/**
 * Clean HTML attributes using JSDOM
 */
export function cleanAttributesWithJSDOM(
  html: string,
  keepAttributes: string[] = ['id', 'class', 'href', 'src', 'alt']
): string {
  const dom = new JSDOM(html)
  const document = dom.window.document

  const allElements = document.querySelectorAll('*')
  allElements.forEach((element) => {
    const attributes = Array.from(element.attributes)
    attributes.forEach((attr) => {
      if (!keepAttributes.includes(attr.name) && !attr.name.startsWith('aria-')) {
        element.removeAttribute(attr.name)
      }
    })
  })

  const result = dom.serialize()
  dom.window.close()
  return result
}

/**
 * Execute JavaScript in HTML context and get result
 */
export async function executeInContext(
  html: string,
  script: string,
  options?: {
    runScripts?: 'dangerously' | 'outside-only'
    resources?: 'usable'
  }
): Promise<any> {
  const dom = new JSDOM(html, {
    runScripts: options?.runScripts || 'dangerously',
    resources: options?.resources
  })

  const result = await (dom.window as any).eval(script)
  dom.window.close()
  return result
}