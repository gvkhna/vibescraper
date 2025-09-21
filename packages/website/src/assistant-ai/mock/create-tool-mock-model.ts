import type { LanguageModelV2StreamPart } from '@ai-sdk/provider'
import { type LanguageModel, simulateReadableStream, type UIMessageChunk } from 'ai'
import { convertArrayToReadableStream, mockId, MockLanguageModelV2 } from 'ai/test'
import debug from 'debug'

const log = debug('app:mock-tool-stream')

export type ToolMockModelKey = string | RegExp
export type ToolMockModelValue =
  | LanguageModelV2StreamPart[]
  | ((prompt: string) => LanguageModelV2StreamPart[])

type Route = { match: ToolMockModelKey; reply: ToolMockModelValue }

interface RouterOpts {
  chunkDelayInMs?: number
}

type RoutesMap = Map<ToolMockModelKey, ToolMockModelValue>

export function createToolMockModel(routes: RoutesMap) {
  const chunkDelayInMs = 350

  return new MockLanguageModelV2({
    // doGenerate: async (opts) => {
    //   return [{
    //     finishReason: 'stop'
    //   }]
    // },
    doStream: async (opts) => {
      if (Array.isArray(opts.prompt)) {
        log('start stream')
        opts.prompt.forEach((p) => {
          log('[prompt]', JSON.stringify(p))
        })
      } else {
        log('start stream', JSON.stringify(opts.prompt))
      }

      const msg = [...opts.prompt].reverse().find((m) => m.role === 'user')

      const lastUserMessage = msg
        ? msg.content
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join(' ')
        : ''
      log('last user', lastUserMessage)
      const id = 'text-1'
      const reply = pickRoute(lastUserMessage, routes)
      // log('chosen route', reply)

      const deltas = [
        { type: 'stream-start', warnings: [] },
        ...(reply ?? []),
        {
          type: 'text-start',
          id
        },
        {
          type: 'text-delta',
          id,
          delta: 'test message'
        },
        { type: 'text-end', id },
        {
          type: 'finish',
          finishReason: 'tool-calls',
          usage: {
            inputTokens: 1,
            outputTokens: 1,
            totalTokens: 1
          }
        }
      ] satisfies LanguageModelV2StreamPart[]
      // log('deltas', deltas)
      return {
        // stream: convertArrayToReadableStream(deltas)
        stream: simulateReadableStream({ chunks: deltas, chunkDelayInMs, initialDelayInMs: 300 })
      }
    }
  })
}

function chosenRoute(prompt: string, route: ToolMockModelValue) {
  if (typeof route === 'function') {
    return route(prompt)
  }
  return route
}

function pickRoute(prompt: string, routes: RoutesMap): LanguageModelV2StreamPart[] | null {
  for (const r of routes) {
    const key = r[0]
    const value = r[1]
    if (typeof key === 'string') {
      if (prompt.includes(key)) {
        return chosenRoute(prompt, value)
      }
    } else if (key instanceof RegExp) {
      if (key.test(prompt)) {
        return chosenRoute(prompt, value)
      }
    }
  }
  return null
}
