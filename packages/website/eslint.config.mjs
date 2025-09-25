import {
  eslintHonoHttpStatusCode,
  eslintZustandImmerSliceSet,
  eslintZustandScopedSelectors
} from '@vibescraper/dev-utils';
import { defineConfig } from 'eslint/config';
import drizzle from 'eslint-plugin-drizzle';

import rootConfig from '../../eslint.config.mjs';

export default defineConfig([
  ...rootConfig,
  {
    ignores: [
      '.astro/**/*',
      '.storybook/**/*',
      'astro.config.ts',
      'drizzle.config.ts',
      'src/**/*stories*',
      'src/**/*tmp*',
      'src/components/ai-elements/**',
      'src/components/animate-ui/**',
      'src/components/ui/**'
    ]
  },
  {
    files: ['src/**/*.{js,ts}'],
    plugins: {
      drizzle
    },
    rules: {
      'drizzle/enforce-delete-with-where': 'error',
      'drizzle/enforce-update-with-where': 'error'
    }
  },
  {
    files: ['src/server/**/*.{js,ts}'],
    ...eslintHonoHttpStatusCode
  },
  {
    files: ['src/store/**/*.{js,ts}'],
    ...eslintZustandImmerSliceSet
  },
  {
    files: ['src/**/*.{tsx,jsx}'],
    ...eslintZustandScopedSelectors
  }
]);
