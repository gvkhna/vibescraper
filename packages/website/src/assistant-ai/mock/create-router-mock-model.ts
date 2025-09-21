/* eslint-disable no-undefined */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* ---------------------------------------------------------------------------
   mock-stream-text.ts - Stream format aligned with real aiStreamText output
   ---------------------------------------------------------------------------
   The *real* helper writes SSE chunks that look like
     f:{"messageId":"msg-..."}\n\n
     0:"word "\n\n (one or more)
     e:{...}\n\n
     d:{...}\n\n
   This mock reproduces that exact framing, so the frontend parser works
   without changes.  (See bottom of file for higher‑level router helpers.)
--------------------------------------------------------------------------- */

import { type LanguageModel, simulateReadableStream } from 'ai'
import { mockId, MockLanguageModelV2 } from 'ai/test'
import debug from 'debug'

const log = debug('app:mock-stream-text')

/* ===========================================================================
   Higher‑level **PromptRouterMock** built on top of *AI SDK test* utilities
   ===========================================================================
   ▸ createRouterMockModel(routes) → MockLanguageModelV1
   ▸ createRouterMockStream(routes) → MockLanguageModelV1 that streams chunks

   Enable deterministic unit tests with *zero* boilerplate:

   const model = createRouterMockStream({
     /price/i: 'The price is $42.',
     'hello':  'Hello, John!',
     default: (prompt) => prompt.toUpperCase(),
   })

   const result = streamText({ model, prompt: 'hello there' })
============================================================================*/

export type RouterMockModelKey = string | RegExp
export type RouterMockModelValue = string | ((prompt: string) => string)

type Route = { match: RouterMockModelKey; reply: RouterMockModelValue }

interface RouterOpts {
  chunkDelayInMs?: number
  wordsPerChunk?: number
}

type RoutesMap = Map<RouterMockModelKey, RouterMockModelValue>

export function createRouterMockModel(routes: RoutesMap) {
  // const routeArr: Route[] = Object.entries(routes).map(([k, v]) => ({
  //   match: k === 'default' ? /.*/ : k,
  //   reply: v
  // }))
  const chunkDelayInMs = 100,
    wordsPerChunk = 2

  return new MockLanguageModelV2({
    doStream: async (opts) => {
      log('start stream', opts.prompt)
      const msg = [...opts.prompt].reverse().find((m) => m.role === 'user')

      const lastUserMessage = msg
        ? msg.content
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join(' ')
        : ''
      log('last user', lastUserMessage)
      const reply = pickRoute(lastUserMessage, routes)
      log('chosen route', reply)
      const id = 'text-1'
      const deltas: any[] = [
        { type: 'text-start', id },
        ...chunkByWords(reply, wordsPerChunk).map((slice) => ({
          type: 'text-delta',
          id,
          delta: slice
        })),
        { type: 'text-end', id },
        {
          type: 'finish',
          finishReason: 'stop',
          logprobs: undefined,
          usage: { promptTokens: 1, completionTokens: 1 }
        }
      ]
      return {
        rawCall: { rawPrompt: opts.prompt, rawSettings: {} },
        stream: simulateReadableStream({ chunks: deltas, chunkDelayInMs, initialDelayInMs: 300 })
      }
    }
  })
}

function chunkByWords(txt: string, wordsPerChunk = 2) {
  const parts: string[] = []
  let acc = ''
  for (const w of txt.split(/(\s+)/)) {
    acc += w
    if (acc.trim().split(/\s+/).length >= wordsPerChunk) {
      parts.push(acc)
      acc = ''
    }
  }
  if (acc) {
    parts.push(acc)
  }
  return parts
}

function chosenRoute(prompt: string, route: RouterMockModelValue) {
  if (typeof route === 'function') {
    return route(prompt)
  }
  return route
}

function pickRoute(prompt: string, routes: RoutesMap): string {
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
  return prompt.toUpperCase()
}
