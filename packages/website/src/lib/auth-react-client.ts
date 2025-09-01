import {createAuthClient} from 'better-auth/react'
import {organizationClient, usernameClient, magicLinkClient, adminClient} from 'better-auth/client/plugins'

export const authReactClient = createAuthClient({
  baseURL: `${globalThis.window.location.protocol}//${globalThis.window.location.host}`,
  plugins: [organizationClient(), usernameClient(), magicLinkClient(), adminClient()]
})
