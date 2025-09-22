import debug from 'debug'

import type {
  CrawlerDTOType,
  ExtractorDTOType,
  ProjectCommitDTOType,
  ProjectCommitPublicId,
  ProjectPublicId,
  ProjectSchemaDTOType
} from '@/db/schema'
import api from '@/lib/api-client'
import { asyncRetry } from '@/lib/async-utils'

import {
  type AsyncEntityState,
  failLoading,
  finishLoading,
  initialAsyncEntityState,
  isLoaded,
  isLoading,
  startLoading
} from './async-entity-state'
import type { StateSlice } from './use-store'

const log = debug('app:extractor-slice')

// State for a project's schemas
export interface ProjectSchemasState {
  schemas: ProjectSchemaDTOType[] // All schemas for the project
  asyncEntityState: AsyncEntityState
}

// State for a project's extractors (scripts)
export interface ProjectExtractorsState {
  extractors: ExtractorDTOType[] // All extractors for the project
  asyncEntityState: AsyncEntityState
}

// State for a project's crawlers (scripts)
export interface ProjectCrawlersState {
  crawlers: CrawlerDTOType[]
  asyncEntityState: AsyncEntityState
}

// Per-project scraping state
export interface ProjectScrapingState {
  isScrapingActive: boolean
}

export const ScrapeModes = ['scrape', 'crawl-and-scrape'] as const
export type ScrapeMode = (typeof ScrapeModes)[number]

export interface ExtractorSlice {
  // Project commit state (current configuration)
  projectCommit: ProjectCommitDTOType | null
  projectCommitAsyncState: AsyncEntityState

  // Project schemas state
  projectSchemas: Record<ProjectPublicId, ProjectSchemasState | undefined>

  // Project extractors (scripts) state
  projectExtractors: Record<ProjectPublicId, ProjectExtractorsState | undefined>

  // Project crawlers (scripts) state
  projectCrawlers: Record<ProjectPublicId, ProjectCrawlersState | undefined>

  // Per-project scraping activity state
  projectScrapingState: Record<ProjectPublicId, ProjectScrapingState | undefined>

  // Scraping mode (UI-level control)
  scrapeMode: ScrapeMode
  setScrapeMode: (mode: ScrapeMode) => void
  toggleScrapeMode: () => void

  // Load all schemas for a project
  loadSchemas: (projectPublicId: ProjectPublicId) => Promise<void>

  // Load all extractors for a project
  loadExtractors: (projectPublicId: ProjectPublicId) => Promise<void>

  // Load all crawlers for a project
  loadCrawlers: (projectPublicId: ProjectPublicId) => Promise<void>

  // Reload project commit and sync all configuration
  reloadProjectCommit: (projectCommitPublicId: ProjectCommitPublicId) => Promise<void>

  // Update the URL being scraped
  updateScrapingUrl: (url: string) => Promise<{ success: boolean }>

  // Clear the scraped content cache
  clearScrapedCache: () => Promise<{ success: boolean }>

  // Fetch and cache content from current URL
  fetchPageContent: (forceRefresh?: boolean) => Promise<{
    success: boolean
    html?: string
    error?: string
  }>

  // Clear recent URLs
  clearRecentUrls: () => Promise<{ success: boolean }>
}

