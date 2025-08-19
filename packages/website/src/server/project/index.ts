import {Hono} from 'hono'
import {type HonoServer} from '..'
import * as schema from '@/db/schema'
import {eq as sqlEq} from 'drizzle-orm'
import {validator} from 'hono/validator'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {userCannotProjectAction} from '@/lib/permissions-helper'
import debug from 'debug'
import {scrapeProcess} from './scrape-process'

const log = debug('app:project')

const app = new Hono<HonoServer>()
  .post(
    '/scrape',
    validator('json', (value) => {
      return value as {
        projectCommitPublicId: schema.ProjectCommitPublicId
        forceRefresh?: boolean
      }
    }),
    async (c) => {
      const {projectCommitPublicId, forceRefresh = false} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')
      const sandbox = c.get('sandbox')

      // Find the project commit to check permissions
      const projectCommit = await db.query.projectCommit.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.publicId, projectCommitPublicId)
      })

      if (!projectCommit) {
        return c.json({message: 'Project commit not found'}, HttpStatusCode.NotFound)
      }

      // Find the related project for permission checking
      const project = await db.query.project.findFirst({
        where: (table, {eq: tableEq}) => tableEq(table.id, projectCommit.projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      // Check read permission
      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
      }

      if (!sandbox) {
        return c.json({message: 'Server failed to process script'}, HttpStatusCode.BadGateway)
      }

      // Use the extracted scraping logic
      const result = await scrapeProcess({
        projectCommitPublicId,
        forceRefresh,
        db,
        sandbox
      })

      if (!result.success) {
        return c.json(
          {
            message: result.error ?? 'Failed to scrape URL',
            error: result.error
          },
          HttpStatusCode.BadGateway
        )
      }

      return c.json(
        {
          result: {
            success: result.success,
            cached: result.cached,
            cachedData: result.cachedData,
            timestamp: result.timestamp,
            extractionStage: result.extractionStage
          }
        },
        HttpStatusCode.Ok
      )
    }
  )
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
      const db = c.get('db')

      // Fetch the project commit by its publicId
      const projectCommit = await db.query.projectCommit.findFirst({
        where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
      })

      if (!projectCommit) {
        return c.json({message: 'Commit not found'}, HttpStatusCode.NotFound)
      }

      // Fetch the related project for permission check
      const project = await db.query.project.findFirst({
        where: (table, {eq}) => eq(table.id, projectCommit.projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
      }

      const {id: __, userId: ___, projectId: ____, ...restOfProjectCommit} = projectCommit
      const projectCommitDTO: schema.ProjectCommitDTOType = restOfProjectCommit

      // Fetch the active schema if there is one
      let activeSchema: schema.ProjectSchemaDTOType | null = null
      const activeSchemaVersion = projectCommit.activeSchemaVersion
      if (typeof activeSchemaVersion === 'number') {
        const schemaRecord = await db.query.projectSchema.findFirst({
          where: (table, {and, eq}) =>
            and(eq(table.projectId, projectCommit.projectId), eq(table.version, activeSchemaVersion))
        })

        if (schemaRecord) {
          const {id: _____, projectId: ______, ...restOfSchema} = schemaRecord
          activeSchema = restOfSchema
        }
      }

      // Fetch the active extractor (script) if there is one
      let activeExtractor: schema.ExtractorDTOType | null = null
      const activeExtractorVersion = projectCommit.activeExtractorVersion
      if (typeof activeExtractorVersion === 'number') {
        const extractorRecord = await db.query.extractor.findFirst({
          where: (table, {and, eq}) =>
            and(eq(table.projectId, projectCommit.projectId), eq(table.version, activeExtractorVersion))
        })

        if (extractorRecord) {
          const {id: _____, projectId: ______, ...restOfExtractor} = extractorRecord
          activeExtractor = restOfExtractor
        }
      }

      return c.json(
        {
          result: {
            commit: projectCommitDTO,
            activeSchema,
            activeExtractor
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

      // Check if URL is changing
      const urlIsChanging = projectCommit.currentEditorUrl !== currentEditorUrl

      // Update the currentEditorUrl and clear cache if URL changed
      const [updatedCommit] = await db
        .update(schema.projectCommit)
        .set({
          currentEditorUrl: currentEditorUrl,
          // Clear cache if URL is different
          ...(urlIsChanging
            ? {
                cachedData: null,
                cachedAt: null
              }
            : {})
        })
        .where(sqlEq(schema.projectCommit.id, projectCommit.id))
        .returning()

      return c.json(
        {
          result: {
            success: true,
            cacheCleared: urlIsChanging
          }
        },
        HttpStatusCode.Ok
      )
    }
  )

  .post(
    '/clearCache',
    validator('json', (value) => {
      return value as {
        projectCommitPublicId: schema.ProjectCommitPublicId
      }
    }),
    async (c) => {
      const {projectCommitPublicId} = c.req.valid('json')
      const user = c.get('user')
      const db = c.get('db')

      // Find the project commit
      const projectCommit = await db.query.projectCommit.findFirst({
        where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
      })

      if (!projectCommit) {
        return c.json({message: 'Project commit not found'}, HttpStatusCode.NotFound)
      }

      // Find the related project
      const project = await db.query.project.findFirst({
        where: (table, {eq}) => eq(table.id, projectCommit.projectId)
      })

      if (!project) {
        return c.json({message: 'Project not found'}, HttpStatusCode.NotFound)
      }

      // Check write permission
      if (await userCannotProjectAction(db, 'update', user, project.subjectPolicyId)) {
        return c.json({message: 'Access unauthorized'}, HttpStatusCode.Forbidden)
      }

      // Clear the cache fields
      await db
        .update(schema.projectCommit)
        .set({
          cachedData: null,
          cachedAt: null
        })
        .where(sqlEq(schema.projectCommit.id, projectCommit.id))

      return c.json(
        {
          result: {
            success: true
          }
        },
        HttpStatusCode.Ok
      )
    }
  )

  .get(
    '/preview/:projectCommitPublicId',
    validator('param', (value) => {
      return value as {
        projectCommitPublicId: schema.ProjectCommitPublicId
      }
    }),
    async (c) => {
      const {projectCommitPublicId} = c.req.valid('param')
      const user = c.get('user')
      const db = c.get('db')

      // Find the project commit
      const projectCommit = await db.query.projectCommit.findFirst({
        where: (table, {eq}) => eq(table.publicId, projectCommitPublicId)
      })

      if (!projectCommit) {
        return c.text('Commit not found', HttpStatusCode.NotFound)
      }

      // Find the related project for permission check
      const project = await db.query.project.findFirst({
        where: (table, {eq}) => eq(table.id, projectCommit.projectId)
      })

      if (!project) {
        return c.text('Project not found', HttpStatusCode.NotFound)
      }

      // Check read permission
      if (await userCannotProjectAction(db, 'read', user, project.subjectPolicyId)) {
        return c.text('Access unauthorized', HttpStatusCode.Forbidden)
      }

      // Check if we have cached HTML
      if (!projectCommit.cachedData?.html) {
        return c.text('No cached HTML available. Please scrape the URL first.', HttpStatusCode.NotFound)
      }

      // Return the HTML with proper content type
      return c.html(projectCommit.cachedData.html, HttpStatusCode.Ok, {
        'Content-Security-Policy':
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:; frame-ancestors 'self';",
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff'
      })
    }
  )

export default app
export type ProjectType = typeof app
