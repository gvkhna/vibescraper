'use client'

import {createFileRoute} from '@tanstack/react-router'
import {AuthPageTemplate} from '@/partials/webapp/better-auth-ui'

export const Route = createFileRoute('/magic-link')({
  component: () => <AuthPageTemplate pathname='magic' />
})
