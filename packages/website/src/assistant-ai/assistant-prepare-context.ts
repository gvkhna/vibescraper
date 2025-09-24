import { convertToModelMessages, isToolUIPart, type ModelMessage, type UIMessage } from 'ai'
import debug from 'debug'
import truncate from 'lodash-es/truncate'

import * as schema from '@/db/schema'
import {
  type ChatMessagePersistanceType,
  convertChatMessageToUIMessage,
  isDataKey,
  isToolKey,
  type VSUIMessage
} from '@/partials/assistant-ui/chat-message-schema'

import { debugContextWindowSummary } from './debug-context-summary'
import { debugContextWindow } from './debug-context-window'

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
        if (isToolUIPart(part)) {
          let toolCallInput = ''
          try {
            toolCallInput = JSON.stringify(part.input)
          } catch (e) {
            //
          }
          let toolCallOutput = ''
          try {
            toolCallOutput = JSON.stringify(part.output)
          } catch (e) {
            //
          }
          outputTokens += estimateTokens(`${part.toolCallId}${toolCallInput}${toolCallOutput}`)
        }
        break
      }
      case type === 'file': {
        outputTokens += estimateTokens(part.url)
        break
      }
      case type === 'dynamic-tool': {
        let toolCallInput = ''
        try {
          toolCallInput = JSON.stringify(part.input)
        } catch (e) {
          //
        }
        let toolCallOutput = ''
        try {
          toolCallOutput = JSON.stringify(part.output)
        } catch (e) {
          //
        }
        outputTokens += estimateTokens(`${part.toolCallId}${toolCallInput}${toolCallOutput}`)
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
        outputTokens += estimateTokens(part.text)
        break
      default: {
        const _exhaustive: never = type
        break
      }
    }
  })
  return outputTokens
}

function sanitizeUIMessageForModel(message: VSUIMessage): VSUIMessage {
  const sanitizePartsIndicies: number[] = []
  message.parts.forEach((part, partIndex) => {
    const type = part.type
    switch (true) {
      case type === 'reasoning': {
        // currently setting provider metadata to empty
        // due to itemId errors with openai api
        // https://github.com/vercel/ai/issues/7099
        part.providerMetadata = {}
        break
      }
      case type === 'dynamic-tool': {
        break
      }
      case isDataKey(type): {
        sanitizePartsIndicies.push(partIndex)
        break
      }
      case isToolKey(type): {
        if (isToolUIPart(part)) {
          if (part.state === 'output-available') {
            // currently setting provider metadata to empty
            // due to itemId errors with openai api
            // https://github.com/vercel/ai/issues/7099
            part.callProviderMetadata = {}
          }
        }
        break
      }
      // default: {
      //   const _exhaustive: never = type
      //   break
      // }
    }
  })

  // Remove flagged parts in reverse order to avoid index shifting
  for (let i = sanitizePartsIndicies.length - 1; i >= 0; i--) {
    const idx = sanitizePartsIndicies[i]
    message.parts.splice(idx, 1)
  }

  return message
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
  maxTokens = 8_000
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
      const uiMessage = convertChatMessageToUIMessage(msg)
      const sanitizedMessage = sanitizeUIMessageForModel(uiMessage)
      contextWindow.push(sanitizedMessage)
      budget -= tok
    }
  }

  // window now is newest-first, reverse back to oldest→newest
  contextWindow.reverse()

  // Prepare final messages
  let finalMessages: ModelMessage[]

  // Prepend the system prompt only if it's a valid string
  if (typeof systemPrompt === 'string') {
    finalMessages = [
      { role: 'system', content: systemPrompt },
      ...convertToModelMessages(contextWindow, {
        // ignoreIncompleteToolCalls: true
      })
    ]
  } else {
    finalMessages = convertToModelMessages(contextWindow, {
      // ignoreIncompleteToolCalls: true
    })
  }

  debugContextWindowSummary(finalMessages, maxTokens, budget)
  debugContextWindow(finalMessages, maxTokens, budget)

  return finalMessages
}
