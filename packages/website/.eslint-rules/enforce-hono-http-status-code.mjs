/** @type {import('eslint').Linter.FlatConfigPlugin} */
export default {
  rules: {
    'hono-http-status-code': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Ensure `c.json`, `c.html`, `c.text`, and `c.body` are called with a status code as the second argument'
        },
        schema: [],
        messages: {
          missingStatus:
            'Responses via `c.json`, `c.html`, `c.text`, or `c.body` must include an HTTP status code as the second argument.'
        }
      },
      create(context) {
        return {
          CallExpression(node) {
            const validMethods = new Set(['json', 'html', 'text', 'body'])

            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'c' &&
              node.callee.property.type === 'Identifier' &&
              validMethods.has(node.callee.property.name)
            ) {
              const args = node.arguments
              if (args.length < 2) {
                context.report({node, messageId: 'missingStatus'})
              }
            }
          }
        }
      }
    }
  }
}
