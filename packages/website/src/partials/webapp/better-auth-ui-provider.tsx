import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { useNavigate, useRouter } from '@tanstack/react-router'
import debug from 'debug'
import type { ReactNode } from 'react'

import { Link } from '@/components/link'
import api from '@/lib/api-client'
import { apiFetchClient } from '@/lib/api-fetch-client'
import { nowait } from '@/lib/async-utils'
import { authReactClient } from '@/lib/auth-react-client'

import { useEnvContext } from './env-context'

const log = debug('app:auth-setup')

export function BetterAuthUIProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const router = useRouter()
  const { publicEnv } = useEnvContext()

  return (
    <AuthUIProvider
      authClient={authReactClient}
      navigate={(path) => {
        nowait(navigate({ to: path }))
      }}
      replace={(path) => {
        nowait(navigate({ to: path, replace: true }))
      }}
      onSessionChange={() => router.invalidate()}
      magicLink={true}
      Link={Link}
      basePath='/'
      viewPaths={{
        SIGN_IN: 'signin',
        SIGN_OUT: 'signout',
        SIGN_UP: 'signup',
        FORGOT_PASSWORD: 'forgot-password',
        RESET_PASSWORD: 'reset-password',
        MAGIC_LINK: 'magic-link'
      }}
      account={{
        basePath: '/app',
        viewPaths: {
          SETTINGS: 'settings'
        }
      }}
      social={{
        providers: [
          ...(typeof publicEnv.PUBLIC_GOOGLE_CLIENT_ID === 'string' ? ['google'] : []),
          ...(typeof publicEnv.PUBLIC_GITHUB_CLIENT_ID === 'string' ? ['github'] : [])
        ]
      }}
      avatar={{
        size: 256,
        extension: 'webp',
        upload: async (file: File) => {
          const formData = new FormData()
          formData.append('avatar', file)
          const res = await apiFetchClient.fetch(api.account.uploadAvatar.$url().toString(), {
            method: 'POST',
            body: formData
          })
          if (res.ok) {
            const json: unknown = await res.json()
            if (json && typeof json === 'object' && 'data' in json) {
              const data = json.data
              if (data && typeof data === 'object' && 'url' in data) {
                const url = data.url
                if (url && typeof url === 'string') {
                  return url
                } else {
                  log('url not valid data', json)
                  return null
                }
              } else {
                log('data not valid data', json)
                return null
              }
            } else {
              log('json not valid data', json)
              return null
            }
          } else {
            const json = await res.json()
            log('response not acceptable', json, res.status)
            return null
          }
        }
      }}
    >
      {children}
    </AuthUIProvider>
  )
}
