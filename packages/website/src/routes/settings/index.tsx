import {DashboardLayout} from '@/partials/dashboard/dashboard-layout'
// import {ScrollArea} from '@radix-ui/react-scroll-area'
import {createFileRoute} from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import debug from 'debug'
import {
  ChangeEmailCard,
  ChangePasswordCard,
  DeleteAccountCard,
  SessionsCard,
  AuthUIProvider,
  UpdateAvatarCard,
  UpdateUsernameCard,
  ProvidersCard,
  UpdateNameCard
} from '@daveyplate/better-auth-ui'

const log = debug('app:account-settings')

export const Route = createFileRoute('/settings/')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <DashboardLayout>
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
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {/* <ScrollArea> */}
        <div className='m-12 mx-auto flex-1 px-6 lg:max-w-2xl'>
          <div className='space-y-6'>
            <div className='m-12 mx-auto flex-1 px-6 lg:max-w-2xl'>
              <div className='space-y-6'>
                <ChangeEmailCard />
                <UpdateAvatarCard />
                <UpdateNameCard />
                <UpdateUsernameCard />
                <ProvidersCard />
                <ChangePasswordCard />
                <SessionsCard />
                <DeleteAccountCard />
              </div>
            </div>
          </div>
        </div>
        {/* </ScrollArea> */}
      </>
    </DashboardLayout>
  )
}
