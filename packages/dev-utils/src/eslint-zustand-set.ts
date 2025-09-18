import type {Rule, Linter} from 'eslint'

export const plugin = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ensure Zustand `set` is called with three args: (fn, true, "actionName"), and the first arg uses `draft` as the parameter name'
    },
    schema: [],
    messages: {
      invalidArgs: 'Zustand `set` must be called with three arguments: (fn, true, "actionName")',
      invalidParamName: 'The first parameter of the function passed to `set` must be named `draft`'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'set') {
          return
        }

        const args = node.arguments

        if (args.length !== 3) {
          context.report({node, messageId: 'invalidArgs'})
          return
        }

        const [first, second, third] = args

        const isSecondArgTrue = second.type === 'Literal' && second.value === true
        const isThirdArgString = third.type === 'Literal' && typeof third.value === 'string'

        if (!isSecondArgTrue || !isThirdArgString) {
          context.report({node, messageId: 'invalidArgs'})
        }

        // New check: first argument must be a function with first param named "draft"
        if (
          (first.type === 'ArrowFunctionExpression' || first.type === 'FunctionExpression') &&
          first.params.length > 0
        ) {
          const param = first.params[0]
          if (param.type !== 'Identifier' || param.name !== 'draft') {
            context.report({node: first, messageId: 'invalidParamName'})
          }
        }
      }
    }
  }
} as const satisfies Rule.RuleModule

export const eslintZustandSet = {
  rules: {
    'eslint-zustand/set': 'error'
  },
  plugins: {
    'eslint-zustand': {
      rules: {
        set: plugin
      }
    }
  }
} as const satisfies Linter.Config
