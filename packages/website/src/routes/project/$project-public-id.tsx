import {createFileRoute} from '@tanstack/react-router'
// import {AppSidebarResizable} from '@components/sidebar/app-sidebar-resizable'
import {useEffect} from 'react'
// import {
//   NavigationPane,
//   NavigationPaneProvider,
//   NavigationPaneInset
// } from '@components/navigation-pane/navigation-pane'
import {useProjectStore} from '@/store/use-project-store'
// import {EditorTabs} from '@partials/project-editor/editor-tabs'
import type {ProjectPublicId} from '@/db/schema'
import {ProjectDialogs} from '@/partials/dialogs/project-dialogs'
import {nowait} from '@/lib/async-utils'

function Page() {
  const routeParams = Route.useParams()
  const projectPublicId = routeParams['project-public-id']

  const loadProject = useProjectStore((state) => state.projectSlice.loadProject)

  useEffect(() => {
    nowait(loadProject(projectPublicId as ProjectPublicId))
  }, [projectPublicId, loadProject])

  return (
    <NavigationPaneProvider>
      <NavigationPane />
      <ProjectDialogs />
      <NavigationPaneInset>
        <AppSidebarResizable>
          <div className='flex h-full flex-1 flex-col'>
            <EditorTabs />
          </div>
        </AppSidebarResizable>
      </NavigationPaneInset>
    </NavigationPaneProvider>
  )
}

export const Route = createFileRoute('/project/$project-public-id')({
  component: Page
})
