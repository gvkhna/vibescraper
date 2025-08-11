// env.ts
import {resolveEnvironment} from './resolve-environment'
import {z} from 'zod'
import debug from 'debug'

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
  AI_PREFERRED_PROVIDER: z.string().optional(),
  AI_PROVIDER_BASE_URL: z.string().optional(),
  AI_SMALL_MODEL: z.string().optional(),
  AI_MEDIUM_MODEL: z.string().optional(),
  AI_LARGE_MODEL: z.string().optional(),

  // OpenAI-compatible configuration (for Ollama, LM Studio, etc.)
  AI_OPENAI_COMPATIBLE_API_KEY: z.string().optional(),
  AI_OPENAI_COMPATIBLE_NAME: z.string().optional(),

  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_FORCE_PATH_STYLE: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1),
  // CF_R2_TOKEN: z.string().optional(),
  CRYPT_SECRET_KEY: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  DEBUG_DATABASE: z.string().optional(),
  DEBUG: z.string().optional(),
  MOCK_LLM: z.string().optional(),
  SMTP_ADDRESS: z.string().min(1),
  SMTP_FROM_EMAIL: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_PORT: z.string().default('1025').transform(parseSMTPPort),
  SMTP_REPLY_TO_EMAIL: z.string().min(1),
  SMTP_SECURE_TLS: z.preprocess(preprocessSMTPSecureTLS, z.boolean()),
  SMTP_SEND_AS_EMAIL: z.string().min(1),
  SMTP_USERNAME: z.string().min(1),
  STORAGE_PROVIDER: z.string().optional(),
  TMP_DIR: z.string().min(1)
})

export const PRIVATE_VARS = resolveEnvironment(envSchema)

if (PRIVATE_VARS.DEBUG) {
  debug.enable(PRIVATE_VARS.DEBUG)
}
