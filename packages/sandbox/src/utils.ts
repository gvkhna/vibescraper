/**
 * Explicitly fire and forget a Promise.
 * Use this when you don't want to await something, but want clarity.
 */
export function nowait(promise: Promise<unknown>, logger?: (...args: unknown[]) => void): void {
  // eslint-disable-next-line no-void
  void promise.catch((err: unknown) => {
    // Optional: log errors to Sentry or console
    const log = logger ?? ((...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.log('[nowait]', ...args)
    })
    log('Unhandled nowait error:', err)
  })
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function getRandomChar(alphabet: string): string {
  const rand = globalThis.crypto.getRandomValues(new Uint8Array(1))[0]
  return alphabet[rand % alphabet.length]
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function simpleId<T = string>(length = 6): T {
  if (length < 1) {
    throw new Error('Length must be at least 1')
  }

  const first = getRandomChar(LETTERS)
  let rest = ''
  for (let i = 1; i < length; i++) {
    rest += getRandomChar(LETTERS)
  }
  return (first + rest) as unknown as T
}
