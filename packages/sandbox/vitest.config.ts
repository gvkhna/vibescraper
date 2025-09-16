import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    environment: 'node',
    fileParallelism: false,
    globals: true,
    globalSetup: ['tests/global-setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts']
  }
})
