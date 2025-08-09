/* eslint-disable no-restricted-globals */
import {z} from 'zod'
import debug from 'debug'

const log = debug('app:siteconfig')

export function resolveEnvironment<T extends z.ZodType>(schema: T): z.infer<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const global = globalThis as any
  // Temporarily collect env in a JS object
  const combinedEnv: Record<string, unknown> = {}

  // If running in a Vite-like environment (Astro, etc.) that provides `import.meta.env`
  // eslint-disable-next-line
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const [key, value] of Object.entries(import.meta.env)) {
      // If `value` is already a string or undefined, store it
      // (Depending on your environment, `import.meta.env` could be typed as string | boolean, etc.)
      if (typeof value === 'string' || typeof value === 'undefined') {
        combinedEnv[key] = value
      } else {
        // Convert it to string if needed
        combinedEnv[key] = String(value)
      }
    }
  }

  // If running in Deno environment (with the right permissions)
  if (typeof global.Deno !== 'undefined' && typeof global.Deno.env !== 'undefined') {
    // For each key in Deno.env, if we don't already have a value from import.meta.env, we set it
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
    for (const [key, value] of Object.entries(global.Deno.env.toObject())) {
      combinedEnv[key] ??= value
    }
  }

  // If running in Node.js or Bun environment
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof process !== 'undefined' && process.env) {
    // For each key in process.env, if we don't already have a value, we set it
    for (const [key, value] of Object.entries(process.env)) {
      combinedEnv[key] ??= value
    }
  }

  // Now validate against the provided Zod schema.
  // This throws if any required field is missing or if a field is invalid.
  const result = schema.safeParse(combinedEnv)
  if (!result.success) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    throw new Error(`Environment validation error:\n${result.error} Found: ${JSON.stringify(combinedEnv)}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return result.data as any
}
