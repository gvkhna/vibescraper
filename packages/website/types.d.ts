/**
 *
 * This package overrides @types/node with @types/web to use browser/DOM APIs by default.
 *
 * How it works:
 * 1. In package.json devDependencies:
 *    "@types/node": "npm:@types/web@latest" - Aliases @types/node to web types
 *    "@types/node-legacy": "npm:@types/node@latest" - Keeps original Node types available
 *    "@typescript/lib-dom": "npm:@types/web@latest" - Overrides ts lib dom to web types
 *
 * 2. In tsconfig.json:
 *    "types": [] - Prevents automatic inclusion of all @types packages
 *    "lib": ["ESNext"] - Uses only ESNext features (DOM types come from @types/web)
 *
 * 3. Result:
 *    Any package importing @types/node gets web/browser types instead
 *    Only specific nodejs APIs are allowed (e.g., import fs from 'node:fs')
 *
 */

// Reference required TypeScript libraries (ESNext only, no DOM):
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

// Iterator definitions required for compatibility with TypeScript <5.6:
// <reference path="node_modules/@types/node-legacy/compatibility/iterators.d.ts" />

// Definitions for Node.js modules specific to TypeScript 5.7+:

// Use standard TypedArray from ESNext instead
// <reference path="node_modules/@types/node-legacy/globals.typedarray.d.ts" />

// Use Uint8Array and modern web APIs instead of Buffer
// <reference path="node_modules/@types/node-legacy/buffer.buffer.d.ts" />

// Definitions for Node.js modules that are not specific to any version of TypeScript:

// Globals like process should be explicitly imported, not ambient
// <reference path="node_modules/@types/node-legacy/globals.d.ts" />
// <reference path="node_modules/@types/node-legacy/assert.d.ts" />
// <reference path="node_modules/@types/node-legacy/assert/strict.d.ts" />
// <reference path="node_modules/@types/node-legacy/async_hooks.d.ts" />

// Use Uint8Array and modern web APIs instead of Buffer
// <reference path="node_modules/@types/node-legacy/buffer.d.ts" />

// <reference path="node_modules/@types/node-legacy/child_process.d.ts" />

// <reference path="node_modules/@types/node-legacy/cluster.d.ts" />

// Console is provided by ESNext/DOM
// <reference path="node_modules/@types/node-legacy/console.d.ts" />

// Node constants rarely used
// <reference path="node_modules/@types/node-legacy/constants.d.ts" />

// Use native Web Crypto API from ESNext instead
// <reference path="node_modules/@types/node-legacy/crypto.d.ts" />

// UDP sockets not needed for web-first development
// <reference path="node_modules/@types/node-legacy/dgram.d.ts" />
// <reference path="node_modules/@types/node-legacy/diagnostics_channel.d.ts" />

// Deprecated Node.js API
// <reference path="node_modules/@types/node-legacy/domain.d.ts" />

// DOM events are provided by @types/web
// <reference path="node_modules/@types/node-legacy/dom-events.d.ts" />

// Use EventTarget from DOM or explicit imports for EventEmitter
// <reference path="node_modules/@types/node-legacy/events.d.ts" />

// <reference path="node_modules/@types/node-legacy/fs.d.ts" />
// <reference path="node_modules/@types/node-legacy/fs/promises.d.ts" />

// Use fetch API and modern web standards instead
// <reference path="node_modules/@types/node-legacy/http.d.ts" />
// <reference path="node_modules/@types/node-legacy/http2.d.ts" />
// <reference path="node_modules/@types/node-legacy/https.d.ts" />

// Chrome DevTools Protocol not needed
// <reference path="node_modules/@types/node-legacy/inspector.d.ts" />

// Module system handled by bundler
// <reference path="node_modules/@types/node-legacy/module.d.ts" />

// TCP sockets not needed for web-first development
// <reference path="node_modules/@types/node-legacy/net.d.ts" />
// <reference path="node_modules/@types/node-legacy/os.d.ts" />
// <reference path="node_modules/@types/node-legacy/path.d.ts" />

// Use Performance API from web standards
// <reference path="node_modules/@types/node-legacy/perf_hooks.d.ts" />

// Process should be explicitly imported, not global
// <reference path="node_modules/@types/node-legacy/process.d.ts" />

// Deprecated, use URL API instead
// <reference path="node_modules/@types/node-legacy/punycode.d.ts" />

// Use URLSearchParams from web standards instead
// <reference path="node_modules/@types/node-legacy/querystring.d.ts" />

// CLI readline not used
// <reference path="node_modules/@types/node-legacy/readline.d.ts" />
// <reference path="node_modules/@types/node-legacy/readline/promises.d.ts" />

// REPL not used
// <reference path="node_modules/@types/node-legacy/repl.d.ts" />

// Single Executable Applications not used
// <reference path="node_modules/@types/node-legacy/sea.d.ts" />

// SQLite handled by other libraries
// <reference path="node_modules/@types/node-legacy/sqlite.d.ts" />

// Use Web Streams API from ESNext instead
// <reference path="node_modules/@types/node-legacy/stream.d.ts" />
// <reference path="node_modules/@types/node-legacy/stream/promises.d.ts" />
// <reference path="node_modules/@types/node-legacy/stream/consumers.d.ts" />
// <reference path="node_modules/@types/node-legacy/stream/web.d.ts" />

// Use TextDecoder from web standards instead
// <reference path="node_modules/@types/node-legacy/string_decoder.d.ts" />

// Test runner not used
// <reference path="node_modules/@types/node-legacy/test.d.ts" />

// Use browser timer types from @types/web (setTimeout returns number)
// <reference path="node_modules/@types/node-legacy/timers.d.ts" />
// <reference path="node_modules/@types/node-legacy/timers/promises.d.ts" />

// TLS handled at higher level
// <reference path="node_modules/@types/node-legacy/tls.d.ts" />

// Tracing not used
// <reference path="node_modules/@types/node-legacy/trace_events.d.ts" />

// TTY not used in web-first development
// <reference path="node_modules/@types/node-legacy/tty.d.ts" />

// Use URL and URLSearchParams from web standards
// <reference path="node_modules/@types/node-legacy/url.d.ts" />

// Most util functions have web standard equivalents
// <reference path="node_modules/@types/node-legacy/util.d.ts" />

// V8 internals not needed
// <reference path="node_modules/@types/node-legacy/v8.d.ts" />

// VM module not used
// <reference path="node_modules/@types/node-legacy/vm.d.ts" />

// WebAssembly System Interface not used
// <reference path="node_modules/@types/node-legacy/wasi.d.ts" />

// Use Web Workers instead
// <reference path="node_modules/@types/node-legacy/worker_threads.d.ts" />

// Compression handled at application level
// <reference path="node_modules/@types/node-legacy/zlib.d.ts" />
