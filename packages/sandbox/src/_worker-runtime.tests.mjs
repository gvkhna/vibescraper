/* eslint-disable */
// console.log('global this', JSON.stringify(globalThis))
function dumpGlobalThis() {
  const entries = {}

  for (const key of Object.getOwnPropertyNames(globalThis)) {
    try {
      const value = globalThis[key]
      entries[key] = {
        type: typeof value,
        isFunction: typeof value === 'function',
        constructorName: value?.constructor?.name ?? null,
        value: isSerializable(value) ? value : undefined
      }
    } catch (err) {
      entries[key] = { error: String(err) }
    }
  }

  console.log('🔍 globalThis dump (summary):')
  for (const [k, v] of Object.entries(entries)) {
    const summary =
      typeof v === 'object' && v !== null
        ? `${v.constructorName ?? v.type}${v.isFunction ? ' (fn)' : ''}`
        : typeof v
    console.log(` - ${k}: ${summary}`)
  }

  try {
    const json = JSON.stringify(entries, null, 2)
    console.log('\n🧾 Full globalThis JSON:')
    console.log(json)
  } catch (err) {
    console.warn('❌ Could not stringify full globalThis dump', err)
  }

  dumpIndividualObject('Deno', globalThis.Deno)
  dumpIndividualObject('process', globalThis.process)
  dumpIndividualObject('console', globalThis.console)
}

function dumpIndividualObject(name, obj) {
  console.log(`\n🔎 Dumping ${name} with prototype chain:`)

  if (!obj) {
    console.log(` - ${name} is not defined`)
    return
  }

  const seen = new Set()
  let proto = obj
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (!seen.has(key)) {
        seen.add(key)
        try {
          const val = obj[key]
          const valType = typeof val
          const printable = isSerializable(val) ? JSON.stringify(val) : `[${valType}]`
          console.log(` - ${name}.${key} (${valType}): ${printable}`)
        } catch (err) {
          console.log(` - ${name}.${key}: <error: ${err.message}>`)
        }
      }
    }
    proto = Object.getPrototypeOf(proto)
  }
}

function isSerializable(value) {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true
  }
  try {
    JSON.stringify(value)
    return true
  } catch {
    return false
  }
}

// Call this inside your worker
dumpGlobalThis()

console.log(globalThis.location)
console.log(globalThis.location.href)

// Test suite
const test = async (name, fn) => {
  try {
    await fn()
    console.log(`✅ [${name}] Passed`)
  } catch (err) {
    console.error(`❌ [${name}] Failed: ${err.message}`)
  }
}

