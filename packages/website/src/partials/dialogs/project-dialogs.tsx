import {PUBLIC_VARS} from '@/vars.public'
import {toast} from 'sonner'
import {DeleteProjectConfirmDialog} from '@/partials/dialogs/delete-project-confirm-dialog'
import {NewProjectDialog} from '@/partials/dialogs/new-project-dialog'
import {RenameProjectDialog} from '@/partials/dialogs/rename-project-dialog'
import {useStore} from '@/store/use-store'
import {ProjectNotFoundDialog} from './project-not-found-dialog'
import {useNavigate} from '@tanstack/react-router'
import {nowait} from '@/lib/async-utils'
import debug from 'debug'
import {useEffect, useState} from 'react'
import {getErrorMessage} from '@/lib/error-message'
import {CrawlerActivationDialog} from './crawler-activation-dialog'
import {ScraperSettingsDialog} from './scraper-settings-dialog'
import api from '@/lib/api-client'

const log = debug('app:project-dialogs')

export type ProjectDialogsConfig = {
  'rename-project': null
  'confirm-delete-project': null
  'new-project': null
  'project-not-found': null
  'crawler-activation-dialog': null
  'scraper-settings': null
}

export type ProjectDialogType = keyof ProjectDialogsConfig
export type ProjectDialogState =
  | {type: null; payload: null}
  | {[K in ProjectDialogType]: {type: K; payload: ProjectDialogsConfig[K]}}[ProjectDialogType]

export function ProjectDialogs() {
  const navigate = useNavigate()
  const [defaultProjectName, setDefaultProjectName] = useState('')

  const project = useStore((state) => state.projectSlice.project)
  const projectCommit = useStore((state) => state.extractorSlice.projectCommit)

  // const setProjectPrivate = useStore((state) => state.projectSlice.setProjectPrivate)
  // const setProjectPublic = useStore((state) => state.projectSlice.setProjectPublic)

  const currentProjectDialog = useStore((state) => state.projectSlice.currentProjectDialog)
  const setCurrentProjectDialog = useStore((state) => state.projectSlice.setCurrentProjectDialog)

  const deleteProject = useStore((state) => state.projectSlice.deleteProject)
  const createProject = useStore((state) => state.projectSlice.createProject)

  // const deleteFile = useStore((state) => state.projectSlice.deleteFile)
  // const loadProjectTriggers = useStore((state) => state.projectSlice.loadProjectTriggers)

  // Fetch default project name when new-project dialog is about to open
  useEffect(() => {
    if (currentProjectDialog.type === 'new-project' && !defaultProjectName) {
      api.projects.newDefaultProjectName
        .$get({})
        .then((resp) => {
          if (resp.ok) {
            return resp.json()
          } else {
            throw new Error('default project name not found')
          }
        })
        .then((res) => {
          if (res.name) {
            setDefaultProjectName(res.name)
          }
        })
        .catch((e: unknown) => {
          log('ignoring error fetching default project name', e)
          setDefaultProjectName('New Project')
        })
    }
  }, [currentProjectDialog.type, defaultProjectName])

  if (!project) {
    return null
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
            // Reset default name for next time the dialog opens
            setDefaultProjectName('')
          }
        }}
        defaultProjectName={defaultProjectName}
        createProject={async (projectName: string) => {
          const result = await createProject(projectName)
          if (result.success && result.projectPublicId) {
            toast.success(`Scraper "${projectName}" created successfully`)
            await navigate({
              to: '/scraper/$project-public-id/edit',
              params: {'project-public-id': result.projectPublicId}
            })
          } else {
            toast.error('Failed to create project. Please try again.')
            throw new Error('Failed to create project')
          }
        }}
      />

      <ScraperSettingsDialog
        key={
          currentProjectDialog.type === 'scraper-settings'
            ? 'scraper-settings-open'
            : 'scraper-settings-closed'
        }
        open={currentProjectDialog.type === 'scraper-settings'}
        onOpenChange={(open) => {
          if (open) {
            setCurrentProjectDialog('scraper-settings', null)
          } else {
            setCurrentProjectDialog(null, null)
          }
        }}
        projectId={project.project.publicId}
        projectName={project.project.name}
        initialSettings={{
          commit: projectCommit?.settingsJson,
          extractor: null
        }}
        onSave={async (settings) => {
          try {
            // TODO: Implement API call to save settings
            // This would typically update projectCommit.settingsJson and extractor.settingsJson
            log('Saving settings:', settings)

            // Simulate saving for now
            await new Promise((resolve) => setTimeout(resolve, 1000))

            toast.success('Settings saved successfully')
            setCurrentProjectDialog(null, null)
          } catch (error) {
            toast.error(getErrorMessage(error))
            throw error
          }
        }}
        openConfirmDeleteProjectDialog={() => {
          setCurrentProjectDialog('confirm-delete-project', null)
        }}
      />
    </>
  )
}
