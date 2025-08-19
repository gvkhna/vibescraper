await (async function () {
  const envInput = import.meta.env ?? {}

  const {Console} = await import('node:console')
  const util = await import('node:util')
  const {Writable, PassThrough} = await import('node:stream')
  const {hrtime} = await import('node:process')

  const _originalClose = globalThis.self.close.bind(self)

  const _originalPostMessage = globalThis.postMessage.bind(globalThis)
  delete globalThis.postMessage

  globalThis.__SEND_RESULT__ = function sendResult(result) {
    _originalPostMessage({
      type: 'result',
      kind: 'info',
      payload: JSON.stringify(result)
    })
  }

  globalThis.self.close = function sandboxedClose() {
    // e.g. let the parent know
    try {
      _originalPostMessage({
        type: 'complete',
        kind: 'info',
        payload: '[sandbox] Worker closing...'
      })
    } catch (err) {
      console.warn('[sandbox] Could not post message before closing:', err)
    }

    // 3) Finally do the real close
    _originalClose()
  }

  Object.freeze(globalThis.self.close)

  // -----------------------------
  // Create Deno.env stub
  // -----------------------------
  function createDenoEnvStub(input) {
    return {
      get(key) {
        return input[key]
      },
      has(key) {
        return input[key] !== undefined
      },
      toObject() {
        return {...input}
      },
      set(_key, _value) {},
      delete(_key) {}
    }
  }
  Object.freeze(createDenoEnvStub)

  // -----------------------------
  // Patch Deno.env using defineProperty
  // -----------------------------
  // try {
  Object.defineProperty(Deno, 'env', {
    value: createDenoEnvStub(envInput),
    writable: false,
    enumerable: true,
    configurable: false
  })
  Object.freeze(Deno.env)
  // } catch (err) {
  //   console.warn('[sandbox] Could not redefine Deno.env:', err.message);
  // }

  // -----------------------------
  // Setup console.log
  // -----------------------------
  // By default, Node's Console object will send:
  // .log(), .info(), .debug() -> stdout
  // .warn(), .error() -> stderr

  function createNodeWritable(kind) {
    return new Writable({
      write(chunk, encoding, callback) {
        try {
          // chunk is a Uint8Array, use String() to coerce to string
          _originalPostMessage({
            type: 'log',
            kind,
            payload: String(chunk).trimEnd()
          })
        } catch (err) {
          // If you want to log or handle errors here
          // console?.warn?.('Failed to post message:', err);
        }
        callback()
      }
    })
  }
  Object.freeze(createNodeWritable)

  const logStream = createNodeWritable('log')
  const infoStream = createNodeWritable('info')
  const warnStream = createNodeWritable('warn')
  const errorStream = createNodeWritable('error')
  const debugStream = createNodeWritable('debug')

  // We'll use a PassThrough for the streams we don't care about.
  const devNull = new PassThrough()
  devNull.resume()

  const infoConsole = new Console({
    stdout: infoStream, // received info calls
    stderr: devNull,
    colorMode: false
  })

  const warnConsole = new Console({
    stdout: devNull,
    stderr: warnStream, // receives error calls
    colorMode: false
  })

  const debugConsole = new Console({
    stdout: debugStream,
    stderr: devNull,
    colorMode: false
  })

  class SandboxConsole extends Console {
    nativeConsole
    constructor(options) {
      // Pass the options directly to the super constructor.
      super(options)
      this.nativeConsole = new Console({stdout: logStream, stderr: errorStream, colorMode: false})
    }

    group(...args) {
      this.nativeConsole.group(...args)
    }
    groupCollapsed(...args) {
      this.nativeConsole.groupCollapsed(...args)
    }
    groupEnd(...args) {
      this.nativeConsole.groupEnd(...args)
    }

    log(...args) {
      this.nativeConsole.log(...args)
    }

    error(...args) {
      this.nativeConsole.error(...args)
    }

    info(...args) {
      infoConsole.info(...args)
    }

    warn(...args) {
      warnConsole.warn(...args)
    }

    clear() {}

    debug(...args) {
      debugConsole.debug(...args)
    }
  }

  // Replace global console
  const sandboxConsole = new SandboxConsole({stdout: logStream, stderr: errorStream, colorMode: false})
  globalThis.console = sandboxConsole
  Object.freeze(globalThis.console)
  Object.freeze(SandboxConsole.prototype)

  // -----------------------------
  // Shim process with minimal compatibility
  // -----------------------------
  delete globalThis.process
  if (!globalThis.process) {
    globalThis.process = {}
  }

  function hrtimeShim(previousTimestamp) {
    // Get the current time in milliseconds (ms).
    // performance.now() returns a high-resolution timestamp relative to an arbitrary epoch.
    const ms = performance.now()
    // Convert to seconds and nanoseconds.
    const seconds = Math.floor(ms / 1000)
    // (ms - seconds*1000) gives the remaining milliseconds,
    // multiplied by 1e6 gives nanoseconds.
    const nanoseconds = Math.floor((ms - seconds * 1000) * 1e6)

    if (previousTimestamp) {
      // Calculate the difference from the given previous timestamp.
      let diffSeconds = seconds - previousTimestamp[0]
      let diffNanoseconds = nanoseconds - previousTimestamp[1]
      if (diffNanoseconds < 0) {
        diffSeconds--
        diffNanoseconds += 1e9
      }
      return [diffSeconds, diffNanoseconds]
    }
    return [seconds, nanoseconds]
  }

  // Shim process.hrtime.bigint
  hrtimeShim.bigint = function () {
    // Convert performance.now() from ms to nanoseconds.
    // Use Math.floor to get an integer, then convert to BigInt.
    const ms = performance.now()
    const ns = Math.floor(ms * 1e6)
    return BigInt(ns)
  }

  Object.freeze(hrtimeShim)
  Object.freeze(hrtimeShim.bigint)

  // A simple event registry on the process object.
  const processEvents = {}

  Object.assign(globalThis.process, {
    env: {...envInput},
    hrtime: hrtimeShim,
    cwd: () => {
      try {
        const path = new URL('.', location.href).pathname
        return decodeURIComponent(path)
      } catch {
        return '/'
      }
    },
    exit: (code = 0) => {
      //console.log(`[sandbox] process.exit(${code})`);
      globalThis.self.close()
    },
    abort: () => {
      //console.log(`[sandbox] process.exit(${code})`);
      globalThis.self.close()
    },
    kill: (pid, signal) => {
      //console.log(`[sandbox] process.exit(${code})`);
      globalThis.self.close()
    },
    versions: {
      node: '20.0.0-sandbox',
      deno: '2.2.6-sandbox'
    },
    platform: 'sandbox',
    // Add an "on" method to register listeners.
    on: (event, listener) => {
      // console.log('on event', event);
      if (!processEvents[event]) {
        processEvents[event] = []
      }
      processEvents[event].push(listener)
    },

    // Add an "off" method to remove listeners.
    off: (event, listener) => {
      // console.log('off', event);
      if (!processEvents[event]) {
        return
      }
      const idx = processEvents[event].indexOf(listener)
      if (idx !== -1) {
        processEvents[event].splice(idx, 1)
      }
    },

    // Add an "emit" method to fire events.
    emit: (event, ...args) => {
      // console.log('emit', event);
      if (!processEvents[event]) {
        return
      }
      // Iterate over a copy of the list to prevent mutation issues.
      for (const listener of [...processEvents[event]]) {
        try {
          listener(...args)
        } catch (listenerErr) {
          // If a listener throws, log it - or handle as appropriate.
          console.error('Error in process event listener for', event, listenerErr)
        }
      }
    }
  })

  function serializeError(err) {
    // console.log('serialize error', err);
    if (err instanceof Error) {
      return {
        name: err.name,
        message: err.message,
        stack: `Uncaught ${err.stack}`
      }
    }
    return {message: String(err)}
  }
  Object.freeze(serializeError)

  // -----------------------------
  // Setup error handling
  // -----------------------------
  globalThis.process.on('uncaughtException', (err) => {
    const serializedError = serializeError(err)
    _originalPostMessage({
      type: 'exception',
      kind: 'exception',
      payload: serializedError
    })
  })

  self.addEventListener('unhandledrejection', (ev) => {
    ev.preventDefault() // prevent the console warning
    _originalPostMessage({
      type: 'exception',
      kind: 'exception',
      payload: {
        name: ev.constructor?.name ?? ev.type,
        message: util.inspect(ev.promise) ?? ev.reason,
        stack: `Unhandled Rejection ${util.inspect(ev.reason)}`
      }
    })
  })

  globalThis.exit = (code = 0) => {
    //console.log(`[sandbox] exit(${code}) called`);
    globalThis.self.close()
  }
  Object.freeze(globalThis.exit)

  globalThis.terminate = () => {
    //console.log('[sandbox] terminate() called');
    globalThis.self.close()
  }
  // console.log('self.close', globalThis.self);
  // console.log(globalThis.self);
  Object.freeze(globalThis.terminate)

  Object.freeze(globalThis.process)
  Object.freeze(globalThis.process.env)
})()
