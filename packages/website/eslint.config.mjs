import rootConfig from '../../eslint.config.mjs';
import {defineConfig} from 'eslint/config';
import {eslintHonoHttpStatusCode} from '@vibescraper/dev-utils';
import {eslintZustandSelectors} from '@vibescraper/dev-utils';
import {eslintZustandSet} from '@vibescraper/dev-utils';

export default defineConfig([
  ...rootConfig,
  {
    ignores: [
      '.astro/**/*',
      '.storybook/**/*',
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
    ...eslintHonoHttpStatusCode
  },
  {
    files: ['src/store/**/*.{js,ts}'],
    ...eslintZustandSet
  },
  {
    files: ['src/**/*.{tsx,jsx}'],
    ...eslintZustandSelectors
  }
]);
