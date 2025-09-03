import {defineConfig} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {resolve, dirname, isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..') // monorepo root

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              target: '19'
            }
          ]
        ]
      }
    }),
    tailwindcss(),
    // tsconfigPaths({
    //   projects: [resolve(__dirname, './tsconfig.json')]
    // }),
    dts({
      exclude: ['**/*.stories.*', '**/*.test.*']
    })
  ],
  // resolve: {
  //   alias: {
  //     'lucide-react/icons': fileURLToPath(
  //       new URL('../../node_modules/lucide-react/dist/esm/icons', import.meta.url)
  //     )
  //   }
  // },
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
  }
})
