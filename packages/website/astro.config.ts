import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'

import {loadEnv} from 'vite'
import {defineConfig} from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import node from '@astrojs/node'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import monacoEditorEsmPlugin from 'vite-plugin-monaco-editor-esm'
import sitemap from '@astrojs/sitemap'
import viteMaildev from './.vite-plugins/vite-maildev'
import {tanstackRouter} from '@tanstack/router-plugin/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')

const env = loadEnv(process.env.NODE_ENV ?? 'development', projectRoot, '')
// console.log('Loading env from:', projectRoot)
// console.log('Loaded env vars:', Object.keys(env))
// console.log('PUBLIC_HOSTNAME:', env.PUBLIC_HOSTNAME)

const {PUBLIC_HOSTNAME} = env

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_HOSTNAME,
  server: {
    port: 4321,
    host: true,
    allowedHosts: true
  },
  output: 'server',

  devToolbar: {
    enabled: false
  },
  trailingSlash: 'ignore',

  build: {
    inlineStylesheets: 'auto'
  },

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [
    {
      name: 'setup vite env',
      hooks: {
        'astro:config:setup': (options) => {
          options.updateConfig({
            vite: {
              envDir: projectRoot,
              plugins: [
                tanstackRouter({
                  routesDirectory: './src/routes',
                  generatedRouteTree: './src/routeTree.gen.ts',
                  routeFileIgnorePrefix: '-',
                  quoteStyle: 'single',
                  autoCodeSplitting: true
                }),
                viteMaildev(),
                tailwindcss(),
                tsconfigPaths(),
                monacoEditorEsmPlugin({})
              ]
            }
          })
        }
      }
    },
    react({
      experimentalDisableStreaming: true,
      babel: {
        plugins: [['babel-plugin-react-compiler']]
      }
    }),
    mdx()
  ]
})
