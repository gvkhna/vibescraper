# @scrapeloop/html-processor

HTML processing utilities for the Scrapeloop project.

## Features

- **HTML Formatting**: Pretty-print compressed HTML using Prettier
- **HTML to Markdown**: Convert HTML to clean Markdown format
- **HTML Cleaning**: Remove unwanted elements and minify HTML
- **DOM Manipulation**: Work with HTML using Cheerio and JSDOM
- **Date Parsing**: Timezone-aware date extraction from HTML
- **Token Counting**: Count tokens for LLM processing

## Installation

```bash
bun add @scrapeloop/html-processor
```

## Usage

### Format HTML

```typescript
import { formatHtml } from '@scrapeloop/html-processor'

const compressed = '<div><p>Hello</p></div>'
const formatted = await formatHtml(compressed)
// Output:
// <div>
//   <p>Hello</p>
// </div>
```

### Convert HTML to Markdown

```typescript
import { htmlToMarkdown } from '@scrapeloop/html-processor'

const html = '<h1>Hello</h1><p>World</p>'
const markdown = htmlToMarkdown(html)
// Output: '# Hello\n\nWorld'

// With options
const markdown2 = htmlToMarkdown(wrappedHtml, { hasContainer: true })

// Using presets
import { htmlToMarkdownPresets } from '@scrapeloop/html-processor'
const minimal = htmlToMarkdownPresets.minimal(html)
```

### Clean HTML

```typescript
import { cleanHtml } from '@scrapeloop/html-processor'

const result = await cleanHtml(htmlString, {
  removeScripts: true,
  removeStyles: true,
  minify: true
})
```

## Development

### Scripts

```bash
# Build the package
bun run build

# Run tests
bun run test

# Format test assets
bun run format:assets

# Convert HTML assets to Markdown
bun run markdown:assets

# Type checking
bun run typecheck
```

### Testing

This package uses Vitest for testing with real HTML fixtures:

1. **Raw HTML**: Downloaded from real websites (e.g., Hacker News)
2. **Formatted HTML**: Pre-formatted versions for comparison
3. **Test Assets**: Located in `src/assets/`

The test imports HTML files using Vite's `?raw` feature:

```typescript
import rawHtml from './assets/hackernews-raw.html?raw'
import formattedHtml from './assets/hackernews-formatted.html?raw'

describe('formatHtml', () => {
  it('should format HTML correctly', async () => {
    const result = await formatHtml(rawHtml)
    expect(result).toBe(formattedHtml)
  })
})
```

### Updating Test Fixtures

To update the test fixtures with new HTML:

```bash
# Download new HTML
curl -s https://example.com -o src/assets/example-raw.html

# Format it
bun run format:assets

# Run tests
bun run test
```

## API

### formatHtml(html, options?)

Formats HTML string using Prettier.

**Options:**
- `tabWidth`: Number of spaces per indentation (default: 2)
- `useTabs`: Use tabs instead of spaces (default: false)
- `printWidth`: Line length before wrapping (default: 120)

### htmlToMarkdown(html, options?)

Converts HTML string to Markdown format.

**Options:**
- `hasContainer`: Whether the HTML is wrapped in a container element (default: false)
- `customInstance`: Custom HTMLarkdown instance with custom rules

### htmlToMarkdownPresets

Pre-configured conversion presets:
- `minimal`: Converts with minimal formatting (no extra line breaks)
- `standard`: Standard formatting
- `detailed`: Preserves more HTML structure

### cleanHtml(html, options?)

Cleans and optionally minifies HTML.

**Options:**
- `removeScripts`: Remove script tags (default: true)
- `removeStyles`: Remove style tags (default: true)
- `removeComments`: Remove comments (default: true)
- `minify`: Minify the output (default: false)

## License

Private