/**
 * Safely extract a human‐readable message from any error-like value.
 * @param error The thrown value (could be string, Error, object, etc.)
 * @param fallback A default message if nothing else can be found
 */
export function getErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
  // 1. Native Error (and subclasses like TypeError, RangeError, etc.)
  if (error instanceof Error) {
    return error.message
  }

  // 2. String or Stringable primitives
  if (typeof error === 'string') {
    return error
  }
  if (typeof error === 'number' || typeof error === 'boolean') {
    return String(error)
  }

  // 4. Anything else (functions, symbols, etc.)
  return fallback
}
