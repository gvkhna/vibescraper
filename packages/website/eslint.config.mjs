import rootConfig from '../../eslint.config.mjs';
import zustandSetRule from './.eslint-rules/enforce-zustand-set.mjs';
import honoHttpStatusCode from './.eslint-rules/enforce-hono-http-status-code.mjs';

export default [
  ...rootConfig,
  {
    ignores: [
      '.astro/**/*',
      '.eslint-rules/**/*',
      '.storybook/**/*',
      'astro.config.ts',
      'src/components/ai-elements/**',
      'src/components/ui/**'
    ]
  },
  {
    files: ['src/store/**/*.{js,ts}'],
    plugins: {
      'enforce-zustand-set': zustandSetRule
    },
    rules: {
      'enforce-zustand-set/enforce-zustand-set': 'error'
    }
  },
  {
    files: ['src/server/**/*.{js,ts}'],
    plugins: {
      'hono-http-status-code': honoHttpStatusCode
    },
    rules: {
      'hono-http-status-code/hono-http-status-code': 'error'
    }
  }
];
