import {Hono, type Context} from 'hono'
import {type HonoServer} from '.'
import * as schema from '@/db/schema'
import {
  asc as sqlAsc,
  inArray as sqlInArray,
  max as sqlMax,
  eq as sqlEq,
  desc as sqlDesc,
  and as sqlAnd,
  getTableColumns
} from 'drizzle-orm'
import {z} from 'zod'
import debug from 'debug'
import {validator} from 'hono/validator'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {userCannotProjectAction} from '@/lib/permissions-helper'
import {streamSSE} from 'hono/streaming'
import {
  streamText as aiStreamText,
  convertToModelMessages,
  JsonToSseTransformStream,
  type UIMessage
} from 'ai'
import {createPaginationEntity, DEFAULT_PAGE_SIZE} from '@/store/pagination-entity-state'
// import {
//   collapseAssistantChunks,
//   userContentToSimpleString
// } from '@partials/assistant-ui/chat-message-schema'
import {PRIVATE_VARS} from '@/vars.private'
import mockPromptGenerationFn from '@/assistant-llm/mock-llm/mock-prompt-generation'
import type {ChatFileVersionBlockType} from '@/partials/assistant-ui/chat-message-schema'
// import type {ProjectVersionBlockType} from '@partials/assistant-ui/project-version-block'
// import {createGroq} from '@ai-sdk/groq'
// import {makeTools} from '@/private-llm/assistant-tools'
// import {prepareMessages} from '@/private-llm/assistant-prepare-context'
// import SimpleSystemPrompt from '@/private-llm/prompts/system-prompt.txt?raw'
// import {createAnthropic} from '@ai-sdk/anthropic'
// import {createOpenAI} from '@ai-sdk/openai'
// import template from 'lodash-es/template'

const log = debug('app:server:assistant')

const MAX_BODY_PREVIEW = 10_000 // characters

export async function logRequestDetails(c: Context) {
  const req = c.req.raw.clone()

  /* ---------- headers ---------- */
  const headersObj = Object.fromEntries(req.headers.entries())
  log('[Headers]', headersObj)

  /* ---------- body (safe) ------ */
  if (req.bodyUsed) {
    log('[Body]', '[already consumed]')
    return
  }

  const ct = req.headers.get('content-type') ?? ''

  // Clone can throw "unusable" in Undici if body is empty/locked
  let bodyText: string | undefined
  try {
    const clone = req.clone()

    if (ct.includes('application/json') || ct.startsWith('text/')) {
      bodyText = await clone.text()
    } else if (ct.startsWith('multipart/form-data')) {
      bodyText = '[multipart/form-data omitted]'
    } else if (ct) {
      bodyText = `[${ct} body omitted]`
    } else {
      bodyText = '[no body]'
    }
  } catch (err) {
    log('[Body logging error]', err)
    bodyText = '[unreadable body]'
  }

  if (bodyText && bodyText.length > MAX_BODY_PREVIEW) {
    bodyText = bodyText.slice(0, MAX_BODY_PREVIEW) + '… (truncated)'
  }

  log('[Body]', bodyText)
}

