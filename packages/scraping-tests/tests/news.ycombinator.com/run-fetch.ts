#!/usr/bin/env bun
/* eslint-disable no-console */

/**
 * Fetches the first 5 pages of Hacker News and writes raw HTML fixtures.
 *
 * Usage: bun run tests/news.ycombinator.com/run-fetch.ts
 *
 * Output files in fixtures/ (timestamp first for natural sort):
 *
 * - <unix_ts>-page-1.raw.fixture
 * - <unix_ts>-page-2.raw.fixture
 * - <unix_ts>-page-3.raw.fixture
 * - <unix_ts>-page-4.raw.fixture
 * - <unix_ts>-page-5.raw.fixture
 */

import { htmlCleaner, htmlFormat } from '@vibescraper/html-processor'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE_URL = 'https://news.ycombinator.com/'

const unixTimestamp = () => Math.floor(Date.now() / 1000)

async function fetchPage(page: number) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}?p=${page}`
  console.log(`Fetching page ${page}: ${url}`)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'vibescraper-scraping-tests/1.0 (+https://news.ycombinator.com)'
    }
  })
  if (!res.ok) {
    throw new Error(`Request failed for page ${page}: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

async function fetchAndWrite() {
  const fixturesDir = resolve(__dirname, 'fixtures')
  mkdirSync(fixturesDir, { recursive: true })

  // Use a single timestamp across the batch
  const ts = unixTimestamp()
  for (let page = 1; page <= 5; page++) {
    const html = await fetchPage(page)
    const filename = `${ts}-page-${page}.raw.fixture`
    const outPath = resolve(fixturesDir, filename)
    writeFileSync(outPath, html, 'utf-8')

    const cleanedOutputPath = resolve(fixturesDir, `${ts}-page-${page}.clean.fixture`)

    const result = await htmlCleaner(html)

    if (result?.html) {
      writeFileSync(cleanedOutputPath, result.html, 'utf-8')

      const formattedHtml = await htmlFormat(result.html, {
        tabWidth: 2,
        printWidth: 120
      })
      console.log(`Formatted to ${(formattedHtml.length / 1024).toFixed(2)} KB`)

      const formattedOutputPath = resolve(fixturesDir, `${ts}-page-${page}.format.fixture`)

      // Write the formatted HTML
      console.log('Writing formatted HTML to:', formattedOutputPath)
      writeFileSync(formattedOutputPath, formattedHtml, 'utf-8')
    } else {
      throw new Error('Failed to get page html')
    }

    console.log(`Saved page ${page} (${html.length} bytes) to: ${outPath}`)
  }
}

if (import.meta.main) {
  await fetchAndWrite()
}
