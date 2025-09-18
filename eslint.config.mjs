import eslint from '@eslint/js';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';
// import astroPlugin from 'eslint-plugin-astro';
// import astroParser from 'astro-eslint-parser';
// import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default defineConfig([
  {
    ignores: [
      // Configs & root files
      'eslint.config.mjs',
      'vite.config.ts',
      // Build artifacts
      'dist*/**/*',
      'packages/**/dist/**/*',
      'tmp/**/*',
      '**/*tmp*',
      '**/*test*',

      // Auto-generated
      '**/_*',

      // Non-TS files
      '**/*.cjs',
      '**/*.js',
      '**/*.mjs'
    ]
  },
  ...defineConfig(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname
        }
      },
      plugins: {},
      rules: {
        // '@typescript-eslint/no-deprecated': 'off',

        'template-curly-spacing': ['error', 'never'],
        'no-template-curly-in-string': 'error',

        // 'unused-imports/no-unused-imports': 'error',
        // '@typescript-eslint/no-unused-vars': ['error', {vars: 'all', args: 'none', ignoreRestSiblings: true}],

        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'error',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/prefer-for-of': 'off',
        '@typescript-eslint/consistent-indexed-object-style': 'off',
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/no-inferrable-types': 'warn',

        // warn about undefined usage
        'no-undefined': 'warn',
        eqeqeq: ['warn', 'always'],
        // Restrict comparisons with undefined
        '@typescript-eslint/no-unnecessary-condition': [
          'warn',
          {
            allowConstantLoopConditions: true
          }
        ],
        // Prevent variables from being initialized to undefined
        '@typescript-eslint/no-explicit-any': 'warn',
        // Prefer optional chaining over explicit undefined checks
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        // Prevent nullish coalescing when the left side can be undefined
        '@typescript-eslint/prefer-nullish-coalescing': [
          'warn',
          {
            allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
            ignoreBooleanCoercion: false,
            ignoreConditionalTests: false,
            ignoreIfStatements: false,
            ignoreMixedLogicalExpressions: false,
            ignorePrimitives: {
              bigint: false,
              boolean: false,
              number: false,
              string: false
            },
            ignoreTernaryTests: false
          }
        ],
        // Prevent functions from returning undefined explicitly
        'no-useless-return': 'warn',
        curly: ['error', 'all'],
        'no-void': 'error',
        '@typescript-eslint/no-meaningless-void-operator': 'error',
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        'no-undef-init': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',

        // Disallow dynamic imports
        // eslint config fragment
        'no-restricted-syntax': [
          'error',

          // Already in your config
          {
            selector: 'ImportExpression',
            message: 'Dynamic imports are not allowed. Use static imports instead.'
          },
          {
            selector: 'WithStatement',
            message:
              '`with` is disallowed - it is confusing, non-standard in strict mode, and breaks optimization.'
          },

          // === Additional suggestions ===

          {
            selector: 'LabeledStatement',
            message: 'Labels make code harder to read. Use clearer control flow instead.'
          },
          // Example:
          // labelName: for (const x of arr) { ... }

          {
            selector: 'SequenceExpression',
            message: 'Comma operator is rarely needed - split into separate statements.'
          },
          // Example:
          // a = 1, b = 2;

          {
            selector:
              'UnaryExpression[operator="delete"][argument.type="MemberExpression"][argument.object.type="Identifier"]',
            message:
              'Avoid deleting object properties on regular objects - use maps or `undefined` assignment instead.'
          },
          // Example:
          // delete obj.prop;

          {
            selector: 'BinaryExpression[operator="in"][right.type="ArrayExpression"]',
            message: '`in` with arrays checks for index existence, not values. This is likely a mistake.'
          },
          // Example:
          // if (2 in [10, 20]) { ... } // checks index, not value

          {
            selector: 'CallExpression[callee.type="Identifier"][callee.name="eval"]',
            message: '`eval` is dangerous and should never be used.'
          },
          // Example:
          // eval("console.log('bad')");

          {
            selector: 'CallExpression[callee.type="Identifier"][callee.name="Function"]',
            message: 'Avoid the Function constructor - it behaves like eval.'
          }
          // Example:
          // const fn = new Function('a', 'b', 'return a + b');
        ],

        'no-restricted-imports': [
          'error',
          {
            paths: [
              {name: 'assert', message: "Use 'node:assert' instead of 'assert'"},
              {name: 'buffer', message: "Use 'node:buffer' instead of 'buffer'"},
              {name: 'child_process', message: "Use 'node:child_process' instead of 'child_process'"},
              {name: 'console', message: "Use 'node:console' instead of 'console'"},
              {name: 'crypto', message: "Use 'node:crypto' instead of 'crypto'"},
              {
                name: 'diagnostics_channel',
                message: "Use 'node:diagnostics_channel' instead of 'diagnostics_channel'"
              },
              {name: 'events', message: "Use 'node:events' instead of 'events'"},
              {name: 'fs', message: "Use 'node:fs' instead of 'fs'"},
              {name: 'fs/promises', message: "Use 'node:fs/promises' instead of 'fs/promises'"},
              {name: 'module', message: "Use 'node:module' instead of 'module'"},
              {name: 'os', message: "Use 'node:os' instead of 'os'"},
              {name: 'path', message: "Use 'node:path' instead of 'path'"},
              {name: 'punycode', message: "Use 'node:punycode' instead of 'punycode'"},
              {name: 'querystring', message: "Use 'node:querystring' instead of 'querystring'"},
              {name: 'readline', message: "Use 'node:readline' instead of 'readline'"},
              {name: 'sqlite', message: "Use 'node:sqlite' instead of 'sqlite'"},
              {name: 'stream', message: "Use 'node:stream' instead of 'stream'"},
              {name: 'string_decoder', message: "Use 'node:string_decoder' instead of 'string_decoder'"},
              {name: 'timers', message: "Use 'node:timers' instead of 'timers'"},
              {name: 'tty', message: "Use 'node:tty' instead of 'tty'"},
              {name: 'url', message: "Use 'node:url' instead of 'url'"},

              {name: 'async_hooks', message: "Use 'node:async_hooks' instead of 'async_hooks'"},
              {name: 'dgram', message: "Use 'node:dgram' instead of 'dgram'"},
              {name: 'dns', message: "Use 'node:dns' instead of 'dns'"},
              {name: 'http', message: "Use 'node:http' instead of 'http'"},
              {name: 'http2', message: "Use 'node:http2' instead of 'http2'"},
              {name: 'https', message: "Use 'node:https' instead of 'https'"},
              {name: 'inspector', message: "Use 'node:inspector' instead of 'inspector'"},
              {name: 'net', message: "Use 'node:net' instead of 'net'"},
              {name: 'perf_hooks', message: "Use 'node:perf_hooks' instead of 'perf_hooks'"},
              {name: 'process', message: "Use 'node:process' instead of 'process'"},
              {name: 'test', message: "Use 'node:test' instead of 'test'"},
              {name: 'tls', message: "Use 'node:tls' instead of 'tls'"},
              {name: 'util', message: "Use 'node:util' instead of 'util'"},
              {name: 'v8', message: "Use 'node:v8' instead of 'v8'"},
              {name: 'vm', message: "Use 'node:vm' instead of 'vm'"},
              {name: 'worker_threads', message: "Use 'node:worker_threads' instead of 'worker_threads'"},
              {name: 'zlib', message: "Use 'node:zlib' instead of 'zlib'"},

              {name: 'cluster', message: "Use 'node:cluster' instead of 'cluster'"},
              {name: 'domain', message: "Use 'node:domain' instead of 'domain'"},
              {name: 'repl', message: "Use 'node:repl' instead of 'repl'"},
              {name: 'sea', message: "Use 'node:sea' instead of 'sea'"},
              {name: 'trace_events', message: "Use 'node:trace_events' instead of 'trace_events'"},
              {name: 'wasi', message: "Use 'node:wasi' instead of 'wasi'"}
            ]
          }
        ],

        'no-restricted-globals': [
          'error',
          {
            name: '__dirname',
            message: 'Do not use __dirname. Use import.meta.url instead.'
          },
          {
            name: '__filename',
            message: 'Do not use __filename. Use import.meta.url instead.'
          },
          {
            name: 'exports',
            message: 'Do not use CommonJS exports. Use ESM exports instead.'
          },
          {
            name: 'module',
            message: 'Do not use CommonJS module. Use ESM syntax instead.'
          },
          {
            name: 'require',
            message: 'Do not use require(). Use import instead.'
          },
          {
            name: 'process',
            message: "Do not use process global. Use import process from 'node:process' instead."
          },
          {
            name: 'Buffer',
            message: "Do not use global Buffer. Import { Buffer } from 'node:buffer' instead."
          },
          {
            name: 'window',
            message: 'Do not use global window. Use `globalThis.window`.'
          },
          {
            name: 'customElements',
            message: 'Do not use global customElements. Use `globalThis.customElements`.'
          },
          {
            name: 'document',
            message: 'Do not use global document. Use `globalThis.document`.'
          },
          {
            name: 'navigator',
            message: 'Do not use navigator. Use `globalThis.navigator`.'
          },
          {
            name: 'localStorage',
            message: 'Do not use localStorage. Use `globalThis.localStorage`.'
          },
          {
            name: 'sessionStorage',
            message: 'Do not use sessionStorage. Use `globalThis.sessionStorage`.'
          },
          {
            name: 'alert',
            message: 'Do not use alert(). Use a custom modal or UI notification instead.'
          },
          {
            name: 'confirm',
            message: 'Do not use confirm(). Use a UI-based confirmation modal.'
          },
          {
            name: 'prompt',
            message: 'Do not use prompt(). Use a UI-based input dialog.'
          },
          {
            name: 'event',
            message: 'Do not use global event. Use function parameters instead.'
          },
          {
            name: 'name',
            message: 'Do not use global name. Use a scoped variable instead.'
          },
          {
            name: 'parent',
            message: 'Do not use window.parent. Avoid cross-origin issues.'
          },
          {
            name: 'fdescribe',
            message: 'Do not commit fdescribe. Use describe instead.'
          },
          {
            name: 'fit',
            message: 'Do not commit fit. Use it/test instead.'
          }
        ],

        'no-async-promise-executor': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',

        '@typescript-eslint/no-empty-object-type': [
          'error',
          {
            allowWithName: 'Props$'
          }
        ],

        'no-console': ['warn'],
        'no-global-assign': 'error',
        'prefer-const': 'warn',
        'no-shadow': 'error',
        'no-shadow-restricted-names': 'error',
        '@typescript-eslint/no-shadow': ['error']
      }
    }
  ),
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-compiler': reactCompiler,
      '@stylistic': stylistic
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // this is enforced in react files because sometimes llms add
      // comments inline in react which can cause hard to find parsing errors
      '@stylistic/line-comment-position': ['error', {position: 'above'}],

      'react/jsx-no-bind': ['error', {allowArrowFunctions: true, allowFunctions: true}],
      'react/jsx-no-undef': ['error', {allowGlobals: false}],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-compiler/react-compiler': 'error'
    }
  }
]);
