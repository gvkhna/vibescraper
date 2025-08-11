// Modern TypeScript type definitions for web-first Node.js development
// Using browser-compatible APIs where possible, explicit imports for Node modules

// Reference required TypeScript libraries (ESNext only, no DOM):
/// <reference lib="esnext" />

// DOM types come from @types/web (aliased as @types/node in package.json)
// This provides browser-compatible timer types (setTimeout returns number)
/// <reference types="@types/node" />

// Iterator definitions required for compatibility with TypeScript <5.6:
// <reference path="node_modules/@types/node-legacy/compatibility/iterators.d.ts" />

// Definitions for Node.js modules specific to TypeScript 5.7+:
// Commented: Use standard TypedArray from ESNext instead
// <reference path="node_modules/@types/node-legacy/globals.typedarray.d.ts" />
// Commented: Use Uint8Array and modern web APIs instead of Buffer
// <reference path="node_modules/@types/node-legacy/buffer.buffer.d.ts" />

// Definitions for Node.js modules that are not specific to any version of TypeScript:
// Commented: Globals like process should be explicitly imported, not ambient
// <reference path="node_modules/@types/node-legacy/globals.d.ts" />
// <reference path="node_modules/@types/node-legacy/assert.d.ts" />
// <reference path="node_modules/@types/node-legacy/assert/strict.d.ts" />
// <reference path="node_modules/@types/node-legacy/async_hooks.d.ts" />
// Commented: Use Uint8Array and modern web APIs instead of Buffer
// <reference path="node_modules/@types/node-legacy/buffer.d.ts" />
/// <reference path="node_modules/@types/node-legacy/child_process.d.ts" />
// <reference path="node_modules/@types/node-legacy/cluster.d.ts" />
// Commented: Console is provided by ESNext/DOM
// <reference path="node_modules/@types/node-legacy/console.d.ts" />
// Commented: Node constants rarely used
// <reference path="node_modules/@types/node-legacy/constants.d.ts" />
// Commented: Use native Web Crypto API from ESNext instead
// <reference path="node_modules/@types/node-legacy/crypto.d.ts" />
// Commented: UDP sockets not needed for web-first development
// <reference path="node_modules/@types/node-legacy/dgram.d.ts" />
// <reference path="node_modules/@types/node-legacy/diagnostics_channel.d.ts" />
// Commented: Deprecated Node.js API
// <reference path="node_modules/@types/node-legacy/domain.d.ts" />
// Commented: DOM events are provided by @types/web
// <reference path="node_modules/@types/node-legacy/dom-events.d.ts" />
// Commented: Use EventTarget from DOM or explicit imports for EventEmitter
// <reference path="node_modules/@types/node-legacy/events.d.ts" />
/// <reference path="node_modules/@types/node-legacy/fs.d.ts" />
/// <reference path="node_modules/@types/node-legacy/fs/promises.d.ts" />
// Commented: Use fetch API and modern web standards instead
// <reference path="node_modules/@types/node-legacy/http.d.ts" />
// <reference path="node_modules/@types/node-legacy/http2.d.ts" />
// <reference path="node_modules/@types/node-legacy/https.d.ts" />
// Commented: Chrome DevTools Protocol not needed
// <reference path="node_modules/@types/node-legacy/inspector.d.ts" />
// Commented: Module system handled by bundler
// <reference path="node_modules/@types/node-legacy/module.d.ts" />
// Commented: TCP sockets not needed for web-first development
// <reference path="node_modules/@types/node-legacy/net.d.ts" />
/// <reference path="node_modules/@types/node-legacy/os.d.ts" />
/// <reference path="node_modules/@types/node-legacy/path.d.ts" />
// Commented: Use Performance API from web standards
// <reference path="node_modules/@types/node-legacy/perf_hooks.d.ts" />
// Commented: Process should be explicitly imported, not global
// <reference path="node_modules/@types/node-legacy/process.d.ts" />
// Commented: Deprecated, use URL API instead
// <reference path="node_modules/@types/node-legacy/punycode.d.ts" />
// Commented: Use URLSearchParams from web standards instead
// <reference path="node_modules/@types/node-legacy/querystring.d.ts" />
// Commented: CLI readline not used
// <reference path="node_modules/@types/node-legacy/readline.d.ts" />
// <reference path="node_modules/@types/node-legacy/readline/promises.d.ts" />
// Commented: REPL not used
// <reference path="node_modules/@types/node-legacy/repl.d.ts" />
// Commented: Single Executable Applications not used
// <reference path="node_modules/@types/node-legacy/sea.d.ts" />
// Commented: SQLite handled by other libraries
// <reference path="node_modules/@types/node-legacy/sqlite.d.ts" />
// Commented: Use Web Streams API from ESNext instead
// <reference path="node_modules/@types/node-legacy/stream.d.ts" />
// <reference path="node_modules/@types/node-legacy/stream/promises.d.ts" />
// <reference path="node_modules/@types/node-legacy/stream/consumers.d.ts" />
// <reference path="node_modules/@types/node-legacy/stream/web.d.ts" />
// Commented: Use TextDecoder from web standards instead
// <reference path="node_modules/@types/node-legacy/string_decoder.d.ts" />
// Commented: Test runner not used
// <reference path="node_modules/@types/node-legacy/test.d.ts" />
// Commented: Use browser timer types from @types/web (setTimeout returns number)
// <reference path="node_modules/@types/node-legacy/timers.d.ts" />
// <reference path="node_modules/@types/node-legacy/timers/promises.d.ts" />
// Commented: TLS handled at higher level
// <reference path="node_modules/@types/node-legacy/tls.d.ts" />
// Commented: Tracing not used
// <reference path="node_modules/@types/node-legacy/trace_events.d.ts" />
// Commented: TTY not used in web-first development
// <reference path="node_modules/@types/node-legacy/tty.d.ts" />
// Commented: Use URL and URLSearchParams from web standards
// <reference path="node_modules/@types/node-legacy/url.d.ts" />
// Commented: Most util functions have web standard equivalents
// <reference path="node_modules/@types/node-legacy/util.d.ts" />
// Commented: V8 internals not needed
// <reference path="node_modules/@types/node-legacy/v8.d.ts" />
// Commented: VM module not used
// <reference path="node_modules/@types/node-legacy/vm.d.ts" />
// Commented: WebAssembly System Interface not used
// <reference path="node_modules/@types/node-legacy/wasi.d.ts" />
// Commented: Use Web Workers instead
// <reference path="node_modules/@types/node-legacy/worker_threads.d.ts" />
// Commented: Compression handled at application level
// <reference path="node_modules/@types/node-legacy/zlib.d.ts" />
