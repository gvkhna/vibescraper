/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// remove-legacy-fetch-imports.ts
import type {Rule} from 'eslint'

// BANISHED.add("undici-fetch");  // hypothetical
// BANISHED.add("whatwg-fetch");
const BANISHED = new Set(['node-fetch', 'npm:node-fetch', 'cross-fetch', 'isomorphic-fetch', 'whatwg-fetch'])

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Remove node-fetch/cross-fetch/etc. imports now that fetch is global',
      recommended: false
    },
    fixable: 'code',
    schema: [],
    messages: {
      remove: "Remove '{{name}}' import - Fetch is global in modern runtimes."
    }
  },
  create(ctx) {
    //------------------------------------------------------------------
    // helpers
    //------------------------------------------------------------------
    /* Matches require("node-fetch") or require('cross-fetch') */
    function isLegacyFetchRequire(node: any) {
      return (
        node.type === 'CallExpression' &&
        node.callee.name === 'require' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal' &&
        BANISHED.has(node.arguments[0].value)
      )
    }

    //------------------------------------------------------------------
    // visitors
    //------------------------------------------------------------------
    function checkImport(node: any) {
      const spec = node.source?.value
      if (spec && BANISHED.has(spec)) {
        ctx.report({
          node,
          messageId: 'remove',
          data: {name: spec},
          fix: (fixer) => fixer.remove(node)
        })
      }
    }

    return {
      ImportDeclaration: checkImport,
      ExportAllDeclaration: checkImport,
      ExportNamedDeclaration: checkImport,
      VariableDeclaration(node: any) {
        // handle `const f = require("node-fetch")`
        for (const decl of node.declarations) {
          if (decl.init && isLegacyFetchRequire(decl.init)) {
            ctx.report({
              node,
              messageId: 'remove',
              data: {name: decl.init.arguments[0].value},
              fix: (fixer) => fixer.remove(node)
            })
          }
        }
      }
    }
  }
}
