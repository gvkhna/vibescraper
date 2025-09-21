import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthMiddleware } from 'better-auth/plugins'
import { admin, magicLink, organization, username } from 'better-auth/plugins'
import debug from 'debug'

import { STRINGS } from '@/strings'
import { PRIVATE_VARS } from '@/vars.private'
import { PUBLIC_VARS } from '@/vars.public'
import { db } from '../db/db'
import * as schema from '../db/schema'

import { validateUsername } from './auth-username'
import { sendEmail } from './email'

const log = debug('app:auth')

export const auth = betterAuth({
  appName: STRINGS.BRAND_NAME,
  baseURL: PUBLIC_VARS.PUBLIC_HOSTNAME,
  secret: PRIVATE_VARS.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: false,
    schema: {
      ...schema
    }
  }),
  plugins: [
    organization(),
    username({
      usernameValidator: async (newUsername) => {
        return await validateUsername(newUsername)
      }
    }),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        log(`Sending magic link to ${email}…`)
        await sendEmail(email, 'Your Magic Sign-In Link', 'email-magic-link', {
          public_brand_name: STRINGS.BRAND_NAME,
          magic_link_url: url
        })
      }
    }),
    admin()
  ],
  account: {
    ...(typeof PRIVATE_VARS.GITHUB_CLIENT_SECRET === 'string' ||
    typeof PRIVATE_VARS.GOOGLE_CLIENT_SECRET === 'string'
      ? {
          accountLinking: {
            enabled: true,
            trustedProviders: [
              ...(typeof PRIVATE_VARS.GOOGLE_CLIENT_SECRET === 'string' ? ['google'] : []),
              ...(typeof PRIVATE_VARS.GITHUB_CLIENT_SECRET === 'string' ? ['github'] : [])
            ]
          }
        }
      : {})
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession
      try {
        // setup user actor
        if (newSession) {
          const user = newSession.user
          const actor = await db.query.actor.findFirst({
            where: (table, { eq }) => eq(schema.actor.userId, user.id as schema.UserId)
          })
          if (!actor) {
            await db.insert(schema.actor).values({
              type: 'user',
              userId: user.id as schema.UserId
            })
          }
          // if (!actor) {
          //   return c.json({message: 'Permissions invalid'}, 400)
          // }
        }
      } catch (error) {
        log('Failed to create user actor:', error)
      }
    })
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async (data, request) => {
      log('sending reset password email...', data.url)
      await sendEmail(data.user.email, 'Reset Password', 'reset-password-instructions', {
        public_brand_name: STRINGS.BRAND_NAME,
        reset_password_url: data.url
      })
    },
    requireEmailVerification: false
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async (data, request) => {
      log('sending verification email...')
      await sendEmail(data.user.email, 'Verify Email', 'confirmation-instructions', {
        public_brand_name: STRINGS.BRAND_NAME,
        confirmation_url: data.url
      })
    }
  },
  socialProviders: {
    ...(typeof PUBLIC_VARS.PUBLIC_GITHUB_CLIENT_ID === 'string' &&
    typeof PRIVATE_VARS.GITHUB_CLIENT_SECRET === 'string'
      ? {
          github: {
            enabled: true,
            clientId: PUBLIC_VARS.PUBLIC_GITHUB_CLIENT_ID,
            clientSecret: PRIVATE_VARS.GITHUB_CLIENT_SECRET
          }
        }
      : {}),
    ...(typeof PUBLIC_VARS.PUBLIC_GOOGLE_CLIENT_ID === 'string' &&
    typeof PRIVATE_VARS.GOOGLE_CLIENT_SECRET === 'string'
      ? {
          google: {
            enabled: true,
            clientId: PUBLIC_VARS.PUBLIC_GOOGLE_CLIENT_ID,
            clientSecret: PRIVATE_VARS.GOOGLE_CLIENT_SECRET
          }
        }
      : {})
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async (data, request) => {
        log('sending change email verification ')
        await sendEmail(data.user.email, 'Change Email Requested', 'new-email-instructions', {
          public_brand_name: STRINGS.BRAND_NAME,
          confirmation_url: data.url
        })
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 180, // 180 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated),
    cookieCache: {
      maxAge: 60 * 60 * 24 * 180,
      enabled: true
    }
  },
  advanced: {
    defaultCookieAttributes: {
      path: '/',
      httpOnly: true,
      secure: PUBLIC_VARS.PUBLIC_HTTPS_PROTO,
      sameSite: 'lax'
    },
    database: {
      generateId: false
    }
  },
  logger: {
    disabled: false,
    level: 'debug'
  }
})
