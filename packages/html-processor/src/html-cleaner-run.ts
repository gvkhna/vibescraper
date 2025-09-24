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

import { htmlCleaner } from './html-cleaner'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function processHtmlFiles() {
  const mediumHtmlPath = resolve(__dirname, 'fixtures', 'html-to-markdown.test.medium-raw.fixture')
  const mediumOutputPath = resolve(__dirname, 'fixtures', 'html-cleaner.test.medium.fixture')
  const mediumOutputTextPath = resolve(__dirname, 'fixtures', 'html-cleaner.test.medium-text.fixture')

  const mediumHtml = await readFile(mediumHtmlPath, 'utf-8')

  console.log('Processing Medium article with html cleaner...')

  const result = await htmlCleaner(mediumHtml)

  await writeFile(mediumOutputPath, result ? result.html : '', 'utf-8')
  await writeFile(mediumOutputTextPath, result ? result.text : '', 'utf-8')

  const hackerNewsRawPath = resolve(__dirname, 'fixtures', 'html-cleaner.test.hackernews-raw.fixture')
  const hackerNewsRaw = await readFile(hackerNewsRawPath, 'utf-8')
  const hackerNewsRawCleanedPath = resolve(
    __dirname,
    'fixtures',
    'html-cleaner.test.hackernews-passthrough.fixture'
  )

  const hackerNewsResult = await htmlCleaner(hackerNewsRaw, {
    stripAttributes: false,
    emptyHead: false,
    stripEmptyWhitespace: false,
    tagsToRemove: []
  })

  await writeFile(hackerNewsRawCleanedPath, hackerNewsResult ? hackerNewsResult.html : '', 'utf-8')
}

// Run the utility
if (import.meta.main) {
  await processHtmlFiles()
}
