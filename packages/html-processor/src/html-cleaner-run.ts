#!/usr/bin/env bun

/**
 * Utility script to extract readable content from HTML files
 *
 * Usage: bun run src/html-readability-utility.ts
 */

import {readFile, writeFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {htmlCleaner} from './html-cleaner'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function processHtmlFiles() {
  const mediumHtmlPath = resolve(__dirname, 'assets', 'html-to-markdown.test.medium-raw.html')
  const mediumOutputPath = resolve(__dirname, 'assets', 'html-cleaner.test.medium.html')
  const mediumOutputTextPath = resolve(__dirname, 'assets', 'html-cleaner.test.medium.txt')

  const mediumHtml = await readFile(mediumHtmlPath, 'utf-8')

  console.log('Processing Medium article with html cleaner...')

  const result = await htmlCleaner(mediumHtml)

  await writeFile(mediumOutputPath, result ? result.html : '', 'utf-8')
  await writeFile(mediumOutputTextPath, result ? result.text : '', 'utf-8')
}

// Run the utility
if (import.meta.main) {
  await processHtmlFiles()
}
