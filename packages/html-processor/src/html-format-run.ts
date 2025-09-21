#!/usr/bin/env bun
/* eslint-disable no-console */
/**
 * Utility script to format HTML files
 * Usage: bun run src/format-utility.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { htmlFormat } from './html-format'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function formatHtmlFile() {
  try {
    // Paths
    const inputPath = resolve(__dirname, 'fixtures', 'format-html.test.hackernews-raw.fixture')
    const outputPath = resolve(__dirname, 'fixtures', 'format-html.test.hackernews-formatted.fixture')

    console.log('📖 Reading raw HTML from:', inputPath)

    // Read the raw HTML
    const rawHtml = readFileSync(inputPath, 'utf-8')
    console.log(`  ✓ Read ${(rawHtml.length / 1024).toFixed(2)} KB of HTML`)

    // Format the HTML
    console.log('🎨 Formatting HTML...')
    const formattedHtml = await htmlFormat(rawHtml, {
      tabWidth: 2,
      printWidth: 120
    })
    console.log(`  ✓ Formatted to ${(formattedHtml.length / 1024).toFixed(2)} KB`)

    // Write the formatted HTML
    console.log('💾 Writing formatted HTML to:', outputPath)
    writeFileSync(outputPath, formattedHtml, 'utf-8')
    console.log('  ✓ Done!')

    // Show size comparison
    const sizeDiff = (((formattedHtml.length - rawHtml.length) / rawHtml.length) * 100).toFixed(1)
    console.log(`\n📊 Size difference: ${sizeDiff}% (${sizeDiff.startsWith('-') ? 'smaller' : 'larger'})`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}
if (import.meta.main) {
  // Run the formatter
  await formatHtmlFile()
}
