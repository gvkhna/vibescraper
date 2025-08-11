#!/usr/bin/env bun
/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
import {defineConfig} from 'drizzle-kit'

console.log('drizzle.config.ts - database url: ', process.env.DATABASE_URL!)

export default defineConfig({
  schema: './src/db/schema',
  out: './src/db/migrations',
  dialect: 'postgresql',
  breakpoints: false,
  migrations: {
    prefix: 'timestamp'
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
