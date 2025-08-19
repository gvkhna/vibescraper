import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'

import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [/^node:/]
    },
    target: 'esnext',
    sourcemap: true,
    minify: false,
    ssr: true // This tells Vite to build for server-side (Node.js) environment
  },
  ssr: {
    // noExternal: true,
    target: 'node'
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      // rollupTypes: true,
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.mjs']
    })
  ]
})
