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

      const actor = await userActor(db, user)
      const subjectPolicy = await projectSubjectPolicy(db, project.subjectPolicyId)
      const abilities = abilityForActor(actor)

      if (abilities.cannot('delete', subject('Policy', subjectPolicy.policy))) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
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
          }
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
    '/new',
    validator('json', async (value) => {
      return value as {
        projectName: string
      }
    }),
    async (c) => {
      const {projectName} = c.req.valid('json')
      const user = c.get('user')
      const session = c.get('session')
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
        const [projectCommit] = await tx
          .insert(schema.projectCommit)
          .values({
            projectId: project.id,
            userId: user.id,
            type: 'staged'
          })
          .returning()

        return project
      })

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

export default app
export type ProjectsType = typeof app
