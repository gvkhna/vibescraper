import {createAuthClient} from 'better-auth/client'
import {PUBLIC_VARS} from '@/vars.public'
import {organizationClient, usernameClient, magicLinkClient, adminClient} from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: PUBLIC_VARS.PUBLIC_HOSTNAME,
  plugins: [organizationClient(), usernameClient(), magicLinkClient(), adminClient()]
})
