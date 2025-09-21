import { adminClient, magicLinkClient, organizationClient, usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authReactClient = createAuthClient({
  baseURL: `${globalThis.window.location.protocol}//${globalThis.window.location.host}`,
  plugins: [organizationClient(), usernameClient(), magicLinkClient(), adminClient()]
})
