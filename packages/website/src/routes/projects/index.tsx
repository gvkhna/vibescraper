import {createFileRoute} from '@tanstack/react-router'

import {FolderOpen} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {useState, useEffect} from 'react'
import {Separator} from '@/components/ui/separator'
import {ScrollArea} from '@/components/ui/scroll-area'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {useNavigate} from '@tanstack/react-router'
import {useShowResponseError} from '@/hooks/use-show-response-error'
import {useProjectStore} from '@/store/use-project-store'
import {useAllProjects} from '@/partials/project-editor/use-all-projects'
// import {DashboardShell} from '@/components/dashboard-shell'
import {nowait} from '@/lib/async-utils'

export function AllProjectsPage() {
  const navigate = useNavigate()
  const showResponseError = useShowResponseError()
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false)
  // const addRecentProject = useProjectStore((state) => state.recentProjectsSlice.addRecentProject)

  const {data, error, isLoading, mutate} = useAllProjects({})

  useEffect(() => {
    nowait(mutate())
  }, [mutate])

  return (
    <>
      <header
        className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear
          group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'
      >
        <div className='flex items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1 size-4' />
          <Separator
            orientation='vertical'
            className='mr-2 h-4'
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink>Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <ScrollArea>
        <div className='bg-background mx-auto min-h-screen max-w-4xl p-14'>
          <div className='grid gap-14'>
            <div className='space-y-6'>
              <div className='space-y-4'>
                <h2 className='text-foreground text-2xl font-semibold'>Projects</h2>
                <div className=''>
                  {data?.projects.map((project, index) => (
                    <div
                      key={project.publicId}
                      className='flex items-center gap-4'
                    >
                      <Button
                        variant='ghost'
                        className='w-full justify-start text-blue-400 hover:text-purple-500'
                        onClick={() => {
                          if (project.publicId) {
                            // addRecentProject({
                            //   name: project.name,
                            //   publicId: project.publicId
                            // })
                            nowait(
                              navigate({
                                to: '/project/$project-public-id',
                                params: {'project-public-id': project.publicId}
                              })
                            )
                          }
                        }}
                      >
                        <FolderOpen className='mr-2 h-4 w-4' />
                        {project.name}
                      </Button>
                      {/* <span className='text-sm text-muted-foreground'>~/github</span> */}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Walkthroughs Section */}
          </div>
        </div>
      </ScrollArea>
    </>
  )
}

export const Route = createFileRoute('/projects/')({
  component: RouteComponent
})

function RouteComponent() {
  return null
  // return (
  //   <DashboardShell>
  //     <AllProjectsPage />
  //   </DashboardShell>
  // )
}
