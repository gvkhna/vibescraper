import {createFileRoute} from '@tanstack/react-router'
import DetailApp from '@/partials/detail/detail-app'

export const Route = createFileRoute('/detail')({
  component: Page
})

function Page() {
  return <DetailApp />
}