// type for error with cause.msg
interface CauseMsgError extends Error {
  cause: { msg: string }
}

// type for error with loc info
interface LocError extends CauseMsgError {
  loc: {
    start: {
      line: number
      column: number
    }
  }
}

// type guard #1: has e.cause.msg:string
function hasCauseMsg(e: unknown): e is CauseMsgError {
  return (
    e instanceof Error &&
    typeof e.cause === 'object' &&
    e.cause !== null &&
    'msg' in e.cause &&
    typeof e.cause.msg === 'string'
  )
}

// type guard #2: has e.loc.start.line/column:number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasLoc(e: any): e is LocError {
  return typeof e.loc?.start?.line === 'number' && typeof e.loc.start.column === 'number'
}

// helper: truncate with ellipsis
function truncate(str: string, max = 250): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

// main function
export function formatPrettierError(e: unknown): Error {
  if (hasCauseMsg(e)) {
    let message = e.cause.msg

    if (hasLoc(e)) {
      message += ` (${e.loc.start.line}:${e.loc.start.column})`
    }

    return new Error(message)
  }

  // fallback: try to extract message safely
  let rawMessage: string

  if (e instanceof Error && typeof e.message === 'string') {
    rawMessage = e.message
  } else if (typeof e === 'string') {
    rawMessage = e
  } else {
    try {
      rawMessage = JSON.stringify(e)
    } catch {
      rawMessage = String(e)
    }
  }

  return new Error(truncate(rawMessage))
}
