'use client'

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { AuthPageTemplate } from '@/partials/webapp/better-auth-ui'

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
    <AuthPageTemplate
      pathname='signin'
      redirectTo={redirect ?? '/'}
    />
  )
}
