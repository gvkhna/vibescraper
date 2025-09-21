import { eslintHonoHttpStatusCode } from '@vibescraper/dev-utils';
import { eslintZustandSelectors } from '@vibescraper/dev-utils';
import { eslintZustandSet } from '@vibescraper/dev-utils';
import { defineConfig } from 'eslint/config';

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
