#!/usr/bin/env bun

/**
 * Utility script to extract readable content from HTML files
 *
 * Usage: bun run src/html-readability-utility.ts
 */

import {readFile, writeFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {htmlReadability} from './html-readability'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function processHtmlFiles() {
  const mediumHtmlPath = resolve(__dirname, 'assets', 'html-to-markdown.test.medium-raw.html')
  const mediumOutputPath = resolve(__dirname, 'assets', 'html-readability.test.medium.txt')

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
