module.exports = {
  // Base configuration - no plugins here to avoid conflicts
  tailwindFunctions: ['clsx', 'tw', 'cn'],
  bracketSameLine: false,
  singleAttributePerLine: true,
  htmlWhitespaceSensitivity: 'css',
  semi: false,
  printWidth: 110,
  trailingComma: 'none',
  bracketSpacing: false,
  jsxSingleQuote: true,
  singleQuote: true,
  plugins: [],
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
    // Match all json except package.json
    {
      files: ['*.json', '**/*.json'],
      options: {
        plugins: [require.resolve('prettier-plugin-sort-json')],
        jsonRecursiveSort: true
      }
    },
    // Match only package.json
    {
      files: ['package.json', '**/package.json'],
      options: {
        plugins: [require.resolve('prettier-plugin-packagejson')],
        packageSortOrder: [
          // Identity & metadata
          'name',
          'version',
          'private',
          'description',
          'keywords',
          'homepage',
          'bugs',
          'repository',
          'license',
          'author',
          'contributors',
          'funding',

          // Package behavior
          'type',
          'main',
          'module',
          'types',
          'typings',
          'exports',
          'bin',
          'files',
          'man',
          'directories',
          'workspaces',

          // Environment & constraints
          'engines',
          'os',
          'cpu',

          // Scripts
          'scripts',

          // Dependencies
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'peerDependenciesMeta',
          'optionalDependencies',
          'bundleDependencies',
          'overrides',
          'resolutions',

          // Config / tool-specific
          'config',
          'publishConfig',
          'eslintConfig',
          'prettier',
          'stylelint',
          'jest',
          'babel',
          'tsconfig',
          'ava',
          'release',
          'husky',
          'lint-staged'
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
