import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: (id, importer, isResolved) => {
        // Keep relative imports in src bundled
        if (id.startsWith('.') || isAbsolute(id)) {
          return false
        }

        // Otherwise externalize (like 'react', 'react-dom', etc.)
        return true
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: '.',
        entryFileNames: '[name].js'
      }
    }
  },
  plugins: [
    dts({
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.mjs']
    })
  ]
})
