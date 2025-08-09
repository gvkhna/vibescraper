// .storybook/main.ts (or main.mts)
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import tsconfigPaths from 'vite-tsconfig-paths'
import type {InlineConfig} from 'vite'
import tailwindcss from '@tailwindcss/vite'
import {nodePolyfills} from 'vite-plugin-node-polyfills'
import type {StorybookConfig} from '@storybook/react-vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..') // monorepo root

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  core: {disableTelemetry: true},
  framework: {name: '@storybook/react-vite', options: {}},

  viteFinal: async (config_: InlineConfig) => {
    const {mergeConfig} = await import('vite')
    return mergeConfig(config_, {
      base: resolve(__dirname, '..'),
      // root: resolve(__dirname, '..'), // keep SB root explicit
      envDir: projectRoot, // ensure .env.* at monorepo root
      // resolve: {
      //   // Prefer ESM entry points where available
      //   mainFields: ['module', 'jsnext:main', 'browser', 'exports', 'main'],
      //   conditions: ['module', 'import', 'browser', 'development']
      // },
      // optimizeDeps: {
      //   esbuildOptions: {
      //     format: 'esm'
      //   }
      // },
      // build: {
      //   target: 'esnext',
      //   commonjsOptions: {
      //     // <-- you had a typo here: tranformMixedEsModules
      //     transformMixedEsModules: true
      //   }
      // },
      // ssr: {
      //   // If a dependency uses CJS at runtime, bundle it so 'require' is transformed
      //   // Add packages that trigger the error here:
      //   noExternal: [
      //     /* 'some-cjs-only-dep' */
      //   ]
      // },
      plugins: [
        tailwindcss(),
        tsconfigPaths({
          // Explicitly point to your monorepo tsconfig(s)
          projects: [resolve(__dirname, '../tsconfig.json')]
        }),
        nodePolyfills({protocolImports: true})
      ]
    })
  }
}

export default config