const app = new Hono<HonoServer>()
  .post(
    '/deleteChat',
    validator('json', (value) => {
      return value as {
        projectChatPublicId: schema.ProjectChatPublicId
      }
    }),
    async (c) => {
      const {projectChatPublicId} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      const projectChat = await db.query.projectChat.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectChatPublicId)
      })

      if (!projectChat) {
        return c.json({message: 'Project chat not found'}, HttpStatusCode.NotFound)
      }

      const projectId = projectChat.projectId

      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.id, projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'update', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      await db
        .update(schema.projectChat)
        .set({
          chatType: 'deleted'
        })
        .where(sqlEq(schema.projectChat.publicId, projectChatPublicId))

      const {id: _, projectId: __, ...projectChatCols} = getTableColumns(schema.projectChat)
      const chats = await db
        .select(projectChatCols)
        .from(schema.projectChat)
        .where(
          sqlAnd(
            sqlEq(schema.projectChat.projectId, project.id),
            sqlInArray(schema.projectChat.chatType, ['empty', 'chat'])
          )
        )
        .orderBy(sqlDesc(schema.projectChat.createdAt))
        .limit(DEFAULT_PAGE_SIZE + 1)

      const paginateProjectChats = createPaginationEntity<schema.ProjectChatCursor>()
      const {items: projectChats, pageInfo} = paginateProjectChats(chats, DEFAULT_PAGE_SIZE)

      return c.json(
        {
          chats: projectChats,
          chatsPageInfo: pageInfo
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/updateProjectVersionBlock',
    validator('json', (value) => {
      return value as {
        projectChatMessagePublicId: schema.ProjectChatMessagePublicId
        idemKey: schema.ProjectChatBlockIdempotencyKey
        versionBlock: ChatFileVersionBlockType
      }
    }),
    async (c) => {
      const {projectChatMessagePublicId, idemKey, versionBlock} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      if (!user) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      const projectChatMessage = await db.query.projectChatMessage.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectChatMessagePublicId)
      })

      if (projectChatMessage) {
        const currentVersionBlocks = projectChatMessage.blocks
        currentVersionBlocks[idemKey] = versionBlock

        try {
          await db
            .update(schema.projectChatMessage)
            .set({
              blocks: currentVersionBlocks
            })
            .where(sqlEq(schema.projectChatMessage.id, projectChatMessage.id))

          return c.json({message: 'success'}, HttpStatusCode.Ok)
        } catch (e) {
          log('error updating project version blocks', e)
          return c.json({message: 'Project Chat Message update failed'}, HttpStatusCode.BadRequest)
        }
      }

      return c.json({message: 'Project Chat Message not found'}, HttpStatusCode.NotFound)
    }
  )
  .post(
    '/fetchChatMessage',
    validator('json', (value) => {
      return value as {
        projectChatPublicId: schema.ProjectChatPublicId
        projectChatMessagePublicId: schema.ProjectChatMessagePublicId
      }
    }),
    async (c) => {
      const {projectChatPublicId, projectChatMessagePublicId} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      const projectChat = await db.query.projectChat.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectChatPublicId)
      })

      if (!projectChat) {
        return c.json({message: 'Project chat not found'}, HttpStatusCode.NotFound)
      }

      const projectId = projectChat.projectId

      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.id, projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      const projectChatMessage = await db.query.projectChatMessage.findFirst({
        where: (table, {eq: tableEq, and: tableAnd}) =>
          tableAnd(
            tableEq(table.projectChatId, projectChat.id),
            tableEq(table.publicId, projectChatMessagePublicId)
          )
      })

      if (projectChatMessage) {
        const {id: _, projectChatId: __, ...chatMessageDTO} = projectChatMessage
        const projectChatMessageDTO: schema.ProjectChatMessageDTOType = chatMessageDTO

        return c.json(
          {
            result: projectChatMessageDTO
          },
          HttpStatusCode.Ok
        )
      }
      return c.json({message: 'Project Chat Message not found'}, HttpStatusCode.NotFound)
    }
  )
  .post(
    '/reloadChats',
    validator('json', (value) => {
      return value as {
        projectPublicId: schema.ProjectPublicId
      }
    }),
    async (c) => {
      const {projectPublicId} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      const {id: _, projectId: __, ...projectChatCols} = getTableColumns(schema.projectChat)
      const chats = await db
        .select(projectChatCols)
        .from(schema.projectChat)
        .where(
          sqlAnd(
            sqlEq(schema.projectChat.projectId, project.id),
            sqlInArray(schema.projectChat.chatType, ['empty', 'chat'])
          )
        )
        .orderBy(sqlDesc(schema.projectChat.createdAt))
        .limit(DEFAULT_PAGE_SIZE + 1)

      const paginateProjectChats = createPaginationEntity<schema.ProjectChatCursor>()
      const {items: projectChats, pageInfo} = paginateProjectChats(chats, DEFAULT_PAGE_SIZE)

      return c.json(
        {
          chats: projectChats,
          chatsPageInfo: pageInfo
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/updateIdempotencyKey',
    validator('json', (value) => {
      return value as {
        projectChatMessageId: schema.ProjectChatMessagePublicId
        projectComponentIdempotencyKey: schema.ProjectChatBlockIdempotencyKey
      }
    }),
    async (c) => {
      const {projectChatMessageId, projectComponentIdempotencyKey} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      if (!user) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      const chatMessage = await db.query.projectChatMessage.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectChatMessageId)
      })

      if (!chatMessage) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      const currentKeys = chatMessage.idempotencyKeys ?? []
      if (!currentKeys.includes(projectComponentIdempotencyKey)) {
        currentKeys.push(projectComponentIdempotencyKey)

        await db
          .update(schema.projectChatMessage)
          .set({
            idempotencyKeys: currentKeys
          })
          .where(sqlEq(schema.projectChatMessage.publicId, projectChatMessageId))
      }

      return c.json(
        {
          success: true
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/loadNewChat',
    validator('json', (value) => {
      return value as {
        projectPublicId: schema.ProjectPublicId
      }
    }),
    async (c) => {
      const {projectPublicId} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'update', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      const existingEmptyChat = await db.query.projectChat.findFirst({
        where: (table, {eq: tableEq, and: tableAnd}) =>
          tableAnd(tableEq(table.projectId, project.id), tableEq(table.chatType, 'empty'))
      })
      if (existingEmptyChat) {
        const {id: _, projectId: __, ...existingChatDTO} = existingEmptyChat
        const projectChatDTO: schema.ProjectChatDTOType = existingChatDTO
        return c.json({chat: projectChatDTO}, HttpStatusCode.Ok)
      }

      const {id: _, projectId: __, ...projectChatCols} = getTableColumns(schema.projectChat)

      const [emptyChat] = await db
        .insert(schema.projectChat)
        .values({
          projectId: project.id,
          title: '',
          chatType: 'empty',
          titleStatus: 'initial'
        })
        .returning(projectChatCols)

      const projectChatDTO: schema.ProjectChatDTOType = emptyChat
      return c.json({chat: projectChatDTO}, HttpStatusCode.Ok)
    }
  )
  .post(
    '/loadChatTitle',
    validator('json', (value) => {
      return value as {
        projectChatPublicId: schema.ProjectChatPublicId
      }
    }),
    async (c) => {
      const {projectChatPublicId} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      const projectChat = await db.query.projectChat.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectChatPublicId)
      })

      if (!projectChat) {
        return c.json({message: 'Project chat not found'}, HttpStatusCode.NotFound)
      }

      const projectId = projectChat.projectId

      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.id, projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      const firstMessage = await db.query.projectChatMessage.findFirst({
        where: (table, {eq: tableEq}) => tableEq(schema.projectChatMessage.projectChatId, projectChat.id),
        orderBy: (table, {asc: tableAsc}) => [tableAsc(schema.projectChatMessage.publicId)]
      })

      // if (!firstMessage) {
      //   return c.json({message: 'Chat first message not found'}, HttpStatusCode.BadRequest)
      // }

      // const firstMessageContent = firstMessage.content
      // if (!firstMessageContent) {
      //   return c.json({message: 'Chat first message content not found'}, HttpStatusCode.BadRequest)
      // }

      // const content = userContentToSimpleString(firstMessageContent)

      // const groqProvider = createGroq({
      //   apiKey: PRIVATE_VARS.AI_GROQ_API_KEY
      // })

      // const model = groqProvider('llama-3.1-8b-instant')

      // const {text} = await generateText({
      //   model: model,
      //   messages: [
      //     {
      //       role: 'system',
      //       content:
      //         `You are a concise title-generator. ` +
      //         `Given a user's first chat message, output a 2-6 word title.`
      //     },
      //     {
      //       role: 'user',
      //       content: `First message: "${content}"`
      //     }
      //   ]
      // })

      // const formattedTitle = text
      //   .replace(/^['"`]+|['"`]+$/g, '')
      //   // collapse multiple internal whitespace to one space
      //   .replace(/\s+/g, ' ')
      //   .trim()

      const formattedTitle = 'This is a test title'

      const [updatedProjectChat] = await db
        .update(schema.projectChat)
        .set({
          title: formattedTitle,
          titleStatus: 'generated'
        })
        .where(sqlEq(schema.projectChat.id, projectChat.id))
        .returning()

      const {id: _, projectId: __, ...projectChatCols} = getTableColumns(schema.projectChat)
      const chats = await db
        .select(projectChatCols)
        .from(schema.projectChat)
        .where(
          sqlAnd(
            sqlEq(schema.projectChat.projectId, project.id),
            sqlInArray(schema.projectChat.chatType, ['empty', 'chat'])
          )
        )
        .orderBy(sqlDesc(schema.projectChat.createdAt))
        .limit(DEFAULT_PAGE_SIZE + 1)

      const paginateProjectChats = createPaginationEntity<schema.ProjectChatCursor>()
      const {items: projectChats, pageInfo} = paginateProjectChats(chats, DEFAULT_PAGE_SIZE)

      return c.json(
        {
          chats: projectChats,
          chatsPageInfo: pageInfo
        },
        HttpStatusCode.Ok
      )

      // const {id: _, projectId: __, ...restOfProjectChat} = updatedProjectChat
      // const projectChatDTO: schema.ProjectChatDTOType = restOfProjectChat

      // return c.json(
      //   {
      //     chat: projectChatDTO
      //   },
      //   HttpStatusCode.Ok
      // )
    }
  )
  .post(
    '/loadChatMessages',
    validator('json', (value) => {
      return value as {
        projectChatPublicId: schema.ProjectChatPublicId
      }
    }),
    async (c) => {
      const {projectChatPublicId} = c.req.valid('json')

      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      const projectChat = await db.query.projectChat.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectChatPublicId)
      })

      if (!projectChat) {
        return c.json({message: 'Project chat not found'}, HttpStatusCode.NotFound)
      }

      const projectId = projectChat.projectId

      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.id, projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      const {id: _, projectChatId: __, ...projectChatMessageCols} = getTableColumns(schema.projectChatMessage)

      const messages = await db
        .select(projectChatMessageCols)
        .from(schema.projectChatMessage)
        .where(sqlEq(schema.projectChatMessage.projectChatId, projectChat.id))
        .orderBy(sqlAsc(schema.projectChatMessage.publicId))
        .limit(100)

      const projectChatMessagesDTO: schema.ProjectChatMessageDTOType[] = messages

      return c.json(
        {
          messages: projectChatMessagesDTO
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/chat',
    validator('json', (value, c) => {
      const endpointSchema = z.object({
        projectChatPublicId: z.string(),
        projectCommitPublicId: z.string(),
        messages: z.array(z.custom<UIMessage>()),
        trigger: z.string()
      })
      const parsed = endpointSchema.safeParse(value)
      if (!parsed.success) {
        return c.text('Invalid', 401)
      }
      return parsed.data
    }),
    async (c) => {
      const {messages} = c.req.valid('json')
      // const {message, projectCommitPublicId, projectChatPublicId, openTabs} = c.req.valid('json')

      // log('calling messages', message, projectChatPublicId)

      // if (!projectChatPublicId) {
      //   return c.json({message: 'Project chat public id not found'}, HttpStatusCode.BadRequest)
      // }

      // if (!projectCommitPublicId) {
      //   return c.json({message: 'Project commit public id not found'}, HttpStatusCode.BadRequest)
      // }

      // const user = c.get('user')
      // const session = c.get('session')
      // const db = c.get('db')

      // const projectChat = await db.query.projectChat.findFirst({
      //   where: (table, {eq: tableEq}) =>
      //     tableEq(table.publicId, projectChatPublicId as schema.ProjectChatPublicId)
      // })

      // if (!projectChat) {
      //   return c.json({message: 'Project chat not found'}, HttpStatusCode.NotFound)
      // }

      // const projectId = projectChat.projectId

      // const project = await db.query.project.findFirst({
      //   where: (table, {eq: tableEq}) => tableEq(table.id, projectId)
      // })

      // if (!project) {
      //   return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      // }

      // if (await userCannotProjectAction(db, 'update', user, project.subjectPolicyId)) {
      //   return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      // }

      // if (projectChat.chatType === 'empty') {
      //   await db
      //     .update(schema.projectChat)
      //     .set({
      //       chatType: 'chat'
      //     })
      //     .where(eq(schema.projectChat.id, projectChat.id))

      //   const emptyChat = await db.query.projectChat.findFirst({
      //     where: (table, {eq: tableEq, and: tableAnd}) =>
      //       tableAnd(tableEq(table.projectId, project.id), tableEq(table.chatType, 'empty'))
      //   })
      //   if (!emptyChat) {
      //     await db.insert(schema.projectChat).values({
      //       projectId: project.id,
      //       title: '',
      //       chatType: 'empty',
      //       titleStatus: 'initial'
      //     })
      //   }
      // }

      // if (typeof message.content !== 'string') {
      //   return c.json({message: 'malformed input not string'}, HttpStatusCode.BadRequest)
      // }

      // const [{maxIdx}] = await db
      //   .select({maxIdx: max(schema.projectChatMessage.index)})
      //   .from(schema.projectChatMessage)
      //   .where(eq(schema.projectChatMessage.projectChatId, projectChat.id))
      // const userMessageIndex = (maxIdx ?? 0) + 1

      // await db.insert(schema.projectChatMessage).values({
      //   projectChatId: projectChat.id,
      //   role: message.role,
      //   index: userMessageIndex,
      //   content: {userContent: message.content},
      //   status: 'done'
      // })

      // const messages = await db
      //   .select()
      //   .from(schema.projectChatMessage)
      //   .where(eq(schema.projectChatMessage.projectChatId, projectChat.id))
      //   .orderBy(asc(schema.projectChatMessage.publicId))
      //   .limit(100)

      // const assistantMessageIndex = userMessageIndex + 1

      // const [assistantMessage] = await db
      //   .insert(schema.projectChatMessage)
      //   .values({
      //     projectChatId: projectChat.id,
      //     role: 'assistant',
      //     index: assistantMessageIndex,
      //     content: {},
      //     status: 'pending'
      //   })
      //   .returning()

      // type ChatMessageContent = (typeof schema.projectChatMessage.$inferSelect)['content']
      // const chunks: ChatMessageContent['assistantContent'] = []
      // const toolMap = new Map<string, ChatMessageContent['toolCalls']>()
      // const stepMeta: ChatMessageContent['steps'] = []

      const aggregateUsage = {promptTokens: 0, completionTokens: 0, totalTokens: 0}

      // const stopSignal = new AbortSignal()

      // const groqProvider = createGroq({
      //   apiKey: PRIVATE_VARS.AI_GROQ_API_KEY
      // })
      // const antrophicProvider = createAnthropic({
      //   apiKey: PRIVATE_VARS.AI_ANTHROPIC_API_KEY
      // })
      // const openaiProvider = createOpenAI({
      //   apiKey: PRIVATE_VARS.AI_OPENAI_API_KEY
      // })
      // let currentModel: LanguageModelV1 = antrophicProvider('claude-3-5-haiku-20241022')
      // let currentModel: LanguageModelV1 = groqProvider('qwen-qwq-32b')
      // let currentModel: LanguageModelV1 = openaiProvider('gpt-4o')
      // let currentModel = currentAIClient()

      // if (PRIVATE_VARS.MOCK_LLM_TEST === 'mock-prompt-generation') {
      const currentModel = mockPromptGenerationFn()
      // }

      /*
       * https://lodash.com/docs/4.17.15#template
       */
      // const systemPromptTemplate = template(SimpleSystemPrompt)

      // const compiledSystemPrompt = systemPromptTemplate({
      //   openTabs: openTabs ? openTabs.map((tab) => tab.fileName) : []
      // })

      const result = aiStreamText({
        model: currentModel,

        // tools: makeTools(db, project, projectCommitPublicId as schema.ProjectCommitPublicId),
        // maxSteps: 10,
        // abortSignal: stopSignal,
        // tools: {
        //   getFiles: tool({
        //     description: 'Get the current files',
        //     parameters: z.object({}),
        //     execute: async (params, options) => {
        //       log('ai requesting files')
        //     }
        //   })
        // },
        // tools: {
        //   listFiles: tool({
        //     description: '',
        //     parameters: z.object({}),
        //     execute: async (params, options) => {}
        //   })
        // },
        // your conversation so far
        messages: convertToModelMessages(messages)
        // messages: prepareMessages(compiledSystemPrompt, messages),
        /* ──────────────────────────────────────────
           Enable multi-step and tool-call streaming
           ────────────────────────────────────────── */
        // experimental_continueSteps: true,
        // toolCallStreaming: false,
        // experimental_toolCallStreaming: false,
        // experimental_generateMessageId: () => {
        //   return assistantMessage.publicId
        // },
        // maxSteps: 100,
        // toolChoice: 'auto',

        /* ──────────────────────────────────
           Telemetry (if your provider supports it)
           ────────────────────────────────── */
        // experimental_telemetry: {enabled: true},

        /* ────────────────────────────────
           Callbacks for debug logging
           ──────────────────────────────── */
        // onChunk: async ({chunk}) => {
        //   log('[streamText onChunk]', chunk)
        //   const chunkType = chunk.type
        //   switch (chunkType) {
        //     case 'tool-call': {
        //       type part = typeof chunk
        //       log('tool call chunk', chunk)

        //       break
        //     }
        //     case 'reasoning': {
        //       type part = typeof chunk
        //       // log('reasoning chunk', chunk)
        //       chunks.push({type: 'reasoning', text: chunk.textDelta})
        //       break
        //     }
        //     case 'source': {
        //       type part = typeof chunk
        //       log('source chunk', chunk)
        //       chunks.push({
        //         type: 'source',
        //         url: chunk.source.url,
        //         title: chunk.source.title,
        //         id: chunk.source.id,
        //         sourceType: chunk.source.sourceType,
        //         providerMetadata: chunk.source.providerMetadata
        //       })
        //       break
        //     }
        //     case 'text-delta': {
        //       type part = typeof chunk
        //       chunks.push({type: 'text', text: chunk.textDelta})
        //       break
        //     }
        //     case 'tool-call-delta': {
        //       type part = typeof chunk
        //       log('tool call delta chunk', chunk)
        //       break
        //     }
        //     case 'tool-call-streaming-start': {
        //       type part = typeof chunk
        //       log('tool call streaming start chunk', chunk)
        //       break
        //     }
        //     case 'tool-result': {
        //       type part = typeof chunk
        //       log('tool result chunk', chunk)
        //       chunks.push({
        //         type: 'tool-call',
        //         toolCallId: chunk.toolCallId,
        //         toolName: chunk.toolName,
        //         args: chunk.args,
        //         result: chunk.result ?? null
        //       })
        //       break
        //     }
        //     default: {
        //       const _exhaustive: never = chunkType
        //       throw new Error(`Unhandled chunk type type: ${JSON.stringify(_exhaustive)}`)
        //     }
        //   }
        //   // if (chunk.type === 'text-delta') {
        //   //   await db.insert(schema.projectChatStreamChunk).values({
        //   //     projectChatMessageId: assistantMessage.id,
        //   //     delta: chunk.textDelta
        //   //   })
        //   // }
        // },
        // onError: async (error) => {
        //   log('[streamText onError]', error)

        //   const collapsedContent = collapseAssistantChunks(chunks)

        //   await db
        //     .update(schema.projectChatMessage)
        //     .set({content: {assistantContent: collapsedContent}, status: 'error', usage: aggregateUsage})
        //     .where(eq(schema.projectChatMessage.id, assistantMessage.id))
        // },
        // onStepFinish: async (step) => {
        //   log('[streamText onStepFinish]', {
        //     finishReason: step.finishReason,
        //     usage: step.usage
        //   })
        //   log('[streamText onStepFinish Tools]', step.toolCalls, step.toolResults, step.text)
        //   // stepMeta.push({
        //   //   index:        step.index,
        //   //   finishReason: step.finishReason,
        //   //   usage:        step.usage,
        //   // })
        //   aggregateUsage.promptTokens += step.usage.promptTokens
        //   aggregateUsage.completionTokens += step.usage.completionTokens
        //   aggregateUsage.totalTokens += step.usage.totalTokens
        //   // aggregateUsage = {
        //   //   prompt_tokens:      aggregateUsage.prompt_tokens      + step.usage.prompt_tokens,
        //   //   completion_tokens:  aggregateUsage.completion_tokens  + step.usage.completion_tokens,
        //   //   total_tokens:       aggregateUsage.total_tokens       + step.usage.total_tokens,
        //   // }
        // },

        // onFinish: async (full) => {
        //   log('[streamText onFinish: full usage]', full)

        //   log('[stream onFinish]', full.response.messages)
        //   // const topLevelText = chunks
        //   //   .filter((p) => p.type === 'text')
        //   //   .map((p) => p.text)
        //   //   .join('')

        //   // const steps = full.steps

        //   // log('chunks', chunks)

        //   const collapsedContent = collapseAssistantChunks(chunks)

        //   await db
        //     .update(schema.projectChatMessage)
        //     .set({
        //       content: {assistantContent: collapsedContent},
        //       status: 'done',
        //       usage: aggregateUsage
        //     })
        //     .where(eq(schema.projectChatMessage.id, assistantMessage.id))
        // }

        /* ──────────────────────────
           Optional: transform raw deltas
           ────────────────────────── */
        // experimental_transform: (stream) =>
        //   stream.pipeThrough(
        //     new TransformStream({
        //       transform(chunk, controller) {
        //         console.debug('[raw delta]', new TextDecoder().decode(chunk))
        //         controller.enqueue(chunk)
        //       }
        //     })
        //   )
      })

      c.header('Content-Type', 'text/event-stream')
      c.header('Cache-Control', 'no-cache')
      c.header('Connection', 'keep-alive')

      try {
        const dataStream = result.toUIMessageStream({
          onError: (error) => {
            // Error messages are masked by default for security reasons.
            // If you want to expose the error message to the client, you can do so here:
            return error instanceof Error ? error.message : String(error)
          }
        })

        return streamSSE(c, (stream) =>
          stream.pipe(
            dataStream.pipeThrough(new JsonToSseTransformStream()).pipeThrough(new TextEncoderStream())
          )
        )
      } catch (e) {
        log('ai stream text threw error', e)
        return c.json({message: 'Some unknown streaming error'}, HttpStatusCode.BadRequest)
      }
    }
  )

export default app
export type AssistantType = typeof app
