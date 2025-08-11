import type {StateSlice} from './use-project-store'
import api from '@/lib/api-client'
import type {
  ProjectChatCursor,
  ProjectChatPublicId,
  ProjectCommitDTOType,
  ProjectCommitPublicId,
  ProjectDTOType,
  ProjectPublicId
} from '@/db/schema'
import type {
  ProjectDialogsConfig,
  ProjectDialogState,
  ProjectDialogType
} from '@/partials/dialogs/project-dialogs'
import {
  failSaving,
  finishLoading,
  finishSaving,
  initialAsyncEntityState,
  startLoading,
  startSaving,
  type AsyncEntityState
} from './async-entity-state'
import debug from 'debug'
import {initialPaginationEntityState, updatePaginationEntityState} from './pagination-entity-state'
import {getErrorMessage} from '@/lib/error-message'

const log = debug('app:project-slice')

export interface ProjectSlice {
  project: ProjectDTOType | null
  projectCommit: ProjectCommitDTOType | null
  asyncEntityState: AsyncEntityState
  currentProjectDialog: ProjectDialogState
  setCurrentProjectDialog: <T extends ProjectDialogType | null>(
    type: T,
    payload: T extends ProjectDialogType ? ProjectDialogsConfig[T] : null
  ) => void
  setProjectPublic: () => Promise<{success: boolean}>
  setProjectPrivate: () => Promise<{success: boolean}>
  loadProject: (projectPublicId: ProjectPublicId, chatId?: ProjectChatPublicId) => Promise<void>
  reloadProjectCommit: (projectCommitPublicId: ProjectCommitPublicId) => Promise<void>
  duplicateProject: () => Promise<{success: boolean; newProjectPublicId: ProjectPublicId | null}>
  renameProject: (newProjectName: string) => Promise<{success: boolean}>
  deleteProject: () => Promise<{success: boolean}>
  createProject: (projectName: string) => Promise<{success: boolean; projectPublicId: ProjectPublicId | null}>
  updateCurrentEditorUrl: (url: string) => Promise<{success: boolean}>
}

