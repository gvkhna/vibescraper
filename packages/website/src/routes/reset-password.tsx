'use client'

import { createFileRoute } from '@tanstack/react-router'

import { BetterAuthViewTemplate } from '@/partials/webapp/better-auth-view-template'

export const Route = createFileRoute('/reset-password')({
  component: () => <BetterAuthViewTemplate view='RESET_PASSWORD' />
})
