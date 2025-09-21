import type { Linter, Rule } from 'eslint'

import { plugin as prefixImports } from './eslint-prefix-imports'

export const eslintDenoCompat = {
  rules: {
    'deno-compat/prefix-imports': 'error'
  },
  plugins: {
    'deno-compat': {
      rules: {
        'prefix-imports': prefixImports
      }
    }
  }
} as const satisfies Linter.Config
