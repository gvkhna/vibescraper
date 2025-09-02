// env.ts
import {resolveEnvironment} from './resolve-environment'
import {z} from 'zod'
import debug from 'debug'

const log = debug('app:env')

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PUBLIC_DEBUG: z.string().optional(),
    PUBLIC_HOSTNAME: z.string(),
    PUBLIC_GITHUB_CLIENT_ID: z.string().optional(),
    PUBLIC_GOOGLE_CLIENT_ID: z.string().optional()
  })
  .transform((parsed) => {
    // Force DEV, PROD, TEST based on NODE_ENV:
    const dev = parsed.NODE_ENV === 'development'
    const prod = parsed.NODE_ENV === 'production'
    const test = parsed.NODE_ENV === 'test'

    const PUBLIC_HTTPS_PROTO = parsed.PUBLIC_HOSTNAME
      ? new URL(parsed.PUBLIC_HOSTNAME).protocol === 'https:'
      : false

    return {
      ...parsed,
      DEV: dev,
      PROD: prod,
      TEST: test,
      PUBLIC_HTTPS_PROTO
    }
  })

export const PUBLIC_VARS = resolveEnvironment(envSchema)

log(`Env - PROD(${PUBLIC_VARS.PROD}) SECURE(${PUBLIC_VARS.PUBLIC_HTTPS_PROTO})`)
log(`Env - Hostname(${PUBLIC_VARS.PUBLIC_HOSTNAME})`)
