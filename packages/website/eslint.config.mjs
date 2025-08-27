import rootConfig from '../../eslint.config.mjs';
import zustandSetRule from './.eslint-rules/enforce-zustand-set.mjs';
import zustandSelectorsRule from './.eslint-rules/enforce-zustand-selectors.mjs';
import honoHttpStatusCode from './.eslint-rules/enforce-hono-http-status-code.mjs';

export default [
  ...rootConfig,
  {
    ignores: [
      '.astro/**/*',
      '.eslint-rules/**/*',
      '.storybook/**/*',
      '.vite-plugins/**/*',
      '**/*stories*',
      'astro.config.ts',
      'drizzle.config.ts',
      'src/**/_*.tmp.ts',
      'src/**/_*.tmp.tsx',
      'src/components/ai-elements/**',
      'src/components/animate-ui/**',
      'src/components/ui/**'
    ]
  },
  {
    files: ['src/server/**/*.{js,ts}'],
    plugins: {
      'hono-http-status-code': honoHttpStatusCode
    },
    rules: {
      'hono-http-status-code/hono-http-status-code': 'error'
    }
  },
  {
    files: ['src/store/**/*.{js,ts}'],
    plugins: {
      'zustand-set': zustandSetRule
    },
    rules: {
      'zustand-set/enforce-zustand-set': 'error'
    }
  },
  {
    files: ['src/**/*.{tsx,jsx}'],
    plugins: {
      'zustand-selectors': zustandSelectorsRule
    },
    rules: {
      'zustand-selectors/enforce-zustand-selectors': 'error'
    }
  }
];
