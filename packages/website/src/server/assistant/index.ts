import {Hono} from 'hono'
import type {HonoServer} from '..'
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
import debug from 'debug'
import {validator} from 'hono/validator'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {userCannotProjectAction} from '@/lib/permissions-helper'
import {createPaginationEntity, DEFAULT_PAGE_SIZE} from '@/store/pagination-entity-state'
import type {ChatFileVersionBlockType} from '@/partials/assistant-ui/chat-message-schema'
import extractor from './extractor'
import models from './models'

const log = debug('app:server:assistant')

const app = new Hono<HonoServer>()
  .route('/', extractor)
  .route('/', models)
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
        const {id: _, projectChatId: __, usage: ___, ...chatMessageDTO} = projectChatMessage
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

      const {
        id: _,
        projectChatId: __,
        usage: ___,
        ...projectChatMessageCols
      } = getTableColumns(schema.projectChatMessage)

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

export default app
export type AssistantType = typeof app