const securityTests = {
  // This test should pass if reading /etc/passwd fails with an expected error.
  shouldNotReadPrivateFiles: async () => {
    try {
      const fs = await import('fs/promises')
      await fs.readFile('/etc/passwd')
      // If the file is read successfully, that's a breach.
      throw new Error('private files should not be accessible')
    } catch (e) {
      console.log('[shouldNotReadPrivateFiles] Caught error:', e.message)
      // Accept errors that mention either missing permissions or require read access.
      if (!/(Cannot find module|not supported|PermissionDenied|Requires read access)/i.test(e.message)) {
        throw new Error(`Unexpected error message: ${e.message}`)
      }
    }
  },

  // This test should pass if using child_process fails with an expected error.
  shouldNotUseChildProcess: async () => {
    try {
      const { exec } = await import('node:child_process')
      await new Promise((resolve, reject) => {
        exec('whoami', (err, stdout) => {
          if (err) {
            reject(err)
            return
          }
          resolve(stdout)
        })
      })
      // If exec() succeeds, that's a breach.
      throw new Error('child_process should not be accessible')
    } catch (e) {
      console.log('[shouldNotUseChildProcess] Caught error:', e.message)
      // Accept errors that mention either missing module, not supported, permission issues, or require read access.
      if (
        !/(Cannot find module|not supported|PermissionDenied|Requires read access|not allowed)/i.test(
          e.message
        )
      ) {
        throw new Error(`Unexpected error message: ${e.message}`)
      }
    }
  },

  shouldHaveImportNodeWork: async () => {
    const mod = await import('node:path')
    console.log('node module', mod)
    if (!mod || typeof mod.join !== 'function') {
      throw new Error('Imported module path did not have expected structure')
    }
  },

  shouldHaveImportNpmWork: async () => {
    const mod = await import('npm:ulid')
    console.log('npm module', mod)
    if (!mod) {
      throw new Error('Imported module ulid did not have expected structure')
    }
  },

  shouldHaveImportJsrWork: async () => {
    const mod = await import('jsr:@std/ulid')
    console.log('jsr module', mod)
    if (!mod) {
      throw new Error('Imported module ulid did not have expected structure')
    }
  },

  // This test should pass if process.env is correctly defined.
  shouldHaveProcessEnv: () => {
    if (!process.env) {
      throw new Error('process.env missing or incorrect')
    }
    console.log('[process.env]', process.env)
  },

  // shouldHaveImportMetaEnv: () => {
  //   console.log('[import.meta.env]', import.meta.env)
  //   if (!import.meta.env) {
  //     throw new Error('import.meta.env missing or incorrect')
  //   }
  // },

  // shouldHaveImportMetaEnv: () => {
  //   console.log('[import.meta.env]', import.meta.env)
  //   if (!import.meta.env) {
  //     throw new Error('import.meta.env missing or incorrect')
  //   }
  // },

  shouldHaveExitFunction: () => {
    if (typeof exit !== 'function') {
      throw new Error('globalThis.exit is missing')
    }
  },

  // shouldNotLeakBuffer: () => {
  //   // Optionally, you might decide that Buffer should not be on the global object
  //   // if you have already imported it locally.
  //   // If your design is not to leak it globally, then check:
  //   if (globalThis.hasOwnProperty('Buffer')) {
  //     throw new Error('Buffer leaked to global scope')
  //   }
  // },

  shouldResolveCurrentDir: () => {
    const url = new URL('.', location.href)
    const cwd = decodeURIComponent(url.pathname)
    if (!cwd?.endsWith('/')) {
      throw new Error('CWD resolution failed')
    }
    console.log('[shouldResolveCurrentDir] CWD from location.href:', cwd)
  },

  shouldReadWorkerMjsFile: async () => {
    const url = new URL('.', location.href)
    const cwd = decodeURIComponent(url.pathname)
    const fs = await import('node:fs/promises')
    const content = await fs.readFile(`${cwd}worker.mjs`, 'utf-8')
    if (!content.includes('sandbox')) {
      throw new Error('Unexpected worker.mjs contents')
    }
    console.log('[shouldReadWorkerMjsFile] Length:', content.length)
  },

  shouldListFilesInDir: async () => {
    const url = new URL('.', location.href)
    const cwd = decodeURIComponent(url.pathname)
    const fs = await import('node:fs/promises')
    const files = await fs.readdir(cwd)
    if (!files.includes('worker.mjs')) {
      throw new Error('worker.mjs not listed')
    }
    console.log('[shouldListFilesInDir] Files:', files)
  },

  shouldWriteAndReadBack: async () => {
    const url = new URL('.', location.href)
    const cwd = decodeURIComponent(url.pathname)
    const fs = await import('node:fs/promises')
    const testFile = `${cwd}test-output.txt`
    await fs.writeFile(testFile, 'sandbox test write')
    const content = await fs.readFile(testFile, 'utf-8')
    if (content !== 'sandbox test write') {
      throw new Error('File write/read mismatch')
    }
    console.log('[shouldWriteAndReadBack] Wrote and read back:', content)
  }

  // (async () => {
  //   try {
  //     console.log('[heap test] Allocating 128 MB…');
  //     // 128 MB in bytes
  //     const BYTES = 128 * 1024 * 1024;

  //     // Allocate a single contiguous buffer
  //     const buf = new Uint8Array(BYTES);

  //     // Touch every page so the OS actually backs it
  //     for (let i = 0; i < BYTES; i += 4096) {
  //       buf[i] = 0;
  //     }

  //     console.log('[heap test] ✅ Successfully allocated 128 MB');
  //   } catch (err) {
  //     console.error('[heap test] ❌ Allocation failed:', err);
  //   } finally {
  //     // tear down the worker so you get back to your harness
  //     globalThis.self.close();
  //   }
  // })();
  // shouldHandleHeapExhaustion: async () => {
  //   try {
  //     const big = []
  //     const CHUNK = 10_000_000
  //     const MAX = 1_000_000_000

  //     console.log('[heap test] Attempting to allocate...')

  //     for (let i = 0; i < MAX; i += CHUNK) {
  //       const chunk = new Array(CHUNK).fill(i)
  //       big.push(chunk)

  //       if (i % (100 * CHUNK) === 0) {
  //         console.log(`[heap test] Allocated ${(i / 1_000_000).toFixed(0)}M items...`)
  //       }
  //     }

  //     console.log('[heap test] Completed allocation (unexpected!)')
  //     throw new Error('Heap test did not crash or throw')
  //   } catch (err) {
  //     if (/allocation failed|invalid array length|heap|memory|Array buffer allocation/.test(err.message)) {
  //       console.log(`[heap test] Caught expected memory error: ${err.message}`)
  //     } else {
  //       throw new Error(`Unexpected error in heap test: ${err.message}`)
  //     }
  //   }
  // }

  // shouldRemoveDeno: () => {
  //   if (typeof Deno !== 'undefined') {
  //     throw new Error('Deno should not exist')
  //   }
  // },

  // shouldRemoveProcess: () => {
  //   if (typeof process !== 'undefined') {
  //     throw new Error('process should not exist')
  //   }
  // }
}

