import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/')({
  beforeLoad: () => {
    return redirect({ to: '/' })
  }
})
