#!/usr/bin/env bun
/* eslint-disable no-restricted-globals */
/* eslint-disable no-console */
// import {config} from 'dotenv'
import {defineConfig} from 'drizzle-kit'
// import {fileURLToPath} from 'node:url'
// import {dirname, resolve} from 'node:path'
// import process from 'node:process'

// const __dirname = dirname(fileURLToPath(import.meta.url))
// const projectRootEnv = resolve(__dirname, '../../.env')

// config({path: projectRootEnv})

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
