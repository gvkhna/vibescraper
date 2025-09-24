'use client'

import { AuthView, type AuthViewPaths, type AuthViewProps } from '@daveyplate/better-auth-ui'

export interface BetterAuthViewTemplateProps {
  view: Exclude<AuthViewProps['view'], undefined>
  redirectTo?: string
}

interface AuthPathConfig {
  title: string
  subtitle: string
  redirectTo: string
}

const authConfig = {
  SIGN_IN: {
    title: 'Welcome to Vibescraper',
    subtitle: 'Sign in to continue to your dashboard.',
    redirectTo: '/'
  },
  SIGN_UP: {
    title: 'Create your account',
    subtitle: 'Join Vibescraper to start vibe scraping.',
    redirectTo: '/'
  },
  SIGN_OUT: {
    title: 'Sign out',
    subtitle: 'Are you sure you want to sign out?',
    redirectTo: '/'
  },
  FORGOT_PASSWORD: {
    title: 'Forgot password',
    subtitle: 'Enter your email to receive a reset link.',
    redirectTo: '/signin'
  },
  RESET_PASSWORD: {
    title: 'Reset password',
    subtitle: 'Enter your new password below.',
    redirectTo: '/signin'
  },
  MAGIC_LINK: {
    title: 'Magic link sign in',
    subtitle: 'Check your email for the magic link.',
    redirectTo: '/'
  }
} satisfies Partial<Record<BetterAuthViewTemplateProps['view'], AuthPathConfig>>

export function BetterAuthViewTemplate({ view, redirectTo }: BetterAuthViewTemplateProps) {
  const config = authConfig[view as keyof typeof authConfig]

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#0A0A0B] p-4'>
      <div className='w-full max-w-sm'>
        <AuthView
          view={view}
          redirectTo={redirectTo ?? config.redirectTo}
          cardHeader={
            <div className='text-center'>
              <h1 className='mb-2 text-2xl font-bold text-white'>{config.title}</h1>
              <p className='text-sm text-white/60'>{config.subtitle}</p>
            </div>
          }
          classNames={{
            base: 'bg-[#151517] border border-white/10',
            title: 'text-white',
            footerLink: 'text-white/70 hover:text-white'
          }}
        />
      </div>
    </div>
  )
}
