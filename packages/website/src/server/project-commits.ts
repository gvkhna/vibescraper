import {Hono} from 'hono'
import {type HonoServer} from '.'
import * as schema from '@/db/schema'
import {asc} from 'drizzle-orm'
import {eq, getTableColumns} from 'drizzle-orm'
import {validator} from 'hono/validator'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {userCannotProjectAction} from '@/lib/permissions-helper'
import {alphanumericShortPublicId} from '@/lib/short-id'
import {ulid} from 'ulid'
import {asyncForEach} from '@/lib/async-utils'

const app = new Hono<HonoServer>()
  .post(
    '/projectCommitPublicId',
    validator('json', (value) => {
      return value as {
        projectCommitPublicId: schema.ProjectCommitPublicId
      }
    }),
    async (c) => {
      const {projectCommitPublicId} = c.req.valid('json')
      const user = c.get('user')
      const session = c.get('session')
      const db = c.get('db')

      // Fetch the project commit by its publicId
      const projectCommit = await db.query.projectCommit.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectCommitPublicId)
      })

      if (!projectCommit) {
        return c.json({message: 'Commit not found'}, HttpStatusCode.NotFound)
      }

      // Fetch the related project for permission check
      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.id, projectCommit.projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
      }

      // TODO: projectFile table doesn't exist yet - commented out for now
      // Fetch all files associated with the commit
      // const {
      //   id: _,
      //   textContent,
      //   jsonContent,
      //   projectCommitId,
      //   storageId,
      //   ...projectFileColumns
      // } = getTableColumns(schema.projectFile)
      // const files = await db
      //   .select(projectFileColumns)
      //   .from(schema.projectFile)
      //   .where(eq(schema.projectFile.projectCommitId, projectCommit.id))
      //   .orderBy(asc(schema.projectFile.createdAt))
      const files: any[] = [] // Temporary empty array

      const {id: __, userId: ___, projectId: ____, ...restOfProjectCommit} = projectCommit
      const projectCommitDTO: schema.ProjectCommitDTOType = restOfProjectCommit
      return c.json(
        {
          result: {
            commit: projectCommitDTO,
            files
          }
        },
        HttpStatusCode.Ok
      )
    }
  )

  .post(
    '/updateEditorUrl',
    validator('json', (value) => {
      return value as {
        projectCommitPublicId: schema.ProjectCommitPublicId
        currentEditorUrl: string
      }
    }),
    async (c) => {
      const {projectCommitPublicId, currentEditorUrl} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      // Find the project commit
      const projectCommit = await db.query.projectCommit.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectCommitPublicId)
      })

      if (!projectCommit) {
        return c.json({message: 'Project commit not found'}, HttpStatusCode.NotFound)
      }

      // Find the related project
      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.id, projectCommit.projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      // Check write permission
      if (await userCannotProjectAction(db, 'update', user, project.subjectPolicyId)) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
      }

      // Update the currentEditorUrl
      await db
        .update(schema.projectCommit)
        .set({
          currentEditorUrl: currentEditorUrl
        })
        .where(eq(schema.projectCommit.id, projectCommit.id))

      return c.json(
        {
          result: {
            success: true,
            currentEditorUrl: currentEditorUrl
          }
        },
        HttpStatusCode.Ok
      )
    }
  )

export default app
export type ProjectCommitsType = typeof app
