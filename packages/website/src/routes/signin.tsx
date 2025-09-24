'use client'

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BetterAuthViewTemplate } from '@/partials/webapp/better-auth-view-template'

const searchSchema = z.object({
  redirect: z.string().optional()
})

export const Route = createFileRoute('/signin')({
  validateSearch: searchSchema,
  component: SignInPage
})

function SignInPage() {
  const { redirect } = Route.useSearch()

  return (
    <BetterAuthViewTemplate
      view='SIGN_IN'
      redirectTo={redirect ?? '/'}
    />
  )
}
