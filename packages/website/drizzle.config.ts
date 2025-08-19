#!/usr/bin/env bun
import {defineConfig} from 'drizzle-kit'

const processEnv = process.env as Record<string, string>

console.log('drizzle.config.ts - database url: ', processEnv.DATABASE_URL)

export default defineConfig({
  schema: './src/db/schema',
  out: './src/db/migrations',
  dialect: 'postgresql',
  breakpoints: false,
  migrations: {
    prefix: 'timestamp'
  },
  dbCredentials: {
    url: processEnv.DATABASE_URL
  }
})
