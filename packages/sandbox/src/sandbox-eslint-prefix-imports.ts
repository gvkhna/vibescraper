/* eslint-disable @typescript-eslint/no-explicit-any */

import {builtinModules} from 'node:module'
import type {Rule} from 'eslint' // works in Deno

const SAFE_PREFIX = /^(?:\.{0,2}\/|\/|https?:|npm:|node:|jsr:)/

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Add npm: or node: prefix for Deno imports',
      recommended: false
    },
    fixable: 'code',
    schema: [], // no options
    messages: {
      needsPrefix: "Add '{{prefix}}' prefix for '{{name}}' when running in Deno."
    }
  },
  create(ctx) {
    /** Decide if a raw spec is a Node core module */
    const isCore = (id: string) =>
      builtinModules.includes(id) || // cjs/esm list
      builtinModules.includes(`${id}/`) // edge case: subpath patterns

    function check(node: any) {
      const spec: string = node.source?.value
      if (!spec || SAFE_PREFIX.test(spec)) {
        return
      }

      const prefix = isCore(spec) ? 'node:' : 'npm:'
      ctx.report({
        node: node.source,
        messageId: 'needsPrefix',
        data: {prefix, name: spec},
        fix(fixer) {
          return fixer.replaceText(node.source, `"${prefix}${spec}"`)
        }
      })
    }

    function checkDynamicImport(node: any) {
      // Handle import() expressions
      if (node.type === 'ImportExpression' && node.source) {
        const spec: string = node.source.value
        if (!spec || SAFE_PREFIX.test(spec)) {
          return
        }

        const prefix = isCore(spec) ? 'node:' : 'npm:'
        ctx.report({
          node: node.source,
          messageId: 'needsPrefix',
          data: {prefix, name: spec},
          fix(fixer) {
            return fixer.replaceText(node.source, `"${prefix}${spec}"`)
          }
        })
      }
    }

    function checkRequire(node: any) {
      // Handle require() calls
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal'
      ) {
        const spec: string = node.arguments[0].value
        if (!spec || SAFE_PREFIX.test(spec)) {
          return
        }

        const prefix = isCore(spec) ? 'node:' : 'npm:'
        ctx.report({
          node: node.arguments[0],
          messageId: 'needsPrefix',
          data: {prefix, name: spec},
          fix(fixer) {
            return fixer.replaceText(node.arguments[0], `"${prefix}${spec}"`)
          }
        })
      }
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: checkDynamicImport,
      CallExpression: checkRequire
    }
  }
}
