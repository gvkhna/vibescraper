import {createAuthClient} from 'better-auth/client'
import {organizationClient, usernameClient, magicLinkClient, adminClient} from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: `${globalThis.window.location.protocol}//${globalThis.window.location.host}`,
  plugins: [organizationClient(), usernameClient(), magicLinkClient(), adminClient()]
})
