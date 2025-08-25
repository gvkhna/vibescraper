import {defineConfig} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..') // monorepo root

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']]
      }
    }),
    tailwindcss(),
    tsconfigPaths({
      // Explicitly point to your monorepo tsconfig(s)
      projects: [resolve(__dirname, './tsconfig.json')]
    }),
    dts({
      insertTypesEntry: true,
      exclude: ['**/*.stories.*', '**/*.test.*']
    })
  ],
  resolve: {
    alias: {
      'lucide-react/icons': fileURLToPath(
        new URL('../../node_modules/lucide-react/dist/esm/icons', import.meta.url)
      )
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lucide-react',
        'lucide-react/icons/*',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-dialog',
        '@radix-ui/react-popover',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-select',
        '@radix-ui/react-slot',
        '@radix-ui/react-tooltip',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'type-fest'
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js'
      }
    }
  }
})
