#!/usr/bin/env bun

/**
 * Utility script to convert HTML test assets to Markdown
 *
 * Usage: bun run src/markdown-utility.ts
 */

import {readdir, readFile, writeFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {htmlMarkdown} from './html-markdown'
import process from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function convertHtmlAssetsToMarkdown() {
  const assetsDir = resolve(__dirname, 'fixtures')

  try {
    // Read all files in the assets directory
    const files = await readdir(assetsDir)

    // Filter for HTML test files that need markdown conversion
    const htmlFiles = files.filter(
      (file) => file.includes('html-to-markdown.test') && file.endsWith('-raw.fixture')
    )

    console.log(`Found ${htmlFiles.length} HTML files to convert`)

    for (const htmlFile of htmlFiles) {
      const htmlPath = resolve(assetsDir, htmlFile)
      const mdFileName = htmlFile.replace('-raw.fixture', '-converted.fixture')
      const mdPath = resolve(assetsDir, mdFileName)

      console.log(`Converting ${htmlFile} to ${mdFileName}...`)

      // Read HTML content
      const htmlContent = await readFile(htmlPath, 'utf-8')

      // Convert to Markdown
      const markdownContent = htmlMarkdown(htmlContent)

      // Write Markdown file
      await writeFile(mdPath, markdownContent, 'utf-8')

      console.log(`✓ Converted ${htmlFile}`)
    }

    console.log('\nAll HTML assets converted to Markdown successfully!')
  } catch (error) {
    console.error('Error converting HTML assets:', error)
    process.exit(1)
  }
}

if (import.meta.main) {
  // Run the conversion
  await convertHtmlAssetsToMarkdown()
}
