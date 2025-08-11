'use client'

import {createFileRoute} from '@tanstack/react-router'
import {AuthPageTemplate} from '@/partials/app/better-auth-ui'

export const Route = createFileRoute('/forgot-password')({
  component: () => <AuthPageTemplate pathname='forgot' />
})