export const createProjectSlice: StateSlice<ProjectSlice> = (set, get) =>
  ({
    project: null,
    projectCommit: null,
    asyncEntityState: initialAsyncEntityState(),
    currentProjectDialog: {type: null, payload: null},
    setCurrentProjectDialog(type, payload) {
      set(
        (draft) => {
          if (type === null) {
            draft.projectSlice.currentProjectDialog = {
              type: null,
              payload: null
            }
          } else {
            draft.projectSlice.currentProjectDialog = {
              type: type,
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              payload: payload ?? null
            } satisfies ProjectDialogState
          }
        },
        true,
        'project/setCurrentProjectDialog'
      )
    },
    setProjectPublic: async () => {
      const projectPublicId = get().projectSlice.project?.project.publicId
      if (!projectPublicId) {
        return
      }
      set(
        (draft) => {
          startSaving(draft.projectSlice.asyncEntityState)
          // draft.projectSlice.isUpdatingVisibility = true
        },
        true,
        'project/setProjectPublic:start'
      )
      let success = false
      try {
        const response = await api.projects.setPublic.$post({
          json: {
            projectPublicId: projectPublicId
          }
        })
        if (response.ok) {
          const body = await response.json()

          set(
            (draft) => {
              if (!draft.projectSlice.project) {
                log('error project doesnt exist')
                return
              }

              draft.projectSlice.project.subjectPolicy = body.result.subjectPolicy

              success = true
            },
            true,
            'project/setProjectPublic/update'
          )
        } else {
          log('error project publishing error', await response.json())
        }
      } finally {
        set(
          (draft) => {
            finishSaving({entity: draft.projectSlice.asyncEntityState, isUnchanged: true})
            // draft.projectSlice.isUpdatingVisibility = false
          },
          true,
          'project/setProjectPublic:done'
        )
      }
      return {success}
    },
    renameProject: async (newProjectName: string) => {
      const projectId = get().projectSlice.project?.project.publicId
      if (!projectId) {
        log('failed to rename project, no project id found')
        return
      }
      set(
        (draft) => {
          startSaving(draft.projectSlice.asyncEntityState)
          // draft.projectSlice.isRenaming = true
        },
        true,
        'project/renameProject:start'
      )
      let success = false
      try {
        const response = await api.projects.rename.$post({
          json: {
            projectPublicId: projectId,
            projectName: newProjectName
          }
        })
        if (response.ok) {
          const body = await response.json()

          set(
            (draft) => {
              if (!draft.projectSlice.project) {
                log('error project doesnt exist')
                return
              }

              draft.projectSlice.project.project.name = body.result.newProjectName

              success = true
            },
            true,
            'project/renameProject:update'
          )

          // const addRecentProject = get().recentProjectsSlice.addRecentProject
          // const removeRecentProject = get().recentProjectsSlice.removeRecentProject
          // removeRecentProject(projectId)
          // addRecentProject({publicId: projectId, name: newProjectName})
        } else {
          log('project renaming error', await response.json())
        }
      } finally {
        set(
          (draft) => {
            finishSaving({entity: draft.projectSlice.asyncEntityState, isUnchanged: true})
            // draft.projectSlice.isDuplicating = false
          },
          true,
          'project/renameProject:done'
        )
      }
      return {success}
    },
    duplicateProject: async () => {
      const projectId = get().projectSlice.project?.project.publicId
      if (!projectId) {
        log('failed to duplicate project, no project id found')
        return
      }
      set(
        (draft) => {
          startSaving(draft.projectSlice.asyncEntityState)
          // draft.projectSlice.isDuplicating = true
        },
        true,
        'project/duplicateProject/start'
      )
      const success = false
      const newProjectPublicId: ProjectPublicId | null = null
      throw new Error('unimplemented yet')
      try {
        // TODO: duplicate endpoint doesn't exist on server
        // const response = await api.projects.duplicate.$post({
        //   json: {
        //     projectPublicId: projectId
        //   }
        // })
        // const response = null as any
        // if (response.ok) {
        //   const body = await response.json()
        //   if (body.success) {
        //     success = true
        //     newProjectPublicId = body.newProjectPublicId
        //   }
        // } else {
        //   log('error project duplicating error', await response.json())
        // }
      } finally {
        set(
          (draft) => {
            finishSaving({entity: draft.projectSlice.asyncEntityState, isUnchanged: true})
            // draft.projectSlice.isDuplicating = false
          },
          true,
          'project/duplicateProject/finally'
        )
      }
      return {success, newProjectPublicId}
    },
    createProject: async (projectName: string) => {
      let success = false
      let projectPublicId: ProjectPublicId | null = null
      try {
        const response = await api.projects.new.$post({
          json: {
            projectName
          }
        })
        if (response.ok) {
          const body = await response.json()
          projectPublicId = body.project.publicId
          success = true
        } else {
          const errorBody = await response.json()
          log('error creating project', errorBody)
          throw new Error(errorBody.message || 'Failed to create project')
        }
      } catch (error) {
        log('error creating project', error)
        throw error
      }
      return {success, projectPublicId}
    },
    deleteProject: async () => {
      const projectPublicId = get().projectSlice.project?.project.publicId
      if (!projectPublicId) {
        return
      }
      set(
        (draft) => {
          startSaving(draft.projectSlice.asyncEntityState)
        },
        true,
        'project/deleteProject:start'
      )
      let success = false
      try {
        const response = await api.projects.delete.$post({
          json: {
            projectPublicId
          }
        })
        if (response.ok) {
          const body = await response.json()
          set(
            (draft) => {
              draft.projectSlice.project = null
              draft.projectSlice.projectCommit = null
              draft.projectSlice.asyncEntityState = initialAsyncEntityState()
            },
            true,
            'project/deleteProject:done'
          )
          success = true
        } else {
          log('error project delete error', await response.json())
        }
      } finally {
        //
      }
      return {success}
    },
    setProjectPrivate: async () => {
      const projectPublicId = get().projectSlice.project?.project.publicId
      if (!projectPublicId) {
        return
      }
      set(
        (draft) => {
          startSaving(draft.projectSlice.asyncEntityState)
          // draft.projectSlice.isUpdatingVisibility = true
        },
        true,
        'project/setProjectPrivate:start'
      )
      let success = false
      try {
        const response = await api.projects.setPrivate.$post({
          json: {
            projectPublicId: projectPublicId
          }
        })
        if (response.ok) {
          const body = await response.json()

          set(
            (draft) => {
              if (!draft.projectSlice.project) {
                log('error project doesnt exist')
                return
              }

              draft.projectSlice.project.subjectPolicy = body.result.subjectPolicy

              success = true
            },
            true,
            'project/setProjectPrivate:update'
          )
        } else {
          log('error project publishing error', await response.json())
        }
      } finally {
        set(
          (draft) => {
            finishSaving({entity: draft.projectSlice.asyncEntityState, isUnchanged: true})
            // draft.projectSlice.isUpdatingVisibility = false
          },
          true,
          'project/setProjectPrivate:finally'
        )
      }
      return {success}
    },
    loadProject: async (projectPublicId, chatId) => {
      set(
        (draft) => {
          startLoading(draft.projectSlice.asyncEntityState)
          // draft.projectSlice.error = null
          // TODO: openTabs doesn't exist on EditorSlice
          // const existingOpenTabs = draft.editorSlice.openTabs[projectPublicId]
          // if (!existingOpenTabs) {
          //   draft.editorSlice.openTabs[projectPublicId] = []
          // }
        },
        true,
        'project/loadProject:start'
      )

      try {
        // const loadProjectCommit = async (projectCommitPublicId: ProjectCommitPublicId) => {
        //   const response = await api.projectCommits.projectCommitPublicId.$post({
        //     json: {projectCommitPublicId: projectCommitPublicId}
        //   })
        //   if (response.ok) {
        //     const body = await response.json()
        //     set(
        //       (draft) => {
        //         // TODO: projectCommitFiles doesn't exist in ProjectSlice
        //         // draft.projectSlice.projectCommitFiles = body.result.files
        //       },
        //       true,
        //       'project/loadProject:loadCommit'
        //     )
        //   } else {
        //     const body = await response.json()
        //     log('error project commit not found', body)
        //     throw new Error(body.message)
        //   }
        // }

        // log('loading project', projectPublicId)
        const response = await api.projects.projectPublicId.$post({
          json: {
            projectPublicId: projectPublicId
          }
        })
        log('resp', response)
        if (response.ok) {
          const body = await response.json()
          const projectCommitPublicId = body.result.stagedCommit.publicId
          if (projectCommitPublicId) {
            set(
              (draft) => {
                draft.projectSlice.project = body.result.project

                const projectPubId = draft.projectSlice.project.project.publicId

                const chatFinishLoadingState = initialAsyncEntityState()
                finishLoading(chatFinishLoadingState)
                const chatPaginationState = initialPaginationEntityState<ProjectChatCursor>()
                updatePaginationEntityState(chatPaginationState, {
                  startCursor: body.result.project.chatsPageInfo.startCursor,
                  hasNextPage: body.result.project.chatsPageInfo.hasNextPage
                })

                draft.assistantSlice.projectChatsState[projectPubId] ??= {
                  projectChats: body.result.project.chats,
                  asyncEntityState: chatFinishLoadingState,
                  paginationState: chatPaginationState
                }

                draft.projectSlice.projectCommit = body.result.stagedCommit

                const selectedChat = draft.assistantSlice.selectedProjectChat[projectPubId]
                let chatSet = false
                if (chatId) {
                  // Verify the chat exists in the loaded chats
                  const providedChat = draft.assistantSlice.projectChatsState[projectPubId].projectChats.find(
                    (chat) => chat.publicId === chatId
                  )
                  if (providedChat) {
                    log('setting selected project chat to provided chat:', chatId)
                    draft.assistantSlice.selectedProjectChat[projectPubId] = chatId

                    // When a chatId is provided via URL, mark it as pending initial message submission
                    // This tells the AssistantChat component to automatically submit the first message
                    draft.assistantSlice.pendingInitialMessage[projectPubId] = chatId
                    chatSet = true
                  }
                } else if (selectedChat) {
                  chatSet = true
                }

                if (!chatSet) {
                  // Default to empty chat when no chatId provided
                  const emptyChat = draft.assistantSlice.projectChatsState[projectPubId].projectChats.find(
                    (chat) => chat.chatType === 'empty'
                  )
                  if (!emptyChat) {
                    log('empty chat expected but not found')
                    return
                  }
                  log('setting selected project chat to empty chat')
                  draft.assistantSlice.selectedProjectChat[projectPubId] = emptyChat.publicId
                }
              },
              true,
              'project/loadProject:load'
            )

            // await loadProjectCommit(projectCommitPublicId)

            // TODO: recentProjectsSlice doesn't exist
            // const addRecentProject = get().recentProjectsSlice.addRecentProject
            // const removeRecentProject = get().recentProjectsSlice.removeRecentProject
            // removeRecentProject(body.result.project.project.publicId)
            // addRecentProject({
            //   publicId: body.result.project.project.publicId,
            //   name: body.result.project.project.name
            // })
            set(
              (draft) => {
                finishLoading(draft.projectSlice.asyncEntityState)
              },
              true,
              'project/loadProject:done'
            )
          } else {
            throw new Error('unable to load project commit')
          }
        } else {
          const body = await response.json()
          throw new Error(body.message)
        }
      } catch (e) {
        log('error project not found or error', e)
        get().projectSlice.setCurrentProjectDialog('project-not-found', null)
      }
    },
    reloadProjectCommit: async (projectCommitPublicId) => {
      set(
        (draft) => {
          startLoading(draft.projectSlice.asyncEntityState)
        },
        true,
        'project/reloadProjectCommit:start'
      )
      try {
        const response = await api.projectCommits.projectCommitPublicId.$post({
          json: {projectCommitPublicId: projectCommitPublicId}
        })
        if (response.ok) {
          const body = await response.json()
          set(
            (draft) => {
              // TODO: projectCommitFiles doesn't exist in ProjectSlice
              // draft.projectSlice.projectCommitFiles = body.result.files
              finishLoading(draft.projectSlice.asyncEntityState)
            },
            true,
            'project/reloadProjectCommit:done'
          )
        } else {
          const body = await response.json()
          throw new Error(body.message)
        }
      } catch (e) {
        log('error project not found or error', e)
        get().projectSlice.setCurrentProjectDialog('project-not-found', null)
      }
    },
    updateCurrentEditorUrl: async (url: string) => {
      const projectCommitPublicId = get().projectSlice.projectCommit?.publicId
      if (!projectCommitPublicId) {
        log('error: no project commit to update')
        return {success: false}
      }

      set(
        (draft) => {
          // Optimistically update the local state
          if (draft.projectSlice.projectCommit) {
            draft.projectSlice.projectCommit.currentEditorUrl = url
          }
        },
        true,
        'project/updateCurrentEditorUrl:start'
      )

      let success = false
      try {
        // Call API to persist the URL change
        const response = await api.projectCommits.updateEditorUrl.$post({
          json: {
            projectCommitPublicId,
            currentEditorUrl: url
          }
        })

        if (response.ok) {
          success = true
          log('currentEditorUrl updated successfully:', url)
        } else {
          // Revert on failure
          const body = await response.json()
          log('error updating currentEditorUrl:', body.message)

          // Reload project commit to get the correct state
          await get().projectSlice.reloadProjectCommit(projectCommitPublicId)
        }
      } catch (e) {
        log('error updating currentEditorUrl:', e)
        // Reload project commit to get the correct state
        await get().projectSlice.reloadProjectCommit(projectCommitPublicId)
      }

      return {success}
    }
  }) as ProjectSlice
