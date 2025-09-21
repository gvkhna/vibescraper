'use client'

import { AuthView } from '@daveyplate/better-auth-ui'

interface AuthPageTemplateProps {
  pathname: string
  redirectTo?: string
}

const authConfig = {
  signin: {
    title: 'Welcome to Vibescraper',
    subtitle: 'Sign in to continue to your dashboard.',
    redirectTo: '/'
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Join Vibescraper to start vibe scraping.',
    redirectTo: '/'
  },
  signout: {
    title: 'Sign out',
    subtitle: 'Are you sure you want to sign out?',
    redirectTo: '/'
  },
  forgot: {
    title: 'Forgot password',
    subtitle: 'Enter your email to receive a reset link.',
    redirectTo: '/signin'
  },
  reset: {
    title: 'Reset password',
    subtitle: 'Enter your new password below.',
    redirectTo: '/signin'
  },
  magic: {
    title: 'Magic link sign in',
    subtitle: 'Check your email for the magic link.',
    redirectTo: '/'
  }
}

export function AuthPageTemplate({ pathname, redirectTo }: AuthPageTemplateProps) {
  const config = authConfig[pathname as keyof typeof authConfig]

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#0A0A0B] p-4'>
      <div className='w-full max-w-sm'>
        <AuthView
          pathname={pathname}
          redirectTo={redirectTo || config.redirectTo}
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
