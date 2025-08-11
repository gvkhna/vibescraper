/**
 * License for programmatically and manually incorporated
 * documentation aka. `JSDoc` from https://github.com/nodejs/node/tree/master/doc
 *
 * Copyright Node.js contributors. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

// NOTE: These definitions support Node.js and TypeScript 5.8+.

// Reference required TypeScript libraries:
/// <reference lib="es2020" />
/// <reference lib="esnext.disposable" />
/// <reference lib="esnext.float16" />

// Iterator definitions required for compatibility with TypeScript <5.6:
/// <reference path="node_modules/@types/node-legacy/compatibility/iterators.d.ts" />

// Definitions for Node.js modules specific to TypeScript 5.7+:
/// <reference path="node_modules/@types/node-legacy/globals.typedarray.d.ts" />
/// <reference path="node_modules/@types/node-legacy/buffer.buffer.d.ts" />

// Definitions for Node.js modules that are not specific to any version of TypeScript:
/// <reference path="node_modules/@types/node-legacy/globals.d.ts" />
/// <reference path="node_modules/@types/node-legacy/assert.d.ts" />
/// <reference path="node_modules/@types/node-legacy/assert/strict.d.ts" />
/// <reference path="node_modules/@types/node-legacy/async_hooks.d.ts" />
/// <reference path="node_modules/@types/node-legacy/buffer.d.ts" />
/// <reference path="node_modules/@types/node-legacy/child_process.d.ts" />
/// <reference path="node_modules/@types/node-legacy/cluster.d.ts" />
/// <reference path="node_modules/@types/node-legacy/console.d.ts" />
/// <reference path="node_modules/@types/node-legacy/constants.d.ts" />
/// <reference path="node_modules/@types/node-legacy/crypto.d.ts" />
/// <reference path="node_modules/@types/node-legacy/dgram.d.ts" />
/// <reference path="node_modules/@types/node-legacy/diagnostics_channel.d.ts" />
/// <reference path="node_modules/@types/node-legacy/domain.d.ts" />
/// <reference path="node_modules/@types/node-legacy/dom-events.d.ts" />
/// <reference path="node_modules/@types/node-legacy/events.d.ts" />
/// <reference path="node_modules/@types/node-legacy/fs.d.ts" />
/// <reference path="node_modules/@types/node-legacy/fs/promises.d.ts" />
/// <reference path="node_modules/@types/node-legacy/http.d.ts" />
/// <reference path="node_modules/@types/node-legacy/http2.d.ts" />
/// <reference path="node_modules/@types/node-legacy/https.d.ts" />
/// <reference path="node_modules/@types/node-legacy/inspector.d.ts" />
/// <reference path="node_modules/@types/node-legacy/module.d.ts" />
/// <reference path="node_modules/@types/node-legacy/net.d.ts" />
/// <reference path="node_modules/@types/node-legacy/os.d.ts" />
/// <reference path="node_modules/@types/node-legacy/path.d.ts" />
/// <reference path="node_modules/@types/node-legacy/perf_hooks.d.ts" />
/// <reference path="node_modules/@types/node-legacy/process.d.ts" />
/// <reference path="node_modules/@types/node-legacy/punycode.d.ts" />
/// <reference path="node_modules/@types/node-legacy/querystring.d.ts" />
/// <reference path="node_modules/@types/node-legacy/readline.d.ts" />
/// <reference path="node_modules/@types/node-legacy/readline/promises.d.ts" />
/// <reference path="node_modules/@types/node-legacy/repl.d.ts" />
/// <reference path="node_modules/@types/node-legacy/sea.d.ts" />
/// <reference path="node_modules/@types/node-legacy/sqlite.d.ts" />
/// <reference path="node_modules/@types/node-legacy/stream.d.ts" />
/// <reference path="node_modules/@types/node-legacy/stream/promises.d.ts" />
/// <reference path="node_modules/@types/node-legacy/stream/consumers.d.ts" />
/// <reference path="node_modules/@types/node-legacy/stream/web.d.ts" />
/// <reference path="node_modules/@types/node-legacy/string_decoder.d.ts" />
/// <reference path="node_modules/@types/node-legacy/test.d.ts" />
//  <reference path="node_modules/@types/node-legacy/timers.d.ts" />
//  <reference path="node_modules/@types/node-legacy/timers/promises.d.ts" />
/// <reference path="node_modules/@types/node-legacy/tls.d.ts" />
/// <reference path="node_modules/@types/node-legacy/trace_events.d.ts" />
/// <reference path="node_modules/@types/node-legacy/tty.d.ts" />
/// <reference path="node_modules/@types/node-legacy/url.d.ts" />
/// <reference path="node_modules/@types/node-legacy/util.d.ts" />
/// <reference path="node_modules/@types/node-legacy/v8.d.ts" />
/// <reference path="node_modules/@types/node-legacy/vm.d.ts" />
/// <reference path="node_modules/@types/node-legacy/wasi.d.ts" />
/// <reference path="node_modules/@types/node-legacy/worker_threads.d.ts" />
/// <reference path="node_modules/@types/node-legacy/zlib.d.ts" />
