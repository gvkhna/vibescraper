import { createAuthClient } from 'better-auth/client'
import { adminClient, magicLinkClient, organizationClient, usernameClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: `${globalThis.window.location.protocol}//${globalThis.window.location.host}`,
  plugins: [organizationClient(), usernameClient(), magicLinkClient(), adminClient()]
})
