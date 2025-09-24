'use client'

import { createFileRoute } from '@tanstack/react-router'

import { BetterAuthViewTemplate } from '@/partials/webapp/better-auth-view-template'

export const Route = createFileRoute('/signup')({
  component: () => <BetterAuthViewTemplate view='SIGN_UP' />
})
