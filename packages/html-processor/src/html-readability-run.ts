#!/usr/bin/env bun
/* eslint-disable no-console */

/**
 * Utility script to extract readable content from HTML files
 *
 * Usage: bun run src/html-readability-utility.ts
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { htmlReadability } from './html-readability'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function processHtmlFiles() {
  const mediumHtmlPath = resolve(__dirname, 'fixtures', 'html-to-markdown.test.medium-raw.fixture')
  const mediumOutputPath = resolve(__dirname, 'fixtures', 'html-readability.test.medium-text.fixture')

  const mediumHtml = await readFile(mediumHtmlPath, 'utf-8')

  console.log('Processing Medium article with Readability...')

  const result = htmlReadability(
    mediumHtml,
    'https://medium.com/@vipra_singh/ai-agents-introduction-part-1-fbec7edb857d'
  )

  await writeFile(mediumOutputPath, JSON.stringify(result), 'utf-8')
}

// Run the utility
if (import.meta.main) {
  await processHtmlFiles()
}
