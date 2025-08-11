import {betterAuth} from 'better-auth'
import {db} from '../db/db'
import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {PRIVATE_VARS} from '@/vars.private'
import {PUBLIC_VARS} from '@/vars.public'
import * as schema from '../db/schema'
import {createAuthMiddleware} from 'better-auth/plugins'
import {sendEmail} from './email'
import {organization, username, magicLink, admin} from 'better-auth/plugins'
import {eq as sqlEq} from 'drizzle-orm'
import debug from 'debug'
import {STRINGS} from '@/strings'
import {validateUsername} from './auth-username'

const log = debug('app:auth')

// import {} from // STRIPE_SECRET_KEY
// ;('@/strings')
// import {stripeRequest} from './stripe-client'
export const auth = betterAuth({
  // plugins: [oneTap()],
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
      sendMagicLink: async ({email, token, url}, request) => {
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
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github']
    }
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // console.log('auth after hook path', ctx.path)
      const newSession = ctx.context.newSession
      // console.log('new session', newSession)
      try {
        // setup user actor
        if (newSession) {
          const user = newSession.user
          const actor = await db.query.actor.findFirst({
            where: (table, {eq}) => eq(schema.actor.userId, user.id as schema.UserId)
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

      // setup stripe customer if does not exist
      // try {
      //   if (newSession) {
      //     await createUserCustomerId(newSession.user.id as schema.UserId)
      //   }
      // } catch (error) {
      //   log('Failed to create Stripe customer:', error)
      // }
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
    // ...(PUBLIC_VARS.PUBLIC_GITHUB_CLIENT_ID && PRIVATE_VARS.GITHUB_CLIENT_SECRET
    //   ? {
    //       github: {
    //         enabled: true,
    //         clientId: PUBLIC_VARS.PUBLIC_GITHUB_CLIENT_ID,
    //         clientSecret: PRIVATE_VARS.GITHUB_CLIENT_SECRET
    //       }
    //     }
    //   : {}),
    // ...(PUBLIC_VARS.PUBLIC_GOOGLE_CLIENT_ID && PRIVATE_VARS.GOOGLE_CLIENT_SECRET
    //   ? {
    //       google: {
    //         enabled: true,
    //         clientId: PUBLIC_VARS.PUBLIC_GOOGLE_CLIENT_ID,
    //         clientSecret: PRIVATE_VARS.GOOGLE_CLIENT_SECRET
    //       }
    //     }
    //   : {})
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
