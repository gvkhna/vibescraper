import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    ignores: [
      '.storybook/**/*',
      '**/*stories*',
      'src/**/_*.tmp.ts',
      'src/**/_*.tmp.tsx',
      'src/components/ui/**'
    ]
  }
];
