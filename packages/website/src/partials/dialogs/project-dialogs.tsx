import {PUBLIC_VARS} from '@/vars.public'
import {toast} from 'sonner'
import {DeleteProjectConfirmDialog} from '@/partials/dialogs/delete-project-confirm-dialog'
import {NewProjectDialog} from '@/partials/dialogs/new-project-dialog'
import {RenameProjectDialog} from '@/partials/dialogs/rename-project-dialog'
import {useProjectStore} from '@/store/use-project-store'
import api from '@/lib/api-client'
import {ProjectNotFoundDialog} from './project-not-found-dialog'
import {useNavigate} from '@tanstack/react-router'
import {nowait} from '@/lib/async-utils'
import debug from 'debug'
import {useEffect} from 'react'
import {getErrorMessage} from '@/lib/error-message'
import {CrawlerActivationDialog} from './crawler-activation-dialog'

const log = debug('app:project-dialogs')

export type ProjectDialogsConfig = {
  'rename-project': null
  'confirm-delete-project': null
  'new-project': null
  'project-not-found': null
  'crawler-activation-dialog': null
}

export type ProjectDialogType = keyof ProjectDialogsConfig
export type ProjectDialogState =
  | {type: null; payload: null}
  | {[K in ProjectDialogType]: {type: K; payload: ProjectDialogsConfig[K]}}[ProjectDialogType]

export function ProjectDialogs() {
  const navigate = useNavigate()

  const project = useProjectStore((state) => state.projectSlice.project)
  const projectCommit = useProjectStore((state) => state.projectSlice.projectCommit)

  // const setProjectPrivate = useProjectStore((state) => state.projectSlice.setProjectPrivate)
  // const setProjectPublic = useProjectStore((state) => state.projectSlice.setProjectPublic)

  const currentProjectDialog = useProjectStore((state) => state.projectSlice.currentProjectDialog)
  const setCurrentProjectDialog = useProjectStore((state) => state.projectSlice.setCurrentProjectDialog)

  const deleteProject = useProjectStore((state) => state.projectSlice.deleteProject)

  // const deleteFile = useProjectStore((state) => state.projectSlice.deleteFile)
  // const loadProjectTriggers = useProjectStore((state) => state.projectSlice.loadProjectTriggers)

  if (!project) {
    return
  }

  return (
    <>
      <CrawlerActivationDialog
        key={
          currentProjectDialog.type === 'crawler-activation-dialog'
            ? 'crawler-activation-dialog-open'
            : 'crawler-activation-dialog-closed'
        }
        open={currentProjectDialog.type === 'crawler-activation-dialog'}
        onOpenChange={(open) => {
          if (open) {
            setCurrentProjectDialog('crawler-activation-dialog', null)
          } else {
            setCurrentProjectDialog(null, null)
          }
        }}
        projectId={project.project.publicId}
        projectName={project.project.name}
        createdAt={project.project.createdAt}
        openConfirmDeleteProjectDialog={() => {
          setCurrentProjectDialog('confirm-delete-project', null)
        }}
      />

      <ProjectNotFoundDialog
        key={
          currentProjectDialog.type === 'project-not-found'
            ? 'project-not-found-open'
            : 'project-not-found-closed'
        }
        open={currentProjectDialog.type === 'project-not-found'}
        onOpenChange={(open) => {
          if (open) {
            setCurrentProjectDialog('project-not-found', null)
          } else {
            setCurrentProjectDialog(null, null)
            nowait(navigate({to: '/'}))
          }
        }}
      />

      <DeleteProjectConfirmDialog
        key={
          currentProjectDialog.type === 'confirm-delete-project'
            ? 'confirm-delete-project-open'
            : 'confirm-delete-project-closed'
        }
        open={currentProjectDialog.type === 'confirm-delete-project'}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentProjectDialog(null, null)
          }
        }}
        projectId={project.project.publicId}
        projectName={project.project.name}
        createdAt={project.project.createdAt}
        deleteProject={async () => {
          const result = await deleteProject()

          if (result.success) {
            toast.success('Project has been successfully deleted.')
            await navigate({to: '/'})
          } else {
            toast.error('Failed to delete project. Please try again.')
            throw new Error('Failed to set public')
          }
        }}
      />
      <RenameProjectDialog
        key={currentProjectDialog.type === 'rename-project' ? 'rename-project-open' : 'rename-project-closed'}
        open={currentProjectDialog.type === 'rename-project'}
        onOpenChange={(open) => {
          if (open) {
            setCurrentProjectDialog('rename-project', null)
          } else {
            setCurrentProjectDialog(null, null)
          }
        }}
      />

      <NewProjectDialog
        key={currentProjectDialog.type === 'new-project' ? 'new-project-open' : 'new-project-closed'}
        open={currentProjectDialog.type === 'new-project'}
        onOpenChange={(open) => {
          if (open) {
            setCurrentProjectDialog('new-project', null)
          } else {
            setCurrentProjectDialog(null, null)
          }
        }}
      />
    </>
  )
}
