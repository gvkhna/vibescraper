'use client'

import { createFileRoute } from '@tanstack/react-router'

import { BetterAuthViewTemplate } from '@/partials/webapp/better-auth-view-template'

export const Route = createFileRoute('/accept-invite')({
  component: () => <BetterAuthViewTemplate view='ACCEPT_INVITATION' />
})
