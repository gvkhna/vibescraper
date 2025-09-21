#!/usr/bin/env bun

/**
 * Run the extractor directly with Bun and write JSON fixtures.
 *
 * Usage from repo root:
 *   bun run tests/news.ycombinator.com/run-extract.ts
 *
 * Expects HTML fixtures produced by run-fetch.ts in ./fixtures.
 * For each page (1..5), reads the latest timestamped .clean.fixture (or .raw.fixture fallback),
 * runs the extractor, and writes <ts>-page-<n>.json.fixture with JSON.stringify(..., null, 2).
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import extractor from './extractor.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE_URL = 'https://news.ycombinator.com/'

type PageFixtureMeta = { ts: number; page: number; kind: 'clean' | 'raw' }

function parseFixtureFilename(name: string): PageFixtureMeta | null {
  // Matches: <ts>-page-<n>.(clean|raw).fixture
  const m = /^(\d+)-page-(\d)\.(clean|raw)\.fixture$/.exec(name)
  if (!m) {
    return null
  }
  return { ts: Number(m[1]), page: Number(m[2]), kind: m[3] as 'clean' | 'raw' }
}

function findLatestTimestamp(fixturesDir: string): number | null {
  const files = readdirSync(fixturesDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
  const metas: PageFixtureMeta[] = []
  for (const f of files) {
    const meta = parseFixtureFilename(f)
    if (meta) {
      metas.push(meta)
    }
  }
  if (metas.length === 0) {
    return null
  }
  metas.sort((a, b) => b.ts - a.ts)
  return metas[0].ts
}

async function runExtract() {
  const fixturesDir = resolve(__dirname, 'fixtures')
  mkdirSync(fixturesDir, { recursive: true })

  const latestTs = findLatestTimestamp(fixturesDir)
  if (!latestTs) {
    throw new Error('No existing fixtures found. Run run-fetch.ts first to create HTML fixtures.')
  }

  for (let page = 1; page <= 5; page++) {
    const cleanPath = resolve(fixturesDir, `${latestTs}-page-${page}.clean.fixture`)
    const rawPath = resolve(fixturesDir, `${latestTs}-page-${page}.raw.fixture`)

    let html: string | null = null
    try {
      html = readFileSync(cleanPath, 'utf-8')
      console.log(`Using cleaned HTML: ${cleanPath}`)
    } catch {
      try {
        html = readFileSync(rawPath, 'utf-8')
        console.log(`Using raw HTML: ${rawPath}`)
      } catch {
        throw new Error(`Missing fixture for page ${page}. Expected ${cleanPath} or ${rawPath}`)
      }
    }

    const url = page === 1 ? BASE_URL : `${BASE_URL}?p=${page}`
    const data = await extractor(html, url)

    const outPath = resolve(fixturesDir, `${latestTs}-page-${page}.json.fixture`)
    writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    console.log(`Wrote JSON fixture (${Array.isArray(data) ? data.length : 0} items): ${outPath}`)
  }
}

if (import.meta.main) {
  await runExtract()
}
