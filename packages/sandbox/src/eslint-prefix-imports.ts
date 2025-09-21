import type { Rule } from 'eslint'
import type * as ESTree from 'estree'
import { builtinModules } from 'node:module'

const SAFE_PREFIX = /^(?:\.{0,2}\/|\/|https?:|npm:|node:|jsr:)/

export const plugin = {
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
    function isCore(id: string) {
      return (
        builtinModules.includes(id) || // cjs/esm list
        builtinModules.includes(`${id}/`) // edge case: subpath patterns
      )
    }

    function check(
      node: (ESTree.ExportAllDeclaration | ESTree.ExportNamedDeclaration | ESTree.ImportDeclaration) &
        Rule.NodeParentExtension
    ) {
      const spec = node.source?.value
      if (typeof spec !== 'string') {
        return
      }
      if (!node.source) {
        return
      }
      if (!spec || SAFE_PREFIX.test(spec)) {
        return
      }

      const prefix = isCore(spec) ? 'node:' : 'npm:'
      ctx.report({
        node: node.source,
        messageId: 'needsPrefix',
        data: { prefix, name: spec },
        fix(fixer) {
          return fixer.replaceText(node.source, `"${prefix}${spec}"`)
        }
      })
    }

    function checkDynamicImport(node: ESTree.ImportExpression & Rule.NodeParentExtension) {
      // Handle import() expressions
      if (!('value' in node.source) || typeof node.source.value !== 'string') {
        return
      }
      const spec: string = node.source.value
      if (!spec || SAFE_PREFIX.test(spec)) {
        return
      }

      const prefix = isCore(spec) ? 'node:' : 'npm:'
      ctx.report({
        node: node.source,
        messageId: 'needsPrefix',
        data: { prefix, name: spec },
        fix(fixer) {
          return fixer.replaceText(node.source, `"${prefix}${spec}"`)
        }
      })
    }

    function checkRequire(node: ESTree.CallExpression & Rule.NodeParentExtension) {
      // Handle require() calls
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal'
      ) {
        const spec = node.arguments[0].value
        if (typeof spec !== 'string') {
          return
        }
        if (!spec || SAFE_PREFIX.test(spec)) {
          return
        }

        const prefix = isCore(spec) ? 'node:' : 'npm:'
        ctx.report({
          node: node.arguments[0],
          messageId: 'needsPrefix',
          data: { prefix, name: spec },
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
} as const satisfies Rule.RuleModule
