import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')

const processEnv = process.env as Record<string, string>

export default defineConfig(() => {
  const env = loadEnv('example', projectRoot, '')

  return {
    test: {
      reporters: ['verbose'],
      globals: true,
      environment: 'node',
      testTimeout: 120000,
      hookTimeout: 30000,
      env: {
        ...env,
        // Override specific values
        NODE_ENV: 'production'
      }
    }
  }
})
