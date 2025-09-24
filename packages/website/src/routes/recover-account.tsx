'use client'

import { createFileRoute } from '@tanstack/react-router'

import { BetterAuthViewTemplate } from '@/partials/webapp/better-auth-view-template'

export const Route = createFileRoute('/recover-account')({
  component: () => <BetterAuthViewTemplate view='RECOVER_ACCOUNT' />
})
