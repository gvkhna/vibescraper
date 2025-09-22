import debug from 'debug'

const log = debug('app:async')

/**
 * Explicitly fire and forget a Promise.
 * Use this when you don't want to await something, but want clarity.
 */
export function nowait(promise: Promise<unknown>): void {
  // eslint-disable-next-line no-void
  void promise.catch((err: unknown) => {
    // Optional: log errors to Sentry or console
    log('Unhandled nowait error:', err)
  })
}

export function asyncTimeout(timeoutMs?: number) {
  const wait = timeoutMs ?? 0
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, wait)
  })
}

/**
 * Run some work with two UI yields:
 *  1. Yield to the event-loop before `work` starts (macrotask + microtask).
 *  2. Yield again when `work` finishes.
 *
 * If you just want the yields and no work, call `await uiYield()` with no args.
 */
export async function uiEventLoopFlush(
  delay = 250 // ms - tweak as needed
): Promise<void> {
  // ---- first yield: let the browser paint ---------------------------------
  await new Promise<void>((res) => setTimeout(res, delay))
  await new Promise<void>((res) => {
    queueMicrotask(res)
  })
}

export async function asyncForEach<T>(
  array: T[],
  callback: (value: T, index?: number, array_?: T[]) => Promise<void>
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export async function asyncFor(length: number, callback: (index: number) => Promise<void>) {
  for (let index = 0; index < length; index++) {
    await callback(index)
  }
}

/**
 * Retry an async function with exponential back-off.
 *
 * ```ts
 * const data = await asyncRetry(() => fetchJson(url), {
 *   retries: 4,
 *   minDelay: 1_000,      // start at 1 s
 *   factor: 2,            // 1 s → 2 s → 4 s …
 *   jitter: 0.3,          // add ±30 % randomness
 *   onRetry: (err, ctx) => console.warn('retry', ctx.attempt, '→', err),
 * });
 * ```
 */
export async function asyncRetry<T>(
  fn: () => Promise<T>,
  {
    /** Total attempts **including** the first call (default 5) */
    retries = 5,
    /** First delay in ms before the **second** attempt (default 250ms) */
    minDelay = 250,
    /** Multiplier applied to the delay after every failure (default 2) */
    factor = 2,
    /**
     * Randomise the delay by ± `delay * jitter`. 0 ＝ disabled.
     * Helps to spread load when many clients retry simultaneously.
     */
    jitter = 0,
    /** Hook called after every caught error, before waiting. */
    onRetry
  }: {
    retries?: number
    minDelay?: number
    factor?: number
    jitter?: number
    onRetry?: (error: unknown, ctx: { attempt: number; delay: number }) => void
  } = {}
): Promise<T> {
  if (retries < 1) {
    throw new RangeError('retries must be ≥ 1')
  }

  let attempt = 0
  let delay = minDelay

  while (true) {
    try {
      attempt += 1
      return await fn() // success
    } catch (err) {
      if (attempt >= retries) {
        throw err
      } // out of attempts

      // compute next delay
      const jitterOffset = delay * jitter * (Math.random() * 2 - 1) // ±
      const wait = Math.max(0, delay + jitterOffset)

      onRetry?.(err, { attempt, delay: wait })

      await new Promise((res) => setTimeout(res, wait))
      delay *= factor // exponential back-off
    }
  }
}

/**
 * Retry a promise-returning function with exponential backoff.
 * @deprecated Implement alternative
 */
export function promiseRetry<T>(
  p: () => Promise<T>,
  maxRetries?: number,
  wait = 1000,
  quiet = false
): Promise<T> {
  const MAX_RETRIES = maxRetries ?? 5
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return promiseWhile((counter) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>((resolve, reject) => {
      if (counter >= MAX_RETRIES) {
        // eslint-disable-next-line no-undefined, @typescript-eslint/no-confusing-void-expression
        return resolve(undefined)
      }
      try {
        p()
          .then((resp) => {
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            return resolve(resp)
          })
          .catch((err: unknown) => {
            if (!quiet) {
              // eslint-disable-next-line no-console
              console.error('PROMISE RETRY promise-err: ', err)
            }
            const backoff = (counter + 2) * (counter + 2) * wait
            if (!quiet) {
              // eslint-disable-next-line no-console
              console.error('PROMISE RETRY: backing off for ', backoff)
            }
            setTimeout(() => {
              // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors, @typescript-eslint/no-confusing-void-expression
              return reject()
            }, backoff)
          })
      } catch (e) {
        if (!quiet) {
          // eslint-disable-next-line no-console
          console.error('PROMISE RETRY catch-err: ', e)
        }
        const backoff = (counter + 2) * (counter + 2) * wait
        if (!quiet) {
          // eslint-disable-next-line no-console
          console.error('PROMISE RETRY: backing off for ', backoff)
        }
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors, @typescript-eslint/no-confusing-void-expression
          return reject()
        }, backoff)
      }
    })
  })
}

/**
 * promise fn
 * @deprecated Implement alternative
 */
export async function promiseForEachAll<T, O>(
  array: T[],
  callback: (value: T, index?: number) => Promise<O>
) {
  const p: Promise<O>[] = []
  const len = array.length
  for (let index = 0; index < len; index++) {
    const item = array[index]
    p.push(callback(item, index))
  }
  const output = await Promise.allSettled(p)
  return output
}

/**
 * promise fn
 * @deprecated Implement alternative
 */
export function promiseWhile<T>(
  promiseConstructor: (counter: number, previousResult?: Promise<T>) => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    let counter = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = (previousResult?: any) => {
      const p = promiseConstructor(counter, previousResult as Promise<T>)
      counter++
      if (p instanceof Promise) {
        p.then(resolve).catch(run)
      } else {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(p)
      }
    }
    run()
  })
}

/**
 * promise fn
 * @deprecated Implement alternative
 */
export function promiseForeach<T>(
  array: T[],
  each: (index: number, previousResult?: Promise<T>) => Promise<T>
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    let counter = 0
    if (array.length === 0) {
      // eslint-disable-next-line no-undefined
      resolve(undefined)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = (previousResult?: any) => {
      if (counter >= array.length) {
        // eslint-disable-next-line no-undefined
        resolve(undefined)
        return
      }
      const p = each(counter, previousResult as Promise<T> | undefined)
      counter++
      // console.log('p: ', p)
      if (p instanceof Promise) {
        p.then(resolve).catch(run)
      } else {
        // eslint-disable-next-line no-console
        console.log('unknown promise: ', p)
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(p)
      }
    }
    run()
  })
}