export const createExtractorSlice: StateSlice<ExtractorSlice> = (set, get) =>
  ({
    projectCommit: null,
    projectCommitAsyncState: initialAsyncEntityState(),
    projectSchemas: {},
    projectExtractors: {},
    projectCrawlers: {},
    projectScrapingState: {},
    scrapeMode: 'scrape',

    setScrapeMode: (mode) => {
      set(
        (draft) => {
          draft.extractorSlice.scrapeMode = mode
        },
        true,
        'extractor/setScrapeMode'
      )
    },
    toggleScrapeMode: () => {
      set(
        (draft) => {
          draft.extractorSlice.scrapeMode =
            draft.extractorSlice.scrapeMode === 'scrape' ? 'crawl-and-scrape' : 'scrape'
        },
        true,
        'extractor/toggleScrapeMode'
      )
    },
    loadSchemas: async (projectPublicId) => {
      const currentState = get().extractorSlice.projectSchemas[projectPublicId]

      // Don't reload if already loading or already loaded
      if (
        currentState &&
        (isLoading(currentState.asyncEntityState) || isLoaded(currentState.asyncEntityState))
      ) {
        return
      }

      // Initialize state if needed
      if (!currentState) {
        set(
          (draft) => {
            draft.extractorSlice.projectSchemas[projectPublicId] = {
              schemas: [],
              asyncEntityState: initialAsyncEntityState()
            }
          },
          true,
          'extractor/initSchemaState'
        )
      }

      set(
        (draft) => {
          const state = draft.extractorSlice.projectSchemas[projectPublicId]
          if (state) {
            startLoading(state.asyncEntityState)
          }
        },
        true,
        'extractor/loadSchemas:start'
      )

      try {
        await asyncRetry(
          async () => {
            const resp = await api.projects.schemas.$post({
              json: {
                projectPublicId
              }
            })

            if (resp.ok) {
              const body = await resp.json()

              set(
                (draft) => {
                  const state = draft.extractorSlice.projectSchemas[projectPublicId]
                  if (state) {
                    Object.assign(state, {
                      schemas: body.schemas
                    })
                    finishLoading(state.asyncEntityState)
                  }
                },
                true,
                'extractor/loadSchemas:done'
              )
            } else {
              const body = (await resp.json()) as { message: string }
              throw new Error(body.message)
            }
          },
          { retries: 2, minDelay: 500 }
        )
      } catch (e) {
        log('Error loading schemas:', e)
        set(
          (draft) => {
            const state = draft.extractorSlice.projectSchemas[projectPublicId]
            if (state) {
              failLoading(state.asyncEntityState)
            }
          },
          true,
          'extractor/loadSchemas:error'
        )
      }
    },

    loadExtractors: async (projectPublicId) => {
      const currentState = get().extractorSlice.projectExtractors[projectPublicId]

      // Don't reload if already loading or already loaded
      if (
        currentState &&
        (isLoading(currentState.asyncEntityState) || isLoaded(currentState.asyncEntityState))
      ) {
        return
      }

      // Initialize state if needed
      if (!currentState) {
        set(
          (draft) => {
            draft.extractorSlice.projectExtractors[projectPublicId] = {
              extractors: [],
              asyncEntityState: initialAsyncEntityState()
            }
          },
          true,
          'extractor/initExtractorState'
        )
      }

      set(
        (draft) => {
          const state = draft.extractorSlice.projectExtractors[projectPublicId]
          if (state) {
            startLoading(state.asyncEntityState)
          }
        },
        true,
        'extractor/loadExtractors:start'
      )

      try {
        await asyncRetry(
          async () => {
            const resp = await api.projects.extractors.$post({
              json: {
                projectPublicId
              }
            })

            if (resp.ok) {
              const body = (await resp.json()) as { extractors: ExtractorDTOType[] }

              set(
                (draft) => {
                  const state = draft.extractorSlice.projectExtractors[projectPublicId]
                  if (state) {
                    Object.assign(state, {
                      extractors: body.extractors
                    })
                    finishLoading(state.asyncEntityState)
                  }
                },
                true,
                'extractor/loadExtractors:done'
              )
            } else {
              const body = (await resp.json()) as { message: string }
              throw new Error(body.message)
            }
          },
          { retries: 2, minDelay: 500 }
        )
      } catch (e) {
        log('Error loading extractors:', e)
        set(
          (draft) => {
            const state = draft.extractorSlice.projectExtractors[projectPublicId]
            if (state) {
              failLoading(state.asyncEntityState)
            }
          },
          true,
          'extractor/loadExtractors:error'
        )
      }
    },

    loadCrawlers: async (projectPublicId) => {
      const currentState = get().extractorSlice.projectCrawlers[projectPublicId]

      // Don't reload if already loading or already loaded
      if (
        currentState &&
        (isLoading(currentState.asyncEntityState) || isLoaded(currentState.asyncEntityState))
      ) {
        return
      }

      // Initialize state if needed
      if (!currentState) {
        set(
          (draft) => {
            draft.extractorSlice.projectCrawlers[projectPublicId] = {
              crawlers: [],
              asyncEntityState: initialAsyncEntityState()
            }
          },
          true,
          'extractor/initCrawlerState'
        )
      }

      set(
        (draft) => {
          const state = draft.extractorSlice.projectCrawlers[projectPublicId]
          if (state) {
            startLoading(state.asyncEntityState)
          }
        },
        true,
        'extractor/loadCrawlers:start'
      )

      try {
        await asyncRetry(
          async () => {
            const resp = await api.projects.crawlers.$post({
              json: {
                projectPublicId
              }
            })

            if (resp.ok) {
              const body = (await resp.json()) as { crawlers: CrawlerDTOType[] }

              set(
                (draft) => {
                  const state = draft.extractorSlice.projectCrawlers[projectPublicId]
                  if (state) {
                    Object.assign(state, {
                      crawlers: body.crawlers
                    })
                    finishLoading(state.asyncEntityState)
                  }
                },
                true,
                'extractor/loadCrawlers:done'
              )
            } else {
              const body = (await resp.json()) as { message: string }
              throw new Error(body.message)
            }
          },
          { retries: 2, minDelay: 500 }
        )
      } catch (e) {
        log('Error loading crawlers:', e)
        set(
          (draft) => {
            const state = draft.extractorSlice.projectCrawlers[projectPublicId]
            if (state) {
              failLoading(state.asyncEntityState)
            }
          },
          true,
          'extractor/loadCrawlers:error'
        )
      }
    },

    reloadProjectCommit: async (projectCommitPublicId) => {
      // Check if already loading to prevent multiple simultaneous reloads
      if (isLoading(get().extractorSlice.projectCommitAsyncState)) {
        log('Project commit already loading, skipping reload')
        return
      }

      log('Reloading project commit:', projectCommitPublicId)

      // Mark as loading
      set(
        (draft) => {
          startLoading(draft.extractorSlice.projectCommitAsyncState)
        },
        true,
        'extractor/reloadProjectCommit:start'
      )

      try {
        // Fetch the latest project commit and active schema
        const response = await api.project.projectCommitPublicId.$post({
          json: { projectCommitPublicId }
        })

        if (!response.ok) {
          const body = await response.json()
          throw new Error(body.message)
        }

        const body = await response.json()
        const { commit, activeSchema, activeExtractor } = body.result

        // Update the project commit, active schema, and active extractor in state
        set(
          (draft) => {
            // @ts-ignore-error
            draft.extractorSlice.projectCommit = commit
            finishLoading(draft.extractorSlice.projectCommitAsyncState)

            const projectPublicId = draft.projectSlice.project?.project.publicId
            if (!projectPublicId) {
              return
            }

            // Update the active schema if provided
            if (activeSchema) {
              const schemaState = draft.extractorSlice.projectSchemas[projectPublicId]

              if (!schemaState) {
                // Initialize schema state if it doesn't exist
                const finishedLoadingState = initialAsyncEntityState()
                finishLoading(finishedLoadingState)

                // Use Object.assign to create and set the new state
                const newSchemaState = {
                  schemas: [activeSchema],
                  asyncEntityState: finishedLoadingState
                } as ProjectSchemasState
                Object.assign(draft.extractorSlice.projectSchemas, {
                  [projectPublicId]: newSchemaState
                })
              } else {
                // Add or update the active schema in the list
                const existingIndex = schemaState.schemas.findIndex((s) => s.version === activeSchema.version)
                if (existingIndex >= 0) {
                  // Update existing schema
                  Object.assign(schemaState.schemas[existingIndex], activeSchema)
                } else {
                  // Add new schema
                  // @ts-ignore-error
                  schemaState.schemas.push(activeSchema)
                  // Keep schemas sorted by version (newest first)
                  schemaState.schemas.sort((a, b) => b.version - a.version)
                }
              }

              log('Active schema loaded from API response:', activeSchema.version)
            }

            // Update the active extractor if provided
            if (activeExtractor) {
              const extractorState = draft.extractorSlice.projectExtractors[projectPublicId]

              if (!extractorState) {
                // Initialize extractor state if it doesn't exist
                const finishedLoadingState = initialAsyncEntityState()
                finishLoading(finishedLoadingState)

                // Use Object.assign to create and set the new state
                const newExtractorState: ProjectExtractorsState = {
                  extractors: [activeExtractor],
                  asyncEntityState: finishedLoadingState
                }
                Object.assign(draft.extractorSlice.projectExtractors, {
                  [projectPublicId]: newExtractorState
                })
              } else {
                // Add or update the active extractor in the list
                const existingIndex = extractorState.extractors.findIndex(
                  (e) => e.version === activeExtractor.version
                )
                if (existingIndex >= 0) {
                  // Update existing extractor
                  Object.assign(extractorState.extractors[existingIndex], activeExtractor)
                } else {
                  // Add new extractor
                  extractorState.extractors.push(activeExtractor)
                  // Keep extractors sorted by version (newest first)
                  extractorState.extractors.sort((a, b) => b.version - a.version)
                }
              }

              log('Active extractor loaded from API response:', activeExtractor.version)
            }
          },
          true,
          'extractor/reloadProjectCommit:updateAll'
        )

        log('Project commit reload complete')
      } catch (e) {
        log('Error reloading project commit:', e)

        // Mark as failed
        set(
          (draft) => {
            failLoading(draft.extractorSlice.projectCommitAsyncState)
          },
          true,
          'extractor/reloadProjectCommit:failed'
        )

        // Show error dialog if project not found
        get().projectSlice.setCurrentProjectDialog('project-not-found', null)
      }
    },

    updateScrapingUrl: async (url: string) => {
      const projectCommitPublicId = get().extractorSlice.projectCommit?.publicId

      if (!projectCommitPublicId) {
        log('No project commit to update')
        return { success: false }
      }

      try {
        // Update the URL on the backend
        const response = await api.project.updateEditorUrl.$post({
          json: {
            projectCommitPublicId,
            currentEditorUrl: url
          }
        })

        if (!response.ok) {
          const body = await response.json()
          throw new Error(body.message)
        }

        // Reload the project commit to get the updated state
        await get().extractorSlice.reloadProjectCommit(projectCommitPublicId)

        log('Scraping URL updated successfully')
        return { success: true }
      } catch (e) {
        log('Error updating scraping URL:', e)
        return { success: false }
      }
    },

    clearScrapedCache: async () => {
      const projectCommitPublicId = get().extractorSlice.projectCommit?.publicId

      if (!projectCommitPublicId) {
        log('No project commit to clear cache for')
        return { success: false }
      }

      try {
        const response = await api.project.clearCache.$post({
          json: { projectCommitPublicId }
        })

        if (!response.ok) {
          throw new Error('Failed to clear cache')
        }

        // Clear the cache data directly in the store instead of reloading
        set(
          (draft) => {
            if (draft.extractorSlice.projectCommit) {
              draft.extractorSlice.projectCommit.cachedData = null
              draft.extractorSlice.projectCommit.cachedAt = null
            }
          },
          true,
          'extractor/clearScrapedCache:clearCacheData'
        )

        log('Cache cleared successfully')
        return { success: true }
      } catch (e) {
        log('Error clearing cache:', e)
        return { success: false }
      }
    },

    fetchPageContent: async (forceRefresh = false) => {
      const projectCommitPublicId = get().extractorSlice.projectCommit?.publicId
      const currentUrl = get().extractorSlice.projectCommit?.currentEditorUrl

      if (!projectCommitPublicId || !currentUrl) {
        log('No project commit or URL to fetch')
        return { success: false, error: 'No URL configured' }
      }

      // Get current project ID from the store
      const projectPublicId = get().projectSlice.project?.project.publicId
      if (!projectPublicId) {
        log('No project ID available')
        return { success: false, error: 'No project selected' }
      }

      // Set scraping as active for this project
      set(
        (draft) => {
          draft.extractorSlice.projectScrapingState[projectPublicId] ??= {
            isScrapingActive: false
          }
          draft.extractorSlice.projectScrapingState[projectPublicId].isScrapingActive = true
        },
        true,
        'extractor/fetchPageContent:start'
      )

      try {
        log(`Fetching page content for: ${currentUrl} (force refresh: ${forceRefresh})`)

        const response = await api.project.scrape.$post({
          json: {
            projectCommitPublicId,
            forceRefresh
          }
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to fetch page content')
        }

        const data = await response.json()

        // Update the project commit directly with the returned cache data
        // This is more efficient than reloading from the API again
        set(
          (draft) => {
            if (draft.extractorSlice.projectCommit && data.result.cachedData) {
              draft.extractorSlice.projectCommit.cachedData = data.result.cachedData
              draft.extractorSlice.projectCommit.cachedAt =
                data.result.timestamp ?? draft.extractorSlice.projectCommit.cachedAt
            }
          },
          true,
          'extractor/fetchPageContent:updateCacheData'
        )

        log('Page content fetched successfully, cache data updated directly')

        // Set scraping as inactive - success
        set(
          (draft) => {
            if (draft.extractorSlice.projectScrapingState[projectPublicId]) {
              draft.extractorSlice.projectScrapingState[projectPublicId].isScrapingActive = false
            }
          },
          true,
          'extractor/fetchPageContent:success'
        )

        return {
          success: true,
          html: data.result.cachedData?.html
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to fetch page content'
        log('Error fetching page content:', errorMessage)

        // Set scraping as inactive - error
        set(
          (draft) => {
            if (draft.extractorSlice.projectScrapingState[projectPublicId]) {
              draft.extractorSlice.projectScrapingState[projectPublicId].isScrapingActive = false
            }
          },
          true,
          'extractor/fetchPageContent:error'
        )

        return { success: false, error: errorMessage }
      }
    },

    clearRecentUrls: async () => {
      const projectCommitPublicId = get().extractorSlice.projectCommit?.publicId

      if (!projectCommitPublicId) {
        log('No project commit to clear recent URLs')
        return { success: false }
      }

      try {
        // Clear in backend
        const response = await api.project.clearRecentUrls.$post({
          json: {
            projectCommitPublicId
          }
        })

        if (!response.ok) {
          const body = await response.json()
          throw new Error(body.message)
        }

        // Update local state
        set(
          (draft) => {
            if (draft.extractorSlice.projectCommit) {
              draft.extractorSlice.projectCommit.recentUrls = { urls: [] }
            }
          },
          true,
          'extractor/clearRecentUrls'
        )

        log('Recent URLs cleared successfully')
        return { success: true }
      } catch (e) {
        log('Error clearing recent URLs:', e)
        return { success: false }
      }
    }
  }) as ExtractorSlice
