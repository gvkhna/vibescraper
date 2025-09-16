import {Hono} from 'hono'
import type {HonoServer} from '..'
import * as schema from '@/db/schema'
import {asc as sqlAsc, max as sqlMax, eq as sqlEq} from 'drizzle-orm'
import {z} from 'zod'
import debug from 'debug'
import {validator} from 'hono/validator'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {userCannotProjectAction} from '@/lib/permissions-helper'
import {
  convertUIMessageToChatMessage,
  type VSUIMessage,
  type ChatMessagePersistanceType
} from '@/partials/assistant-ui/chat-message-schema'
import {getModelBySize, type ModelSize} from '@/assistant-ai'
import {SchemaToolsPrompt, TestPingPrompt, TestPrompt} from '@/assistant-ai/prompts'
import {aiStreamResponse} from './ai-stream-response'
import {makeTestTools} from '@/assistant-ai/tools/test-tools'
import {makeExtractionTools} from '@/assistant-ai/tools/assistant-extraction-tools'
// import type {ProjectVersionBlockType} from '@partials/assistant-ui/project-version-block'
// import {makeTools} from '@/private-llm/assistant-tools'

const log = debug('app:server:assistant')

const app = new Hono<HonoServer>().post(
  '/extractorChat',
  validator('json', (value, c) => {
    const endpointSchema = z.object({
      editorSliceActiveTab: z.string().optional(),
      messages: z.array(z.custom<VSUIMessage>()),
      model: z.string().optional(),
      projectChatPublicId: z.custom<schema.ProjectChatPublicId>((val) => {
        return typeof val === 'string'
      }),
      projectCommitPublicId: z.custom<schema.ProjectCommitPublicId>((val) => {
        return typeof val === 'string'
      }),
      projectPublicId: z.custom<schema.ProjectPublicId>((val) => {
        return typeof val === 'string'
      }),
      trigger: z.string()
    })
    const parsed = endpointSchema.safeParse(value)
    if (!parsed.success) {
      return c.text('Invalid', 401)
    }

    return parsed.data
  }),
  async (c) => {
    const {messages, projectChatPublicId, projectCommitPublicId, model, trigger, editorSliceActiveTab} =
      c.req.valid('json')
    const user = c.get('user')
    const db = c.get('db')

    log('calling messages', messages, projectChatPublicId)

    if (!projectChatPublicId) {
      return c.json({message: 'Project chat public id not found'}, HttpStatusCode.BadRequest)
    }

    if (!projectCommitPublicId) {
      return c.json({message: 'Project commit public id not found'}, HttpStatusCode.BadRequest)
    }

    const projectChat = await db.query.projectChat.findFirst({
      where: (table, {eq}) => eq(table.publicId, projectChatPublicId)
    })

    if (!projectChat) {
      return c.json({message: 'Project chat not found'}, HttpStatusCode.NotFound)
    }

    const projectId = projectChat.projectId

    const project = await db.query.project.findFirst({
      where: (table, {eq}) => eq(table.id, projectId)
    })

    if (!project) {
      return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
    }

    if (await userCannotProjectAction(db, 'update', user, project.subjectPolicyId)) {
      return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
    }

    let message: VSUIMessage | null = null
    if (messages.length === 1) {
      message = messages[0]
    } else {
      return c.json({message: 'Incorrect number of messages sent'}, HttpStatusCode.BadRequest)
    }

    if (projectChat.chatType === 'empty') {
      await db
        .update(schema.projectChat)
        .set({
          chatType: 'chat'
        })
        .where(sqlEq(schema.projectChat.id, projectChat.id))

      const emptyChat = await db.query.projectChat.findFirst({
        where: (table, {eq, and}) => and(eq(table.projectId, project.id), eq(table.chatType, 'empty'))
      })
      if (!emptyChat) {
        await db.insert(schema.projectChat).values({
          projectId: project.id,
          title: '',
          chatType: 'empty',
          titleStatus: 'initial'
        })
      }
    }

    // Check if we received a pending chat message from the create project
    let pendingChatMessage: typeof schema.projectChatMessage.$inferSelect | null | undefined = null

    log('message', message)
    if (message.id && message.role === 'user' && message.parts.length === 0) {
      // We need to look up this message from the database
      pendingChatMessage = await db.query.projectChatMessage.findFirst({
        where: (table, {eq: tableEq}) =>
          tableEq(table.publicId, message.id as schema.ProjectChatMessagePublicId)
      })
    }

    // Variables for message handling
    let userMessageIndex: number
    let userMessagePublicId: schema.ProjectChatMessagePublicId | null = null
    let llmConversationMessages: ChatMessagePersistanceType[] = []

    if (pendingChatMessage) {
      // This is the initial message from project creation
      userMessageIndex = 0 // First message in the chat

      userMessagePublicId = pendingChatMessage.publicId

      // Create the conversation for LLM with just this single message
      llmConversationMessages = [pendingChatMessage]
    } else {
      // Regular message flow - get index and save the new user message
      const [{maxIdx}] = await db
        .select({maxIdx: sqlMax(schema.projectChatMessage.index)})
        .from(schema.projectChatMessage)
        .where(sqlEq(schema.projectChatMessage.projectChatId, projectChat.id))
      userMessageIndex = typeof maxIdx === 'number' ? maxIdx + 1 : 0

      const [userMessage] = await db
        .insert(schema.projectChatMessage)
        .values({
          projectChatId: projectChat.id,
          role: 'user',
          index: userMessageIndex,
          content: convertUIMessageToChatMessage(message),
          status: 'done'
        })
        .returning()

      userMessagePublicId = userMessage.publicId

      // Get previous messages for context
      const previousMessages = await db
        .select()
        .from(schema.projectChatMessage)
        .where(sqlEq(schema.projectChatMessage.projectChatId, projectChat.id))
        .orderBy(sqlAsc(schema.projectChatMessage.index))
        .limit(100)

      // Convert previous messages to UIMessage format for LLM
      llmConversationMessages = previousMessages.map((msg) => msg)
    }

    const assistantMessageIndex = userMessageIndex + 1

    const [assistantMessage] = await db
      .insert(schema.projectChatMessage)
      .values({
        projectChatId: projectChat.id,
        role: 'assistant',
        index: assistantMessageIndex,
        content: {
          parts: []
        },
        status: 'pending'
      })
      .returning()

    const modelSize: ModelSize = model === 'small' ? 'small' : model === 'medium' ? 'medium' : 'large'
    const currentModel = getModelBySize(modelSize)
    if (!currentModel) {
      return c.json({error: 'Model not configured'}, 500)
    }

    // const systemPrompt = ExtractorPrompt({})

    const systemPrompt = SchemaToolsPrompt({})

    // const systemPrompt = TestPrompt({
    //   activeTab: editorSliceActiveTab
    // })
    // const systemPrompt = TestPingPrompt({})

    const sandbox = c.get('sandbox')
    if (!sandbox) {
      return c.json({error: 'Sandbox not available'}, HttpStatusCode.BadGateway)
    }

    const tools = makeExtractionTools(db, project, projectCommitPublicId, sandbox)
    // const tools = makeTestTools()

    return aiStreamResponse({
      requestContext: c,
      systemPrompt: systemPrompt,
      model: currentModel,
      conversationHistory: llmConversationMessages,
      assistantMessage,
      tools: tools,
      userMessagePublicId
    })
  }
)

export default app
export type AssistantChatType = typeof app
