import {Hono} from 'hono'
import {type HonoServer} from '.'
import * as schema from '@/db/schema'
import {count, inArray} from 'drizzle-orm'
import {z} from 'zod'
import {eq, desc, and, getTableColumns, sql} from 'drizzle-orm'
import debug from 'debug'
import {validator} from 'hono/validator'

import {subject} from '@casl/ability'
import {produceWithPatches} from 'immer'
import {
  createDefaultPolicy,
  projectSubjectPolicy,
  updatePolicy,
  userActor,
  userCannotProjectAction
} from '@/lib/permissions-helper'
import {abilityForActor} from '@/lib/permission-policy-schema'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {asyncForEach} from '@/lib/async-utils'
import {createPaginationEntity, DEFAULT_PAGE_SIZE} from '@/store/pagination-entity-state'
import {generateText} from 'ai'
import {getModelBySize} from '@/assistant-ai'
import {extractUrlFromPrompt} from '@/lib/url-utils'

const log = debug('app:server:projects')

const app = new Hono<HonoServer>()
  .get('/userProjects', async (c) => {
    const user = c.get('user')
    const db = c.get('db')

    if (!user) {
      return c.json({message: 'Invalid auth'}, HttpStatusCode.Forbidden)
    }

    const {id, ...projectColumns} = getTableColumns(schema.project)
    const allProjects = await db
      .select({...projectColumns})
      .from(schema.project)
      .orderBy(desc(schema.project.updatedAt))
      .where(eq(schema.project.userId, user.id))

    return c.json(
      {
        projects: allProjects
      },
      HttpStatusCode.Ok
    )
  })
  .get('/userRecentProjects', async (c) => {
    const user = c.get('user')
    const session = c.get('session')
    const db = c.get('db')

    if (!user) {
      return c.json({message: 'Invalid auth'}, HttpStatusCode.Forbidden)
    }

    const {id, ...projectColumns} = getTableColumns(schema.project)
    const recentProjects = await db
      .select({...projectColumns})
      .from(schema.project)
      .orderBy(desc(schema.project.updatedAt))
      .limit(5)
      .where(eq(schema.project.userId, user.id))
    return c.json(
      {
        projects: recentProjects
      },
      HttpStatusCode.Ok
    )
  })
  .get('/newDefaultProjectName', async (c) => {
    const user = c.get('user')
    const db = c.get('db')

    if (!user) {
      return c.json({message: 'Invalid auth'}, HttpStatusCode.Forbidden)
    }

    const [projectCount] = await db
      .select({count: count()})
      .from(schema.project)
      .where(eq(schema.project.userId, user.id))
    const name = `Project #${projectCount.count + 1}`
    return c.json(
      {
        name
      },
      HttpStatusCode.Ok
    )
  })
  .post(
    '/setPrivate',
    validator('json', async (value) => {
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

      const actor = await userActor(db, user)
      const subjectPolicy = await projectSubjectPolicy(db, project.subjectPolicyId)
      const abilities = abilityForActor(actor)

      if (abilities.can('setPermissions', subject('Policy', subjectPolicy.policy))) {
        const [policy, patches, inversePatches] = produceWithPatches(subjectPolicy.policy, (draft) => {
          draft.visibility = 'private'
          if (draft.publicPermissions) {
            draft.publicPermissions = draft.publicPermissions.filter((perm) => perm !== 'read')
          }
        })

        const newSubjectPolicy = await updatePolicy({
          db,
          policy,
          patches,
          inversePatches,
          subjectPolicyId: subjectPolicy.id,
          actor: actor,
          actionType: 'setPermissions'
        })

        await db
          .update(schema.project)
          .set({
            updatedAt: sql`now()`
          })
          .where(eq(schema.project.id, project.id))

        const {id: _, ...restOfSubjectPolicy} = newSubjectPolicy
        const subjectPolicyDTO: schema.SubjectPolicyDTOType = restOfSubjectPolicy

        return c.json(
          {
            result: {
              subjectPolicy: subjectPolicyDTO
            }
          },
          HttpStatusCode.Ok
        )
      }

      return c.json({message: 'Failed to update project permissions'}, HttpStatusCode.BadRequest)
    }
  )
  .post(
    '/setPublic',
    validator('json', async (value) => {
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

      const actor = await userActor(db, user)
      const subjectPolicy = await projectSubjectPolicy(db, project.subjectPolicyId)
      const abilities = abilityForActor(actor)

      if (abilities.can('setPermissions', subject('Policy', subjectPolicy.policy))) {
        const [policy, patches, inversePatches] = produceWithPatches(subjectPolicy.policy, (draft) => {
          draft.visibility = 'public'
          draft.publicPermissions = ['read']
        })

        const newSubjectPolicy = await updatePolicy({
          db,
          policy,
          patches,
          inversePatches,
          subjectPolicyId: subjectPolicy.id,
          actor: actor,
          actionType: 'setPermissions'
        })

        await db
          .update(schema.project)
          .set({
            updatedAt: sql`now()`
          })
          .where(eq(schema.project.id, project.id))

        const {id: _, ...restOfSubjectPolicy} = newSubjectPolicy
        const subjectPolicyDTO: schema.SubjectPolicyDTOType = restOfSubjectPolicy
        return c.json(
          {
            result: {
              subjectPolicy: subjectPolicyDTO
            }
          },
          HttpStatusCode.Ok
        )
      }

      return c.json({message: 'Failed to update project permissions'}, HttpStatusCode.BadRequest)
    }
  )
  .post(
    '/projectOwner',
    validator('json', async (value) => {
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

      const [userData] = await db.select().from(schema.user).where(eq(schema.user.id, project.userId))

      return c.json(
        {
          owner: {
            name: userData.name,
            image: userData.image
          }
        },
        HttpStatusCode.Ok
      )
    }
  )
  // .post(
  //   '/duplicate',
  //   validator('json', async (value) => {
  //     return value as {
  //       projectPublicId: schema.ProjectPublicId
  //     }
  //   }),
  //   async (c) => {
  //     const {projectPublicId} = c.req.valid('json')
  //     const user = c.get('user')
  //     const session = c.get('session')
  //     const db = c.get('db')

  //     const existingProject = await db.query.project.findFirst({
  //       where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
  //     })

  //     if (!existingProject) {
  //       return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
  //     }

  //     const actor = await userActor(db, user)
  //     const existingSubjectPolicy = await projectSubjectPolicy(db, existingProject.subjectPolicyId)
  //     const abilities = abilityForActor(actor)

  //     if (abilities.cannot('read', subject('Policy', existingSubjectPolicy.policy))) {
  //       return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
  //     }

  //     if (!user) {
  //       return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
  //     }

  //     const existingStagedCommit = await db.query.projectCommit.findFirst({
  //       where: (table, {eq: tableEq, and: tableAnd}) =>
  //         tableAnd(tableEq(table.projectId, existingProject.id), tableEq(table.type, 'staged'))
  //     })

  //     if (!existingStagedCommit) {
  //       return c.json({message: 'Failed to duplicate project'}, HttpStatusCode.BadRequest)
  //     }

  //     if (!actor.actorId) {
  //       return c.json({message: 'Failed to duplicate project'}, HttpStatusCode.BadRequest)
  //     }

  //     // const result = await db.transaction(async (tx) => {
  //     const [newSubjectPolicy] = await db
  //       .insert(schema.subjectPolicy)
  //       .values({
  //         policy: createDefaultPolicy(actor.actorId)
  //       })
  //       .returning()

  //     // Insert the project
  //     const [project] = await db
  //       .insert(schema.project)
  //       .values({
  //         name: `Copy of ${existingProject.name}`,
  //         subjectPolicyId: newSubjectPolicy.id,
  //         userId: user.id
  //       })
  //       .returning()

  //     // const [projectEnvironment] = await tx
  //     //   .insert(schema.projectEnvironment)
  //     //   .values({
  //     //     name: 'Development',
  //     //     projectId: project.id
  //     //   })
  //     //   .returning()

  //     // const [projectTarget] = await tx
  //     //   .insert(schema.projectTrigger)
  //     //   .values({
  //     //     name: 'Manual Run',
  //     //     projectId: project.id,
  //     //     details: {
  //     //       type: 'default'
  //     //     }
  //     //   })
  //     //   .returning()

  //     // const [projectScheme] = await tx
  //     //   .insert(schema.projectScheme)
  //     //   .values({
  //     //     name: 'Default',
  //     //     type: 'default',
  //     //     projectId: project.id,
  //     //     projectEnvironmentId: projectEnvironment.id
  //     //   })
  //     //   .returning()

  //     // Insert the staged project commit
  //     const [projectCommit] = await db
  //       .insert(schema.projectCommit)
  //       .values({
  //         projectId: project.id,
  //         userId: user.id,
  //         type: 'staged'
  //       })
  //       .returning()

  //     return c.json({success: true, newProjectPublicId: project.publicId}, HttpStatusCode.Ok)
  //   }
  // )
  .post(
    '/rename',
    validator('json', async (value) => {
      return value as {
        projectName: string
        projectPublicId: schema.ProjectPublicId
      }
    }),
    async (c) => {
      const {projectPublicId, projectName} = c.req.valid('json')
      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      if (!projectName) {
        return c.json({message: 'Project name must be valid'}, HttpStatusCode.BadRequest)
      }

      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'update', user, project.subjectPolicyId)) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
      }

      await db
        .update(schema.project)
        .set({
          name: projectName
        })
        .where(eq(schema.project.id, project.id))

      return c.json(
        {
          result: {
            success: true,
            newProjectName: projectName
          }
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/delete',
    validator('json', async (value) => {
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

      if (await userCannotProjectAction(db, 'delete', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      try {
        // Start a transaction
        const result = await db.transaction(async (tx) => {
          // Perform the delete operation within the transaction
          const deleteResult = await tx
            .delete(schema.project)
            .where(eq(schema.project.publicId, projectPublicId))
            .returning({deletedId: schema.project.id})

          // If no rows were affected, the project wasn't found
          if (!deleteResult.length) {
            throw new Error(`Project with public ID ${projectPublicId} not found`)
          }

          // Return the deleted project ID for confirmation
          return {
            success: true,
            deletedId: deleteResult[0].deletedId
          }
        })

        return c.json(
          {
            result: {
              data: result,
              success: result.success,
              message: `Project ${projectPublicId} successfully deleted`
            }
          },
          HttpStatusCode.Ok
        )
      } catch (error) {
        // The transaction automatically rolled back on error
        log('Error deleting project:', error)

        return c.json(
          {message: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`},
          HttpStatusCode.BadRequest
        )
      }
    }
  )
  .post(
    '/projectPublicId',
    validator('json', async (value) => {
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

      const actor = await userActor(db, user)
      const subjectPolicy = await projectSubjectPolicy(db, project.subjectPolicyId)
      const abilities = abilityForActor(actor)

      if (abilities.cannot('read', subject('Policy', subjectPolicy.policy))) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
      }

      const {id: _, userId: _9, projectId: _10, ...stagedCommitCols} = getTableColumns(schema.projectCommit)
      const [stagedCommit] = await db
        .select(stagedCommitCols)
        .from(schema.projectCommit)
        .where(and(eq(schema.projectCommit.projectId, project.id), eq(schema.projectCommit.type, 'staged')))
        .limit(1)

      // const emptyChat = await db.query.projectChat.findFirst({
      //   where: (table, {eq: tableEq, and: tableAnd}) =>
      //     tableAnd(tableEq(table.projectId, project.id), tableEq(table.chatType, 'empty'))
      // })
      // if (!emptyChat) {
      //   await db.insert(schema.projectChat).values({
      //     projectId: project.id,
      //     title: '',
      //     chatType: 'empty',
      //     titleStatus: 'initial'
      //   })
      // }

      const {id: _15, projectId: _16, ...projectChatCols} = getTableColumns(schema.projectChat)
      const chats = await db
        .select(projectChatCols)
        .from(schema.projectChat)
        .where(
          and(
            eq(schema.projectChat.projectId, project.id),
            inArray(schema.projectChat.chatType, ['empty', 'chat'])
          )
        )
        .orderBy(desc(schema.projectChat.createdAt))
        .limit(DEFAULT_PAGE_SIZE + 1)

      const paginateProjectChats = createPaginationEntity<schema.ProjectChatCursor>()
      const {items: projectChats, pageInfo} = paginateProjectChats(chats, DEFAULT_PAGE_SIZE)

      // Get all schemas for this project
      const schemas = await db.query.projectSchema.findMany({
        where: (table, {eq: tableEq}) => tableEq(table.projectId, project.id),
        orderBy: (table, {desc: tableDesc}) => [tableDesc(table.version)]
      })

      // Convert to DTOs (remove id and projectId)
      const schemaDTOs: schema.ProjectSchemaDTOType[] = schemas.map((s) => {
        const {id: _schemaId, projectId: _schemaProjectId, ...dto} = s
        return dto
      })

      const {id: _11, userId: _12, subjectPolicyId: _13, ...restOfProject} = project
      const projectDTO: schema.ProjectDTOType['project'] = restOfProject
      const {id: _14, ...restOfSubjectPolicy} = subjectPolicy
      const subjectPolicyDTO: schema.SubjectPolicyDTOType = restOfSubjectPolicy

      const result: {project: schema.ProjectDTOType; stagedCommit: schema.ProjectCommitDTOType} = {
        project: {
          project: {
            ...projectDTO
          },
          chats: projectChats,
          chatsPageInfo: pageInfo,
          subjectPolicy: {
            ...subjectPolicyDTO
          },
          schemas: schemaDTOs
        },
        stagedCommit
      }
      return c.json(
        {
          result: result
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/newPrompt',
    validator('json', async (value) => {
      return value as {
        prompt: string
      }
    }),
    async (c) => {
      const {prompt} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      if (!user) {
        return c.json({message: 'Invalid auth'}, HttpStatusCode.Forbidden)
      }

      if (!prompt) {
        return c.json({message: 'Prompt cannot be blank'}, HttpStatusCode.UnprocessableEntity)
      }

      const actor = await db.query.actor.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.userId, user.id)
      })

      if (!actor) {
        return c.json({message: 'Permissions invalid'}, HttpStatusCode.Forbidden)
      }

      // Extract URL from prompt
      const urlInfo = extractUrlFromPrompt(prompt)
      log('Extracted URL info:', urlInfo)

      // Determine project name
      let projectName: string
      let extractedUrl: string | null = urlInfo.url

      // Check if prompt is short enough to use as project name
      const isShortPrompt = prompt.trim().length <= 100

      // Format prompt as name - remove quotes, collapse whitespace, trim
      const formatPromptAsName = (text: string) =>
        text
          .replace(/^['"`]+|['"`]+$/g, '')
          .replace(/\s+/g, ' ')
          .trim()

      // If prompt is short enough, use it as the name
      if (isShortPrompt) {
        projectName = formatPromptAsName(prompt)
      } else {
        // For longer prompts, try to generate a title with AI
        const model = getModelBySize('small')

        if (model) {
          try {
            const result = await generateText({
              model: model,
              messages: [
                {
                  role: 'system',
                  content:
                    `You are a concise title-generator. ` +
                    `Given a user's first chat message, output a 2-6 word title.`
                },
                {
                  role: 'user',
                  content: `First message: "${prompt}"`
                }
              ]
            })
            projectName = formatPromptAsName(result.text)
          } catch (error) {
            log('AI generation error:', error)
            // Fallback to truncated prompt
            projectName = formatPromptAsName(prompt.substring(0, 50) + '...')
          }
        } else {
          // No AI available, use truncated prompt
          projectName = formatPromptAsName(prompt.substring(0, 50) + '...')
        }
      }

      // If we didn't find a URL and AI is available, try to extract one with AI
      if (!extractedUrl) {
        const model = getModelBySize('small')

        if (model) {
          try {
            const result = await generateText({
              model: model,
              messages: [
                {
                  role: 'system',
                  content:
                    `Extract a URL from the user's message if they mention a website or domain. ` +
                    `Only output a valid URL starting with http:// or https://. ` +
                    `If no website is mentioned, output "none".`
                },
                {
                  role: 'user',
                  content: prompt
                }
              ]
            })

            const aiResponse = result.text.trim().toLowerCase()
            if (aiResponse !== 'none' && aiResponse.startsWith('http')) {
              try {
                const url = new URL(aiResponse)
                extractedUrl = url.href
                log('AI extracted URL:', extractedUrl)
              } catch (e) {
                log('AI returned invalid URL:', aiResponse)
              }
            }
          } catch (error) {
            log('AI URL extraction error:', error)
          }
        }
      }

      // Create project and initial chat
      const result = await db.transaction(async (tx) => {
        const [subjectPolicy] = await tx
          .insert(schema.subjectPolicy)
          .values({
            policy: createDefaultPolicy(actor.publicId)
          })
          .returning()

        // Insert the project
        const [project] = await tx
          .insert(schema.project)
          .values({
            name: projectName,
            subjectPolicyId: subjectPolicy.id,
            userId: user.id
          })
          .returning()

        // Insert the staged project commit
        await tx.insert(schema.projectCommit).values({
          projectId: project.id,
          userId: user.id,
          type: 'staged',
          currentEditorUrl: extractedUrl
        })

        // Create initial chat
        const [projectChat] = await tx
          .insert(schema.projectChat)
          .values({
            projectId: project.id,
            title: projectName,
            chatType: 'chat',
            titleStatus: 'generated'
          })
          .returning()

        // insert the one "empty" chat
        await tx.insert(schema.projectChat).values({
          projectId: project.id,
          title: '',
          chatType: 'empty',
          titleStatus: 'initial'
        })

        // Create initial user message
        const [chatMessage] = await tx
          .insert(schema.projectChatMessage)
          .values({
            projectChatId: projectChat.id,
            role: 'user',
            index: 0,
            content: {
              parts: [{type: 'text', state: 'done', text: prompt}]
            },
            status: 'done'
          })
          .returning()

        return {
          project,
          projectChat,
          chatMessage
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!result) {
        return c.json({message: 'Failed to create project'}, HttpStatusCode.BadRequest)
      }

      const {id: _, ...restOfProject} = result.project
      return c.json(
        {
          project: {
            ...restOfProject
          },
          chatPublicId: result.projectChat.publicId
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/new',
    validator('json', async (value) => {
      return value as {
        projectName: string
      }
    }),
    async (c) => {
      const {projectName} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      if (!user) {
        return c.json({message: 'Invalid auth'}, HttpStatusCode.Forbidden)
      }

      if (!projectName) {
        return c.json({message: 'Name cannot be blank'}, HttpStatusCode.UnprocessableEntity)
      }

      const actor = await db.query.actor.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.userId, user.id)
      })

      if (!actor) {
        return c.json({message: 'Permissions invalid'}, HttpStatusCode.Forbidden)
      }

      const result = await db.transaction(async (tx) => {
        const [subjectPolicy] = await tx
          .insert(schema.subjectPolicy)
          .values({
            policy: createDefaultPolicy(actor.publicId)
          })
          .returning()

        // Insert the project
        const [project] = await tx
          .insert(schema.project)
          .values({
            name: projectName,
            subjectPolicyId: subjectPolicy.id,
            userId: user.id
          })
          .returning()

        // Insert the staged project commit
        await tx.insert(schema.projectCommit).values({
          projectId: project.id,
          userId: user.id,
          type: 'staged'
        })

        return project
      })

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!result) {
        return c.json({message: 'Failed to create project'}, HttpStatusCode.BadRequest)
      }

      const {id: _, ...restOfResult} = result
      return c.json(
        {
          project: {
            ...restOfResult
          }
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/schemas',
    validator('json', (value) => {
      return value as {
        projectPublicId: schema.ProjectPublicId
      }
    }),
    async (c) => {
      const {projectPublicId} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      // Get project to verify access
      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      // Get all schemas for this project
      const schemas = await db.query.projectSchema.findMany({
        where: (table, {eq: tableEq}) => tableEq(table.projectId, project.id),
        orderBy: (table, {desc: tableDesc}) => [tableDesc(table.version)]
      })

      // Convert to DTOs
      const schemaDTOs: schema.ProjectSchemaDTOType[] = schemas.map((s) => {
        const {id: _schemaId, projectId: _schemaProjectId, ...dto} = s
        return dto
      })

      return c.json(
        {
          schemas: schemaDTOs
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/schema',
    validator('json', (value) => {
      return value as {
        projectPublicId: schema.ProjectPublicId
        schemaPublicId: schema.ProjectSchemaPublicId
      }
    }),
    async (c) => {
      const {projectPublicId, schemaPublicId} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      // Get project to verify access
      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      // Get the specific schema version
      const schemaData = await db.query.projectSchema.findFirst({
        where: (table, {eq: tableEq, and: tableAnd}) =>
          tableAnd(tableEq(table.projectId, project.id), tableEq(table.publicId, schemaPublicId))
      })

      if (!schemaData) {
        return c.json({message: 'Schema not found'}, HttpStatusCode.NotFound)
      }

      // Return the DTO (omitting id and projectId)
      const {id: _, projectId: _p, ...schemaDTO} = schemaData

      return c.json(
        {
          schema: schemaDTO as schema.ProjectSchemaDTOType
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/schemaByVersion',
    validator('json', (value) => {
      return value as {
        projectPublicId: schema.ProjectPublicId
        version: number
      }
    }),
    async (c) => {
      const {projectPublicId, version} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      // Get project to verify access
      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      // Get the specific schema version
      const schemaData = await db.query.projectSchema.findFirst({
        where: (table, {eq: tableEq, and: tableAnd}) =>
          tableAnd(tableEq(table.projectId, project.id), tableEq(table.version, version))
      })

      if (!schemaData) {
        return c.json({message: 'Schema not found'}, HttpStatusCode.NotFound)
      }

      // Return the DTO (omitting id and projectId)
      const {id: _, projectId: _p, ...schemaDTO} = schemaData

      return c.json(
        {
          schema: schemaDTO as schema.ProjectSchemaDTOType
        },
        HttpStatusCode.Ok
      )
    }
  )
  .post(
    '/extractors',
    validator('json', (value) => {
      return value as {
        projectPublicId: schema.ProjectPublicId
      }
    }),
    async (c) => {
      const {projectPublicId} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      // Get project to verify access
      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectPublicId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Unauthorized'}, HttpStatusCode.Forbidden)
      }

      // Get all extractors for this project
      const extractors = await db.query.extractor.findMany({
        where: (table, {eq: tableEq}) => tableEq(table.projectId, project.id),
        orderBy: (table, {desc: tableDesc}) => [tableDesc(table.version)]
      })

      // Convert to DTOs
      const extractorDTOs: schema.ExtractorDTOType[] = extractors.map((e) => {
        const {id: _extractorId, projectId: _extractorProjectId, ...dto} = e
        return dto
      })

      return c.json(
        {
          extractors: extractorDTOs
        },
        HttpStatusCode.Ok
      )
    }
  )

export default app
export type ProjectsType = typeof app
