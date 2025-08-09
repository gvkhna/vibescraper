import {DashboardLayout} from '@/partials/dashboard/dashboard-layout'
// import {WelcomePage} from '@/partials/welcome/welcome-screen'
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/main-index')({
  component: Page
})

function Page() {
  return <DashboardLayout>{/* <WelcomePage /> */}</DashboardLayout>
}
