import { convertToModelMessages, type ModelMessage, type UIMessage } from 'ai'
import debug from 'debug'

import * as schema from '@/db/schema'
import {
  type ChatMessagePersistanceType,
  convertChatMessageToUIMessage,
  isDataKey,
  isToolKey
} from '@/partials/assistant-ui/chat-message-schema'

const logContextSummary = debug('app:prepare-context')
/**
 * Roughly estimate tokens from characters.
 * (OpenAI guidance: 1 token ≈ 4 characters in English)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function estimateMessageTokens(message: ChatMessagePersistanceType): number {
  let outputTokens = 0
  message.content.parts.forEach((part) => {
    const type = part.type
    switch (true) {
      case isDataKey(type): {
        break
      }
      case isToolKey(type): {
        break
      }
      case type === 'file': {
        break
      }
      case type === 'dynamic-tool': {
        break
      }
      case type === 'source-url': {
        break
      }
      case type === 'source-document': {
        break
      }
      case type === 'step-start': {
        break
      }
      case type === 'text':
        outputTokens += estimateTokens(part.text)
        break
      case type === 'reasoning':
        break
      default: {
        const _exhaustive: never = type
        break
      }
    }
  })
  return outputTokens
}

/**
 * Prepends the system prompt, then picks as many of the latest
 * messages as will fit under maxTokens (including the system).
 *
 * @param systemPrompt  The string to send as the very first `system` message.
 * @param history       Full array of past messages, oldest→newest.
 * @param maxTokens     Total token budget for the request.
 */
export function prepareContext(
  systemPrompt: string | null | undefined,
  history: ChatMessagePersistanceType[],
  maxTokens = 4000
): ModelMessage[] {
  // Start token count with the system message
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0
  let budget = maxTokens - systemTokens

  // // We'll build a reversed window of history that fits the budget
  const contextWindow: UIMessage[] = []

  // Walk history from newest → oldest
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    const tok =
      typeof msg.usage?.outputTokens === 'number' ? msg.usage.outputTokens : estimateMessageTokens(msg)

    if (tok > budget) {
      break
    }
    if (msg.status === 'done') {
      contextWindow.push(convertChatMessageToUIMessage(msg))
      budget -= tok
    }
  }

  // window now is newest-first, reverse back to oldest→newest
  contextWindow.reverse()

  // Prepare final messages
  let finalMessages: ModelMessage[]

  // Prepend the system prompt only if it's a valid string
  if (typeof systemPrompt === 'string') {
    finalMessages = [{ role: 'system', content: systemPrompt }, ...convertToModelMessages(contextWindow)]
  } else {
    finalMessages = convertToModelMessages(contextWindow)
  }

  debugContextWindowSummary(finalMessages, maxTokens, budget)

  return finalMessages
}

function debugContextWindowSummary(messages: ModelMessage[], maxTokens: number, budget: number) {
  // Debug logging for context window
  logContextSummary('--- LLM Context Window Summary ---')
  logContextSummary(
    `Total messages: ${messages.length}, Estimated Tokens: ${maxTokens - budget}/${maxTokens}`
  )

  const messageTrimToLength = 100

  messages.forEach((msg, index) => {
    const role = msg.role
    // msg.
    // const contentPreview =
    //   typeof msg.content === 'string'
    //     ? msg.content.slice(0, messageTrimToLength) + (msg.content.length > messageTrimToLength ? '...' : '')
    //     : Array.isArray(msg.content)
    //       ? `[${msg.content.length} parts]`
    //       : '[complex content]'

    // logContextSummary(`[${index}] ${role}:`, contentPreview)

    // // Log full content if it's not too long
    // if (typeof msg.content === 'string' && msg.content.length <= messageTrimToLength) {
    //   logContextSummary('  Full:', msg.content)
    // } else if (typeof msg.content === 'string') {
    //   logContextSummary('  Length:', msg.content.length, 'chars')
    // } else if (Array.isArray(msg.content)) {
    //   msg.content.forEach((part, partIndex) => {
    //     if (typeof part === 'object' && 'type' in part) {
    //       if (part.type === 'text') {
    //         const preview = part.text.slice(0, messageTrimToLength) + (part.text.length > messageTrimToLength ? '...' : '')
    //         logContextSummary(`    Part ${partIndex} [text]:`, preview)
    //       } else if (part.type === 'tool-call') {
    //         logContextSummary(`    Part ${partIndex} [tool-call]:`, part.toolName, '- args:', JSON.stringify(part.input))
    //       } else if (part.type === 'tool-result') {
    //         const resultPreview = JSON.stringify(part.output)
    //         logContextSummary(`    Part ${partIndex} [tool-result]:`, part.toolName, '-', resultPreview)
    //       } else {
    //         logContextSummary(`    Part ${partIndex} [${part.type}]`)
    //       }
    //     }
    //   })
    // }
  })

  logContextSummary('--- End Context Window Summary ---')
}
