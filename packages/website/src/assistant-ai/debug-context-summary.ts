import type { ModelMessage } from 'ai'
import debug from 'debug'
import truncate from 'lodash-es/truncate'

const logContextSummary = debug('app:prepare-context')

export function debugContextWindowSummary(messages: ModelMessage[], maxTokens: number, budget: number) {
  // Debug logging for context window
  logContextSummary('--- LLM Context Window Summary ---')
  logContextSummary(
    `Total messages: ${messages.length}, Estimated Tokens: ${maxTokens - budget}/${maxTokens}`
  )

  const maxMessageLength = 100

  messages.forEach((msg, index) => {
    const role = msg.role

    let contentPreview = ''
    let partsCount = 0
    if (typeof msg.content === 'string') {
      contentPreview = truncate(msg.content, { length: maxMessageLength })
    } else if (Array.isArray(msg.content)) {
      type m = typeof msg.content
      partsCount = msg.content.length
      msg.content.forEach((part, partIndex) => {
        const type = part.type
        switch (type) {
          case 'text': {
            contentPreview += `[text: ${truncate(part.text, { length: maxMessageLength })}],`
            break
          }
          case 'file': {
            contentPreview += `[file],`
            break
          }
          case 'image': {
            contentPreview += `[image],`
            break
          }
          case 'reasoning': {
            contentPreview += `[reason: ${truncate(part.text, { length: maxMessageLength })}],`
            break
          }
          case 'tool-call': {
            let toolCallInput = ''
            try {
              toolCallInput = JSON.stringify(part.input)
            } catch (e) {
              //
            }
            contentPreview += `[toolCall (${part.toolName}): ${truncate(toolCallInput, { length: maxMessageLength })}],`
            break
          }
          case 'tool-result': {
            contentPreview += `[toolResult (${part.toolName})],`
            break
          }
          default: {
            const _exhaustive: never = type
            break
          }
        }
      })
    } else {
      logContextSummary('Unknown message type: ', msg.content)
    }

    const partsSummary = partsCount > 0 ? `(p${partsCount})` : ''
    logContextSummary(`[${index}] ${role}${partsSummary}: `, contentPreview)
  })

  logContextSummary('--- End Context Window Summary ---')
}
