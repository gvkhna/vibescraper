import {createAuthClient} from 'better-auth/client'
import {PUBLIC_VARS} from '@/vars.public'
import {organizationClient, usernameClient, magicLinkClient, adminClient} from 'better-auth/client/plugins'

export const AppAuthValues = ['email', 'google', 'linkedin'] as const
export type AppAuthProviders = (typeof AppAuthValues)[number]

export const authClient = createAuthClient({
  baseURL: PUBLIC_VARS.PUBLIC_HOSTNAME,
  plugins: [
    organizationClient(),
    usernameClient(),
    magicLinkClient(),
    adminClient()
    // oneTapClient({
    //   clientId: PUBLIC_GOOGLE_CLIENT_ID || '',
    //   // Optional client configuration:
    //   autoSelect: false,
    //   cancelOnTapOutside: true,
    //   context: "signin",
    //   additionalOptions: {
    //     // Any extra options for the Google initialize method
    //   },
    //   // Configure prompt behavior and exponential backoff:
    //   promptOptions: {
    //     baseDelay: 1000,   // Base delay in ms (default: 1000)
    //     maxAttempts: 5     // Maximum number of attempts before triggering onPromptNotification (default: 5)
    //   }
    // })
  ]
})