// Debug output (optional)
console.log('[sandbox booted]')
// console.log('[import.meta.env]', importMeta.env)
console.log('[Deno.env.toObject()]', globalThis.Deno.env.toObject())
console.log('[process.env]', process.env)
console.log('[process.cwd()]', process.cwd())

// Run all tests
// ;(async () => {
console.log('Starting secure sandbox tests...\n')

for (const [name, fn] of Object.entries(securityTests)) {
  await test(name, fn)
}

console.log('Testing all console statements')

// Node.js Console Methods Examples

// 1. console.assert()
// If the first argument is false, it logs the message and any additional parameters.
console.assert(2 + 2 === 4, 'This assertion should pass, so nothing is printed.')
console.assert(2 + 2 === 5, 'Assertion failed: %d + %d should equal %d', 2, 2, 5)

// 2. console.clear()
// Attempts to clear the console. (Note: Behavior may vary by environment.)
console.clear()

// 3. console.count() and console.countReset()
// The counter is maintained per label. By default, if no label is passed the label "default" is used.
console.count() // default: 1
console.count('default') // default: 2
console.count('abc') // abc: 1
console.count('default') // default: 3
console.countReset('abc') // resets the 'abc' counter
console.count('abc') // abc: 1 (starts over)

// 4. console.debug()
// Works like console.log() by default, but intended for debugging output.
console.debug('Debug message: %s', 'debugging info')

// 5. console.dir()
// Displays an interactive list of the properties of the object.
const sampleObj = { a: 1, b: [2, 3], c: { d: 4 } }
console.dir(sampleObj, { depth: null, colors: true })

// 6. console.dirxml()
// Intended to display XML/HTML elements as a tree.
// In Node, it will print a representation of the passed object.
console.dirxml({ tree: 'example', children: [{ id: 1 }, { id: 2 }] })

// 7. console.error()
// Prints error messages to stderr.
console.error('Error occurred: %d', 404)

// 8. console.group(), console.groupCollapsed(), and console.groupEnd()
// Groups messages together, with collapsed groups optionally.
console.group('Start Group')
console.log('Message inside the group.')
console.groupCollapsed('Collapsed Subgroup')
console.log('Message inside the collapsed subgroup.')
console.groupEnd() // Ends the collapsed subgroup.
console.groupEnd() // Ends the outer group.

// 9. console.info()
// An alias for console.log(), used to output informational messages.
console.info('Information: This is an info message.')

// 10. console.log()
// The most commonly used method to print general messages.
console.log('Log: Hello %s', 'world')

// 11. console.table()
// Displays tabular data as a table.
const tableData = [
  { a: 1, b: 'Y' },
  { a: 'Z', b: 2 }
]
console.table(tableData) // Display the entire object
console.table(tableData, ['a']) // Display only the 'a' column

// 12. console.time(), console.timeLog(), and console.timeEnd()
// Start a timer, log intermediate times, and then stop the timer.
console.time('timer1')
for (let i = 0; i < 1e6; i++) {
  // Simulate some work.
}
console.timeLog('timer1', 'Halfway point reached.')
console.timeEnd('timer1')

// 13. console.trace()
// Outputs a trace that shows how the code reached this point.
console.trace('Trace message example.')

// 14. console.warn()
// An alias for console.error(), used for warning messages.
console.warn('Warning: Something might be off.')

// 15. console.profile() and console.profileEnd()
// Start and stop a CPU profiling session. (Works when run with an inspector)
console.profile('ProfileExample')
for (let i = 0; i < 1e6; i++) {
  // Simulate a CPU-intensive task.
}
console.profileEnd('ProfileExample')

// 16. console.timeStamp()
// Adds a timestamp to the browser's or Node's timeline. (Most relevant when using performance tools.)
console.timeStamp('Timestamp Event')

console.log('All tests complete')
// exit()
// })()
