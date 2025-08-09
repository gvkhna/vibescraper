import {createFileRoute} from '@tanstack/react-router'
import DashboardApp from '@/partials/dashboard/dashboard-app'

export const Route = createFileRoute('/')({
  component: Page
})

function Page() {
  return <DashboardApp />
}