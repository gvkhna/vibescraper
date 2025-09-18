import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'

import {loadEnv} from 'vite'
import {defineConfig} from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import node from '@astrojs/node'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import {viteMaildev} from '@vibescraper/dev-utils'
import {tanstackRouter} from '@tanstack/router-plugin/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')

const processEnv = process.env as Record<string, string>

const env = loadEnv(processEnv.NODE_ENV ?? 'development', projectRoot, '')
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
  outDir: 'dist',
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
              ssr: {
                external: ['@vibescraper/html-processor']
              },
              plugins: [
                tanstackRouter({
                  target: 'react',
                  routesDirectory: './src/routes',
                  generatedRouteTree: './src/routeTree.gen.ts',
                  routeFileIgnorePrefix: '-',
                  quoteStyle: 'single',
                  autoCodeSplitting: true
                }),
                viteMaildev(),
                tailwindcss(),
                tsconfigPaths()
              ] as any
            }
          })
        }
      }
    },
    react({
      experimentalDisableStreaming: true,
      babel: {
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              // compilationMode: 'annotation',
              target: '19',
              // panicThreshold: 'none',
              logger: {
                logEvent(filename: string, event: any) {
                  if (event.kind === 'CompileSuccess') {
                    console.log('Compiled:', filename)
                  }
                }
              }
            }
          ]
        ]
      }
    }),
    mdx()
  ]
})
