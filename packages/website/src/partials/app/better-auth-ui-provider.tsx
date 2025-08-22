import {AuthUIProvider} from '@daveyplate/better-auth-ui'
import {authReactClient} from '@/lib/auth-react-client'
import {type ReactNode} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {Link} from '@/components/link'
import {nowait} from '@/lib/async-utils'
import {apiFetchClient} from '@/lib/api-fetch-client'
import api from '@/lib/api-client'
import debug from 'debug'

const log = debug('app:auth-setup')

export function BetterAuthUIProvider({children}: {children: ReactNode}) {
  const navigate = useNavigate()

  return (
    <AuthUIProvider
      authClient={authReactClient}
      navigate={(path) => {
        nowait(navigate({to: path}))
      }}
      magicLink={true}
      Link={Link}
      viewPaths={{
        SIGN_IN: 'signin',
        SIGN_OUT: 'signout',
        SIGN_UP: 'signup',
        FORGOT_PASSWORD: 'forgot-password',
        RESET_PASSWORD: 'reset-password',
        MAGIC_LINK: 'magic-link'
        // SETTINGS: 'settings'
      }}
      social={{
        providers: ['google', 'github']
      }}
      // settings={{
      //   url: '/app/settings'
      // }}
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
