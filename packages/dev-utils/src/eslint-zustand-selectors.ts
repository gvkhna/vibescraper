import type { Linter, Rule } from 'eslint'
import type * as ESTree from 'estree'

// Helper function to check if expression is simple state access
function isSimpleStateAccess(
  node:
    | ESTree.ArrowFunctionExpression['body']
    | ESTree.FunctionExpression['body']
    | ESTree.MemberExpression['object'],
  selector: ESTree.ArrowFunctionExpression | ESTree.FunctionExpression
) {
  switch (node.type) {
    case 'MemberExpression':
      // Check the object is either state identifier or another member expression
      if (node.object.type === 'Identifier') {
        // Must start with 'state'
        const firstArgument = selector.params[0]
        if (
          selector.params[0] &&
          firstArgument.type === 'Identifier' &&
          node.object.name !== firstArgument.name
        ) {
          return false
        }
        return true
      }
      // Recursively check nested member expressions
      return isSimpleStateAccess(node.object, selector)

    case 'ChainExpression':
      // ChainExpression wraps optional chains
      return isSimpleStateAccess(node.expression, selector)

    default:
      // Everything else is not allowed
      // This includes: LogicalExpression (??), ConditionalExpression (?:),
      // BinaryExpression (+, -, etc), CallExpression, NewExpression,
      // TemplateLiteral, ObjectExpression, ArrayExpression, etc.
      return false
  }
}

export const plugin = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure useStore selectors are simple state paths with no operations or logic'
    },
    schema: [],
    messages: {
      missingSelector: 'useStore must be called with a selector function',
      wrongParamName: 'useStore selector parameter must be named "state"',
      noBlockBody: 'useStore selectors cannot have block bodies. Use simple arrow functions.',
      noEntireState: 'Do not return the entire state object. Select specific slices or properties.',
      tooManyArguments: 'useStore should only have one argument (the selector function)',
      noOperations:
        'useStore selectors must be simple state paths only. No operations, conditionals, or fallback values allowed. Move all logic to component body.'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a useStore call
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'useStore') {
          return
        }

        // useStore must have exactly one argument
        if (node.arguments.length === 0) {
          context.report({
            node,
            messageId: 'missingSelector'
          })
          return
        }

        if (node.arguments.length > 1) {
          context.report({
            node,
            messageId: 'tooManyArguments'
          })
          return
        }

        const selector = node.arguments[0]

        // Selector must be a function
        if (selector.type !== 'ArrowFunctionExpression' && selector.type !== 'FunctionExpression') {
          context.report({
            node: selector,
            messageId: 'missingSelector'
          })
          return
        }

        // Check parameter
        if (selector.params.length > 0) {
          const param = selector.params[0]

          // Must be a simple identifier, not destructuring
          if (param.type !== 'Identifier') {
            context.report({
              node: param,
              messageId: 'noOperations'
            })
            return
          }

          // Parameter must be named 'state'
          if (param.name !== 'state') {
            context.report({
              node: param,
              messageId: 'wrongParamName'
            })
            return
          }
        }

        // No block bodies allowed
        if (selector.body.type === 'BlockStatement') {
          context.report({
            node: selector,
            messageId: 'noBlockBody'
          })
          return
        }

        // Check if returning entire state
        if (selector.body.type === 'Identifier') {
          const bodyName = selector.body.name
          if (selector.params.length > 0 && selector.params[0].type === 'Identifier') {
            if (bodyName === selector.params[0].name) {
              context.report({
                node: selector,
                messageId: 'noEntireState'
              })
              return
            }
          }
        }

        // The body MUST be either:
        // 1. A MemberExpression (state.foo.bar)
        // 2. An OptionalMemberExpression (state.foo?.bar)
        // 3. A ChainExpression containing only member access (state.foo?.bar?.baz)
        // Nothing else is allowed - no operations, no conditionals, no fallbacks

        if (!isSimpleStateAccess(selector.body, selector)) {
          context.report({
            node: selector,
            messageId: 'noOperations'
          })
        }
      }
    }
  }
} as const satisfies Rule.RuleModule

export const eslintZustandSelectors = {
  rules: {
    'eslint-zustand/selectors': 'error'
  },
  plugins: {
    'eslint-zustand': {
      rules: {
        selectors: plugin
      }
    }
  }
} as const satisfies Linter.Config
