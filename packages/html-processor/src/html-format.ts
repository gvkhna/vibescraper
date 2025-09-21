import prettier, { type Options } from 'prettier'

export type HtmlFormatOptions = Options
/**
 * Formats HTML string using Prettier
 * @param html - The HTML string to format
 * @param options - Formatting options
 * @returns Formatted HTML string
 */
export async function htmlFormat(html: string, options: HtmlFormatOptions = {}): Promise<string> {
  const formatted = await prettier.format(html, {
    parser: 'html',
    tabWidth: options.tabWidth ?? 2,
    useTabs: options.useTabs ?? false,
    printWidth: options.printWidth ?? 120,
    htmlWhitespaceSensitivity: 'css',
    bracketSameLine: false,
    singleQuote: false,
    bracketSpacing: true,
    semi: true,
    trailingComma: 'none',
    endOfLine: 'lf',
    ...options
  })

  return formatted
}
