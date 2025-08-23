import type {StateSlice} from './use-store'
import type {ProjectDTOType, ProjectPublicId} from '@/db/schema'

export type ProjectInfo = Pick<ProjectDTOType['project'], 'name' | 'publicId'> & {
  lastOpened: number
}

export interface RecentProjectsSlice {
  recentProjects: ProjectInfo[]
  addRecentProject: (project: Omit<ProjectInfo, 'lastOpened'>) => void
  removeRecentProject: (publicId: ProjectPublicId) => void
  clearRecentProjects: () => void
}

export const createRecentProjectsSlice: StateSlice<RecentProjectsSlice> = (set, get) =>
  ({
    recentProjects: [],
    addRecentProject: (project) => {
      set(
        (draft) => {
          const index = draft.recentProjectsSlice.recentProjects.findIndex(
            (p) => p.publicId === project.publicId
          )

          if (index !== -1) {
            draft.recentProjectsSlice.recentProjects.splice(index, 1)
          }

          draft.recentProjectsSlice.recentProjects.unshift({
            publicId: project.publicId,
            name: project.name,
            lastOpened: Date.now()
          })
          draft.recentProjectsSlice.recentProjects.splice(5)
        },
        true,
        'recentProjects/addRecentProject'
      )
    },
    removeRecentProject: (publicId) => {
      set(
        (draft) => {
          const index = draft.recentProjectsSlice.recentProjects.findIndex((p) => p.publicId === publicId)

          if (index !== -1) {
            draft.recentProjectsSlice.recentProjects.splice(index, 1)
          }
        },
        true,
        'recentProjects/removeRecentProject'
      )
    },
    clearRecentProjects: () => {
      set(
        (draft) => {
          draft.recentProjectsSlice.recentProjects = []
        },
        true,
        'recentProjects/clearRecentProjects'
      )
    }
  }) as RecentProjectsSlice
