import {defineConfig} from 'tsup'

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  keepNames: true,
  outExtension: ({format}) => ({
    js: '.mjs',
    dts: '.d.mts'
  })
})
