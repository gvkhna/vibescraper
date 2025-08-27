import {createAuthClient} from 'better-auth/react'
import {PUBLIC_VARS} from '@/vars.public'
import {organizationClient, usernameClient, magicLinkClient, adminClient} from 'better-auth/client/plugins'
export const authReactClient = createAuthClient({
  baseURL: PUBLIC_VARS.PUBLIC_HOSTNAME,
  plugins: [organizationClient(), usernameClient(), magicLinkClient(), adminClient()]
})
