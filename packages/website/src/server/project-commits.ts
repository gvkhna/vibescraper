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

const app = new Hono<HonoServer>().post(
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

    // check permission policy
    const [projectResult] = await db
      .select({
        project: schema.project
      })
      .from(schema.projectCommit)
      .innerJoin(schema.project, eq(schema.projectCommit.projectId, schema.project.id))
      .where(eq(schema.projectCommit.publicId, projectCommitPublicId))
      .limit(1)

    const project = projectResult.project as undefined | typeof projectResult.project

    if (!project) {
      return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
    }

    if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
      return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
    }

    // Fetch the project commit by its publicId
    const projectCommit = await db.query.projectCommit.findFirst({
      where: (table, {eq: tableEq}) => tableEq(table.publicId, projectCommitPublicId)
    })

    if (!projectCommit) {
      return c.json({message: 'Commit not found or unauthorized'}, HttpStatusCode.BadRequest)
    }

    // Fetch all files associated with the commit
    const {
      id: _,
      textContent,
      jsonContent,
      projectCommitId,
      storageId,
      ...projectFileColumns
    } = getTableColumns(schema.projectFile)
    const files = await db
      .select(projectFileColumns)
      .from(schema.projectFile)
      .where(eq(schema.projectFile.projectCommitId, projectCommit.id))
      .orderBy(asc(schema.projectFile.createdAt))

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

export default app
export type ProjectCommitsType = typeof app
