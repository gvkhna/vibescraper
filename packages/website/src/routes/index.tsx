import {createFileRoute} from '@tanstack/react-router'
import {VibecodingLandingPage} from '@/partials/vibecoding/landing-page'

export const Route = createFileRoute('/')({
  component: Page
})

function Page() {
  return <VibecodingLandingPage />
}
