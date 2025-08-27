import {createFileRoute} from '@tanstack/react-router'
import {DashboardPage} from '@/partials/dashboard/page'

export const Route = createFileRoute('/app/dashboard/')({
  component: Page
})

function Page() {
  return <DashboardPage />
}
