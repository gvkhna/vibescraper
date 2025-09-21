// env.ts
import debug from 'debug'
import { z } from 'zod'

import { resolveEnvironment } from './resolve-environment'

const parseSMTPPort = (value: string) => {
  const port = parseInt(value, 10)
  if (isNaN(port)) {
    throw new Error(`Invalid SMTP_PORT: "${value}" is not a number.`)
  }
  return port
}

const preprocessSMTPSecureTLS = (val: unknown) => {
  if (typeof val !== 'string') {
    return val
  }
  try {
    return JSON.parse(val) as unknown
  } catch (e) {
    throw new Error("SMTP_SECURE must be a valid boolean string ('true' or 'false').")
  }
}

const preprocessOptionalValueToTrue = (val: unknown) => {
  if (val) {
    return true
  } else {
    return false
  }
}

// Define your environment schema.
const envSchema = z.object({
  // Model configuration
  AI_DEFAULT_PROVIDER: z.string().optional(),
  AI_PROVIDER_BASE_URL: z.string().optional(),
  AI_SMALL_MODEL: z.string().optional(),
  AI_SMALL_PROVIDER: z.string().optional(),
  AI_MEDIUM_MODEL: z.string().optional(),
  AI_MEDIUM_PROVIDER: z.string().optional(),
  AI_LARGE_MODEL: z.string().optional(),
  AI_LARGE_PROVIDER: z.string().optional(),
  MOCK_LLM: z.string().optional(),

  // OpenAI-compatible configuration (for Ollama, LM Studio, etc.)
  AI_OPENAI_COMPATIBLE_API_KEY: z.string().optional(),
  AI_OPENAI_COMPATIBLE_NAME: z.string().optional(),

  STORAGE_BASE_PATH: z.string().optional(),
  STORAGE_PROVIDER: z.string().optional(),
  STORAGE_BUCKET_NAME: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_FORCE_PATH_STYLE: z.string().optional(),
  STORAGE_CACHE_CONTROL_HEADER: z.string().optional(),

  BETTER_AUTH_SECRET: z.string().min(1),
  ENCRYPT_SECRET_KEY: z.string().min(1),

  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_URL: z.string().optional(),

  DEBUG: z.string().optional(),

  SMTP_ADDRESS: z.string().min(1),
  SMTP_FROM_EMAIL: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_PORT: z.string().default('1025').transform(parseSMTPPort),
  SMTP_REPLY_TO_EMAIL: z.string().min(1),
  SMTP_SECURE_TLS: z.preprocess(preprocessSMTPSecureTLS, z.boolean()),
  SMTP_SEND_AS_EMAIL: z.string().min(1),
  SMTP_USERNAME: z.string().min(1),

  TMP_DIR: z.string().min(1)
})

export const PRIVATE_VARS = resolveEnvironment(envSchema)

if (PRIVATE_VARS.DEBUG) {
  debug.enable(PRIVATE_VARS.DEBUG)
}
