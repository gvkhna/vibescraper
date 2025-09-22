import { JsonToSseTransformStream, type LanguageModel, streamText as aiStreamText, type ToolSet } from 'ai'
import debug from 'debug'
import { eq as sqlEq } from 'drizzle-orm'
import { type Context, Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

import { prepareContext } from '@/assistant-ai/assistant-prepare-context'
import * as schema from '@/db/schema'
import { nowait } from '@/lib/async-utils'
import { sqlTimestampToDate } from '@/lib/format-dates'
import { HttpStatusCode } from '@/lib/http-status-codes'
import {
  type ChatMessagePersistanceType,
  convertUIMessageToChatMessage,
  type VSUIMessage
} from '@/partials/assistant-ui/chat-message-schema'
import { PUBLIC_VARS } from '@/vars.public'
import type { HonoServer } from '..'

const log = debug('app:server:assistant')

export interface AIStreamArgs {
  requestContext: Context<HonoServer>
  systemPrompt: string | null | undefined
  model: LanguageModel
  conversationHistory: ChatMessagePersistanceType[]
  assistantMessage: typeof schema.projectChatMessage.$inferSelect
  tools?: ToolSet
  userMessagePublicId?: schema.ProjectChatMessagePublicId
}

export function aiStreamResponse(args: AIStreamArgs): Response {
  const {
    model,
    conversationHistory,
    systemPrompt,
    requestContext: c,
    assistantMessage,
    tools,
    userMessagePublicId
  } = args
  const db = c.get('db')

  const stopSignalController = new AbortController()

  const logAI = PUBLIC_VARS.DEV ? log : debug(`app:ai:${assistantMessage.id}`)

  let status: typeof schema.projectChatMessage.$inferSelect.status = 'generating'
  // Track message state in memory to handle concurrent events
  const state: typeof schema.projectChatMessage.$inferSelect.usage = {
    finalized: false,
    errored: false
  }

  const usage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cachedInputTokens: 0
  }

  const content: typeof schema.projectChatMessage.$inferSelect.content = { parts: [] }

  try {
    const result = aiStreamText({
      model,
      maxOutputTokens: 10000,
      tools: tools,
      stopWhen: ({ steps }) => {
        if (steps.length > 8) {
          return true
        }
        return false
      },
      providerOptions: {
        openai: {
          reasoningSummary: 'auto'
        }
      },
      experimental_repairToolCall: async () => {
        return null
      },
      // toolChoice: 'required',
      // tools: makeTools(db, project, projectCommitPublicId as schema.ProjectCommitPublicId),

      abortSignal: stopSignalController.signal,
      messages: prepareContext(systemPrompt, conversationHistory),

      // onAbort() {
      //   logAI('[Stream Aborted]')
      //   db.update(schema.projectChatMessage)
      //     .set({status: 'error'})
      //     .where(sqlEq(schema.projectChatMessage.id, assistantMessage.id))
      //     .catch((err: unknown) => {
      //       logAI('[DB Error]', 'Failed to update aborted message', err)
      //     })
      // },
      onChunk: ({ chunk }) => {
        const chunkType = chunk.type
        switch (chunkType) {
          case 'reasoning-delta': {
            break
          }
          case 'text-delta': {
            break
          }
          default: {
            logAI('[CHUNK]', JSON.stringify(chunk))
            break
          }
        }
        //   case 'tool-call': {
        //     type part = typeof chunk
        //     // Tool execution completed
        //     // toolCalls.push({
        //     //   toolCallId: chunk.toolCallId,
        //     //   toolName: chunk.toolName,
        //     //   error: chunk.error,
        //     //   invalid: chunk.invalid
        //     // })

        //     if (chunk.error) {
        //       logAI('[Tool Error]', chunk.toolName, chunk.error)
        //     }
        //     break
        //   }
        //   case 'reasoning-delta': {
        //     type part = typeof chunk
        //     // Reasoning tokens (for models like o1)
        //     // messageChunks.push({
        //     //   type: 'reasoning',
        //     //   text: chunk.text
        //     // })

        //     break
        //   }
        //   case 'source': {
        //     type part = typeof chunk
        //     // Web search or RAG sources
        //     let sourceUrl: string | undefined

        //     if (chunk.sourceType === 'url' && 'url' in chunk) {
        //       sourceUrl = chunk.url
        //     } else if ('filename' in chunk) {
        //       // Document sources don't have URL, use ID or filename
        //       sourceUrl = chunk.filename ?? chunk.id
        //     } else {
        //       sourceUrl = chunk.id
        //     }

        //     // messageChunks.push({
        //     //   type: 'source',
        //     //   url: sourceUrl,
        //     //   title: chunk.title,
        //     //   sourceType: chunk.sourceType
        //     // })

        //     if (PUBLIC_VARS.DEV) {
        //       logAI('[Source]', chunk.title)
        //     }
        //     break
        //   }
        //   case 'text-delta': {
        //     type part = typeof chunk
        //     // Regular text output
        //     // messageChunks.push({
        //     //   type: 'text',
        //     //   text: chunk.text
        //     // })

        //     break
        //   }
        //   case 'tool-input-delta': {
        //     type part = typeof chunk
        //     break
        //   }
        //   case 'tool-input-start': {
        //     type part = typeof chunk
        //     if (PUBLIC_VARS.DEV) {
        //       logAI('[Tool]', chunk.toolName)
        //     }
        //     break
        //   }
        //   case 'tool-result': {
        //     type part = typeof chunk
        //     // Tool execution result
        //     // toolCalls.push({
        //     //   toolCallId: chunk.toolCallId,
        //     //   toolName: chunk.toolName,
        //     //   input: chunk.input,
        //     //   output: chunk.output
        //     // })

        //     break
        //   }
        //   case 'raw': {
        //     type part = typeof chunk
        //     break
        //   }
        //   default: {
        //     const _exhaustive: never = chunkType
        //     if (PUBLIC_VARS.DEV) {
        //       logAI('[Unknown Chunk]', `Unhandled type: ${JSON.stringify(_exhaustive)}`)
        //     }
        //     break
        //   }
        // }
      },
      onError: async (error) => {
        // Type guard for error object
        let errorMessage: string | null = null
        let errorType: string | null = null

        if (typeof error === 'object') {
          if ('message' in error && error.message) {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            errorMessage = String(error.message)
          }
          if ('name' in error && error.name) {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            errorType = String(error.name)
          }
        } else {
          errorMessage = String(error)
        }

        logAI('[Stream onError]', error, 'type: ', errorType, errorMessage)

        // Update shared state
        state.errored = true
        if (state.errorMessage) {
          state.errorMessage = `${state.errorMessage}\n${errorMessage}`
        } else {
          state.errorMessage = errorMessage
        }

        state.finishReason = 'error'
        state.durationMs = Date.now() - sqlTimestampToDate(assistantMessage.createdAt).getTime()
        if (usage.inputTokens > 0) {
          state.inputTokens = usage.inputTokens
        }
        if (usage.outputTokens > 0) {
          state.outputTokens = usage.outputTokens
        }
        if (usage.cachedInputTokens > 0) {
          state.cachedInputTokens = usage.cachedInputTokens
        }
        if (usage.totalTokens > 0) {
          state.totalTokens = usage.totalTokens
        }
        if (usage.reasoningTokens > 0) {
          state.reasoningTokens = usage.reasoningTokens
        }

        await db
          .update(schema.projectChatMessage)
          .set({
            usage: state
          })
          .where(sqlEq(schema.projectChatMessage.id, assistantMessage.id))
      },
      onStepFinish: async (step) => {
        logAI(
          '[Stream onStepFinish]',
          step.finishReason,
          `${step.usage.totalTokens} tokens`,
          `${step.toolCalls.length} tools`
        )

        if (typeof step.usage.inputTokens === 'number') {
          usage.inputTokens += step.usage.inputTokens
        }
        if (typeof step.usage.outputTokens === 'number') {
          usage.outputTokens += step.usage.outputTokens
        }
        if (typeof step.usage.totalTokens === 'number') {
          usage.totalTokens += step.usage.totalTokens
        }
        if (typeof step.usage.reasoningTokens === 'number') {
          usage.reasoningTokens += step.usage.reasoningTokens
        }
        if (typeof step.usage.cachedInputTokens === 'number') {
          usage.cachedInputTokens += step.usage.cachedInputTokens
        }
      },

      onFinish: async (full) => {
        // Skip if error already occurred
        if (state.errored) {
          logAI('[Stream onFinish] Skipping onFinish due to error state')
          return
        }

        state.finishReason = full.finishReason
        state.inputTokens = full.totalUsage.inputTokens
        state.outputTokens = full.totalUsage.outputTokens
        state.totalTokens = full.totalUsage.totalTokens
        state.reasoningTokens = full.totalUsage.reasoningTokens
        state.cachedInputTokens = full.totalUsage.cachedInputTokens
        state.durationMs = Date.now() - sqlTimestampToDate(assistantMessage.createdAt).getTime()

        logAI(
          '[Stream onFinish]',
          full.finishReason,
          `${state.totalTokens} tokens`,
          `(${state.cachedInputTokens} cached)`,
          `${state.durationMs}ms`
        )

        await db
          .update(schema.projectChatMessage)
          .set({
            usage: state
          })
          .where(sqlEq(schema.projectChatMessage.id, assistantMessage.id))
      }
    })

    c.header('Content-Type', 'text/event-stream')
    c.header('Cache-Control', 'no-cache')
    c.header('Connection', 'keep-alive')

    const dataStream = result.toUIMessageStream<VSUIMessage>({
      generateMessageId: () => {
        return assistantMessage.publicId
      },
      onFinish: async (event) => {
        if (event.isAborted) {
          state.aborted = true
        }
        if (event.isContinuation) {
          state.continuation = true
        }

        // Store content for potential merging
        const newMessage = convertUIMessageToChatMessage(event.responseMessage)

        content.metadata = {
          error: content.metadata?.error ?? newMessage.metadata?.error ?? false,
          replyMessageId: userMessagePublicId
        }

        content.parts.push(...newMessage.parts)

        if (status !== 'error') {
          status = 'done'
        }
        await db
          .update(schema.projectChatMessage)
          .set({
            status,
            content,
            usage: state
          })
          .where(sqlEq(schema.projectChatMessage.id, assistantMessage.id))
      },
      onError: (error) => {
        // Prevent duplicate finalization
        if (state.finalized) {
          logAI('[UIStream onError] Already finalized, skipping')
          return 'There was an unexpected error. Please try again.'
        }

        status = 'error'
        state.finalized = true
        state.errored = true

        let errorMessage: string
        if (error instanceof Error) {
          errorMessage = error.message
          // Also log the stack trace in development
          if (PUBLIC_VARS.DEV && error.stack) {
            logAI('[UIStream onError]', error.stack)
          }
        } else if (typeof error === 'object' && error !== null) {
          // Handle objects that aren't Error instances
          errorMessage = JSON.stringify(error, null, 2)
        } else {
          errorMessage = String(error)
        }
        logAI('[UIStream onError] errorMessage: ', errorMessage)

        if (state.errorMessage) {
          state.errorMessage = `${state.errorMessage}\n${errorMessage}`
        } else {
          state.errorMessage = errorMessage
        }

        content.metadata = {
          error: true,
          replyMessageId: userMessagePublicId
        }
        content.parts.push({
          type: 'text',
          text: 'There was an unexpected error. Please try again.'
        })

        nowait(
          db
            .update(schema.projectChatMessage)
            .set({
              status,
              content,
              usage: state
            })
            .where(sqlEq(schema.projectChatMessage.id, assistantMessage.id))
        )
        // return undefined
        return 'There was an unexpected error. Please try again.'
      }
    })

    return streamSSE(c, (stream) =>
      stream.pipe(dataStream.pipeThrough(new JsonToSseTransformStream()).pipeThrough(new TextEncoderStream()))
    )
  } catch (e) {
    log('ai stream response text threw error', e)
    return c.json({ message: 'Some unknown streaming error' }, HttpStatusCode.BadRequest)
  }
}
