module.exports = {
  // Base configuration - no plugins here to avoid conflicts
  tailwindFunctions: ['clsx'],
  bracketSameLine: false,
  singleAttributePerLine: true,
  htmlWhitespaceSensitivity: 'css',
  semi: false,
  printWidth: 110,
  trailingComma: 'none',
  bracketSpacing: false,
  jsxSingleQuote: true,
  singleQuote: true,
  overrides: [
    {
      files: ['*.astro'],
      options: {
        parser: 'astro',
        printWidth: 90,
        astroAllowShorthand: true,
        plugins: [
          require.resolve('prettier-plugin-astro'),
          require.resolve('prettier-plugin-tailwindcss'),
          require.resolve('prettier-plugin-classnames'),
          require.resolve('prettier-plugin-merge')
        ]
      }
    },
    {
      files: ['*.tsx', '*.jsx'],
      options: {
        plugins: [
          require.resolve('prettier-plugin-tailwindcss'),
          require.resolve('prettier-plugin-classnames'),
          require.resolve('prettier-plugin-merge')
        ]
      }
    },
    {
      files: 'eslint.config.mjs',
      options: {
        semi: true
      }
    }
  ]
}
