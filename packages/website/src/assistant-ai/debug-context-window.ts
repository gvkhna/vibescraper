import type { ModelMessage } from 'ai'
import debug from 'debug'
import truncate from 'lodash-es/truncate'

const logContext = debug('ai-context')

export function debugContextWindow(messages: ModelMessage[], maxTokens: number, budget: number) {
  // Debug logging for context window
  logContext('=== LLM Context Window ===')

  const maxMessageLength = 100

  messages.forEach((msg, index) => {
    const role = msg.role

    let partsCount = 0
    logContext(`[${index}] ${role}: `)
    if (typeof msg.content === 'string') {
      logContext(`  text: ${msg.content}`)
    } else if (Array.isArray(msg.content)) {
      type m = typeof msg.content
      partsCount = msg.content.length
      msg.content.forEach((part, partIndex) => {
        const type = part.type
        switch (type) {
          case 'text': {
            logContext(`  [${partIndex} text]: ${part.text}`)
            break
          }
          case 'file': {
            let fileData = ''
            try {
              fileData = JSON.stringify(part.data)
            } catch (e) {
              //
            }
            logContext(`  [${partIndex} file]: ${truncate(fileData, { length: 50 })}`)
            break
          }
          case 'image': {
            let imageData = ''
            try {
              imageData = JSON.stringify(part.image)
            } catch (e) {
              //
            }
            logContext(`  [${partIndex} img(${part.mediaType})]: ${truncate(imageData, { length: 50 })}`)
            break
          }
          case 'reasoning': {
            let providerOptions = ''
            try {
              providerOptions = JSON.stringify(part.providerOptions)
            } catch (e) {
              //
            }
            logContext(`  [${partIndex} reason]: ${part.text} [providerOptions: ${providerOptions}]`)
            break
          }
          case 'tool-call': {
            let toolCallInput = ''
            try {
              toolCallInput = JSON.stringify(part.input)
            } catch (e) {
              //
            }
            logContext(`  [${partIndex} toolCall (${part.toolName})]`)
            logContext(`      [input]: ${toolCallInput}`)
            break
          }
          case 'tool-result': {
            let toolCallResult = ''
            try {
              toolCallResult = JSON.stringify(part.output)
            } catch (e) {
              //
            }
            logContext(`  [${partIndex} toolRes ${part.toolName}]`)
            logContext(`      [result]: ${toolCallResult}`)
            break
          }
          default: {
            const _exhaustive: never = type
            break
          }
        }
      })
    } else {
      logContext('Unknown message type: ', msg.content)
    }
  })

  logContext('=== End Context Window Summary ===')
}
