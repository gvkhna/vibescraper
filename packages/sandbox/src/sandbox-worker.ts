/* eslint-disable no-console */

import path from 'node:path'
import fs from 'node:fs/promises'
import {Buffer} from 'node:buffer'
import {pathToFileURL} from 'node:url'
import util from 'node:util'

interface DenoWorkerOptions extends WorkerOptions {
  deno: {
    permissions?: Deno.PermissionOptions
  }
}

export type SandboxMessage =
  | NewJobMessage
  | JobStatusMessage
  | JobLogMessage
  | JobExceptionMessage
  | JobTestMessage
  | JobResultMessage
  | LargePayloadMessage

export interface NewJobMessage {
  type: 'new-job'
  jobId: string
  code: string
  testing: boolean
  functionInput?: string // If provided, execute code as function with this input
}

export interface JobStatusMessage {
  type: 'job-status'
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout'
  error?: string
  completedAt?: number
}

export interface JobLogMessage {
  type: 'job-log'
  kind: 'log' | 'info' | 'warn' | 'error' | 'debug'
  jobId: string
  log: string
}

export interface JobTestMessage {
  type: 'job-test'
  jobId: string
  status: 'passed' | 'failed' | 'running' | 'skipped'
  name: string
  eventTimestamp: number
  message: string
  duration: number
}

export interface JobExceptionMessage {
  type: 'job-exception'
  kind: 'exception'
  jobId: string
  exception:
    | string
    | {
        name: string
        message: string
        stack: string
      }
}

export interface JobResultMessage {
  type: 'job-result'
  jobId: string
  result: string // JSON stringified result
}

export interface LargePayloadMessage {
  type: 'large-payload'
  originalMessage: 'new-job' | 'job-result'
  filePath: string // Relative to IPC_DIR
  jobId: string
  timestamp: number
}

export function encodeMessage(message: SandboxMessage): string {
  try {
    const json = JSON.stringify(message)
    return `data: ${Buffer.from(json).toString('base64')}\n`
  } catch (err) {
    throw new Error(`Failed to encode message: ${err}`)
  }
}

export function decodeMessage(line: string): SandboxMessage | null {
  if (!line.startsWith('data: ')) {
    return null
  }

  try {
    const base64Data = line.slice(6).trim()
    const decoded = Buffer.from(base64Data, 'base64').toString('utf8')
    const parsed = JSON.parse(decoded)

    if (!isMessage(parsed)) {
      throw new Error('Invalid message structure')
    }

    return parsed
  } catch (err) {
    console.log('Message decoding failed:', err)
    return null
  }
}

// Type guard for runtime validation
export function isMessage(obj: unknown): obj is SandboxMessage {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  const data = obj as Record<string, unknown>

  // common fields
  if (typeof data.type !== 'string') {
    return false
  }
  if (typeof data.jobId !== 'string') {
    return false
  }

  // cast to the literal union of message.type
  const type = data.type as SandboxMessage['type']

  switch (type) {
    case 'new-job':
      return (
        typeof data.code === 'string' &&
        typeof data.testing === 'boolean' &&
        (!data.functionInput || typeof data.functionInput === 'string')
      )

    case 'job-status':
      return (
        typeof data.status === 'string' &&
        ['pending', 'running', 'completed', 'failed', 'timeout'].includes(data.status) &&
        (!data.error || typeof data.error === 'string') &&
        (!data.completedAt || typeof data.completedAt === 'number')
      )

    case 'job-log':
      return (
        typeof data.kind === 'string' &&
        ['log', 'info', 'warn', 'error', 'debug'].includes(data.kind) &&
        typeof data.log === 'string'
      )

    case 'job-test':
      return (
        typeof data.status === 'string' &&
        ['passed', 'failed', 'running', 'skipped'].includes(data.status) &&
        typeof data.name === 'string' &&
        typeof data.eventTimestamp === 'number' &&
        typeof data.message === 'string' &&
        typeof data.duration === 'number'
      )

    case 'job-exception':
      return typeof data.exception === 'string' || typeof data.exception === 'object'

    case 'job-result':
      return typeof data.result === 'string'

    case 'large-payload':
      return (
        typeof data.originalMessage === 'string' &&
        typeof data.filePath === 'string' &&
        typeof data.jobId === 'string' &&
        typeof data.timestamp === 'number'
      )
    default: {
      // If you add a new literal to SandboxMessage['type'],
      // TS will error here until you handle it.
      const _exhaustive: never = type
      return false
    }
  }
}

const __cwd = globalThis.process.cwd()

const JOB_TIMEOUT_MS = 30_000 // 30 seconds timeout for sandbox execution
const LARGE_PAYLOAD_THRESHOLD = 8 * 1024 // 8KB - must match sandbox manager
// const SANDBOX_DIR = path.join(__cwd, 'sandbox-tmp')

// globalThis.process.on('unhandledRejection', (err) => {
//   console.error('Unhandled rejection:', err)
// })

async function main() {
  // await fs.mkdir(SANDBOX_DIR, {recursive: true})

  console.log('[worker] Sandbox worker started, IPC_DIR:', globalThis.Deno.env.get('IPC_DIR'))
  let buffer = ''

  // Track large payload state per job
  const pendingLargePayloads = new Map<string, {filePath: string; timestamp: number}>()

  globalThis.process.stdin.setEncoding('utf8')
  globalThis.process.stdin.on('data', (chunk) => {
    console.log('[worker] Received stdin data, length:', chunk.toString().length)
    buffer += chunk.toString()
    const lines = buffer.split('\n')

    // Keep incomplete line in buffer
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const message = decodeMessage(line)
      console.log('[worker] Decoded message type:', message?.type, 'jobId:', message?.jobId)

      if (message?.type === 'large-payload') {
        // Store large payload info for the job
        console.log('[worker] Received large-payload message:', message.jobId, message.filePath)
        pendingLargePayloads.set(message.jobId, {
          filePath: message.filePath,
          timestamp: message.timestamp
        })
        console.log('[worker] Stored large payload info for job:', message.jobId)
      } else if (message?.type === 'new-job') {
        // Check if this job has a pending large payload
        const largePayload = pendingLargePayloads.get(message.jobId)

        if (largePayload) {
          // Read the large input from file and enhance the message
          console.log(
            '[worker] Found large payload for job:',
            message.jobId,
            'reading from:',
            largePayload.filePath
          )
          readLargePayload(largePayload.filePath)
            .then((functionInput) => {
              console.log('[worker] Successfully read large payload, size:', functionInput.length)
              const enhancedMessage: NewJobMessage = {
                ...message,
                functionInput
              }
              pendingLargePayloads.delete(message.jobId) // Cleanup
              console.log('[worker] Starting large payload job execution')
              return handleNewJob(enhancedMessage)
            })
            .then((res) => {
              console.log('[worker] Large payload job finished:', res)
            })
            .catch((e: unknown) => {
              console.log('[worker] Large payload job error:', e)
              pendingLargePayloads.delete(message.jobId) // Cleanup on error
            })
        } else {
          // Normal small payload processing
          console.log('[worker] Processing small payload job:', message.jobId)
          handleNewJob(message)
            .then((res) => {
              console.log('[worker] Small payload job finished:', res)
            })
            .catch((e: unknown) => {
              console.log('[worker] Small payload job error:', e)
            })
        }
      }
    }
  })
  globalThis.process.stdin.on('end', () => {
    console.log('[sandbox] stdin closed')
  })

  // process.stdin.setEncoding('utf8')
  // for await (const chunk of process.stdin) {
  //   try {
  //     const message: JobMessage = JSON.parse(chunk)
  //     if (message.type === 'new-job') {
  //       handleNewJob(message)
  //     }
  //   } catch (err) {
  //     console.error('Error processing message:', err)
  //   }
  // }
}

async function handleNewJob({jobId, code, testing, functionInput}: NewJobMessage) {
  // console.log('[worker] handle new job')
  const sandboxDir = Deno.env.get('SANDBOX_DIR')
  if (!sandboxDir) {
    throw new Error('no sandbox dir found cannot run')
  }

  const workerRuntimeSetupPath = Deno.env.get('WORKER_RUNTIME_SETUP_PATH')
  if (!workerRuntimeSetupPath) {
    throw new Error('no worker template path found')
  }

  const workerRuntimeTestingSetupPath = Deno.env.get('WORKER_RUNTIME_TESTING_SETUP_PATH')
  if (!workerRuntimeTestingSetupPath) {
    throw new Error('no worker template path found')
  }

  const workerRuntimeNoTestsSetupPath = Deno.env.get('WORKER_RUNTIME_NO_TESTS_SETUP_PATH')
  if (!workerRuntimeNoTestsSetupPath) {
    throw new Error('no worker template path found')
  }

  const jobDir = path.join(sandboxDir, jobId)
  await fs.mkdir(jobDir)

  const workerRuntimeSetupBuffer = await fs.readFile(workerRuntimeSetupPath)
  const workerRuntimeSetupScript = workerRuntimeSetupBuffer.toString()

  const workerRuntimeTestingSetupBuffer = await fs.readFile(workerRuntimeTestingSetupPath)
  const workerRuntimeTestingSetupScript = workerRuntimeTestingSetupBuffer.toString()

  const workerRuntimeNoTestsSetupBuffer = await fs.readFile(workerRuntimeNoTestsSetupPath)
  const workerRuntimeNoTestsSetupScript = workerRuntimeNoTestsSetupBuffer.toString()

  try {
    const workerFile = path.join(jobDir, 'worker.mjs')
    const userFile = path.join(jobDir, 'code-function.mjs')
    await fs.writeFile(userFile, code)

    const envObj = {
      NODE_ENV: testing ? 'testing' : 'development'
    }

    const jsonStr = JSON.stringify(envObj)
    const base64Env = Buffer.from(jsonStr).toString('base64')
    const envInjectCode = `
    import.meta.env = JSON.parse(
      new TextDecoder("utf-8").decode(
        (await import('node:buffer')).Buffer.from("${base64Env}", "base64")
      )
    );
    Object.freeze(import.meta.env);
    `

    const userFileUrl = pathToFileURL(userFile)

    const wrappedCode = functionInput
      ? `
    ;(await (async () => {
      try {
        const module = await import("${userFileUrl.href}");

        // Check if module has a default export that's a function
        if (typeof module.default === 'function') {
          // Call the function with the input
          const input = ${JSON.stringify(functionInput)};
          const result = await module.default(input);

          // Send the result back
          globalThis.__SEND_RESULT__(result)
        } else {
          throw new Error('Module must export a default function');
        }
      } catch (err) {
        globalThis.process.emit("uncaughtException", err);
      }

      if (globalThis.___RUN_TESTS___) {
        await globalThis.___RUN_TESTS___();
      }
    })().finally(async () => {
      queueMicrotask(() => {
        globalThis.self.close();
      });
    }));
    `
      : `
    ;(await (async () => {
      try {
        await import("${userFileUrl.href}");
      } catch (err) {
        globalThis.process.emit("uncaughtException", err);
      }

      if (globalThis.___RUN_TESTS___) {
        await globalThis.___RUN_TESTS___();
      }
    })().finally(async () => {
      queueMicrotask(() => {
        globalThis.self.close();
      });
    }));
    `

    const finalWorkerCode =
      (testing ? workerRuntimeTestingSetupScript : workerRuntimeNoTestsSetupScript) +
      envInjectCode +
      workerRuntimeSetupScript +
      wrappedCode

    await fs.writeFile(workerFile, finalWorkerCode)

    // console.log('[worker] starting new worker', workerFile)
    /*
     * @note Reference the following for permissions
     * https://docs.deno.com/api/deno/~/Deno.PermissionOptionsObject
     */
    const worker = new Worker(pathToFileURL(workerFile).href, {
      type: 'module',
      deno: {
        permissions: {
          env: false,
          ffi: false,
          import: true,
          net: true,
          read: [jobDir],
          run: false,
          sys: false,
          write: [jobDir]
        }
      }
    } as DenoWorkerOptions)

    worker.onmessage = (e) => {
      const {type, kind, payload, result} = e.data
      // console.log('[worker event]', e)
      console.log(`[worker] ${JSON.stringify(e.data)}`)
      if (type === 'log') {
        if (typeof payload !== 'string') {
          throw new Error(`Expected log payload to be string, got ${typeof payload}`)
        }
        const payloadMessage = payload
        const msg: JobLogMessage = {
          type: 'job-log',
          kind,
          jobId,
          log: payloadMessage
        }
        sendMessage(msg)
      }
      if (type === 'test') {
        const msg: JobTestMessage = {
          type: 'job-test',
          jobId,
          status: payload.status,
          name: payload.name,
          eventTimestamp: payload.eventTimestamp,
          message: payload.message,
          duration: payload.duration
        }
        sendMessage(msg)
      }
      if (type === 'exception') {
        const msg: JobExceptionMessage = {
          type: 'job-exception',
          kind,
          jobId,
          exception: payload
        }
        sendMessage(msg)
      }
      if (type === 'result') {
        if (typeof payload !== 'string') {
          throw new Error(`Expected result payload to be string, got ${typeof payload}`)
        }
        const payloadMessage = payload
        
        // Check if result is large and needs file-based IPC
        if (payloadMessage.length >= LARGE_PAYLOAD_THRESHOLD) {
          // Large result - write to file and send wrapper
          writeLargePayload(jobId, payloadMessage)
            .then((fileName) => {
              const wrapperMsg: LargePayloadMessage = {
                type: 'large-payload',
                originalMessage: 'job-result',
                filePath: fileName,
                jobId,
                timestamp: Date.now()
              }
              sendMessage(wrapperMsg)

              // Send actual job result message without the large payload
              const resultMsg: JobResultMessage = {
                type: 'job-result',
                jobId,
                result: '' // Empty - actual result is in file
              }
              sendMessage(resultMsg)
            })
            .catch((err: unknown) => {
              console.log('Error writing large result to file:', err)
              // Fallback: send truncated result
              const truncatedPayload = `${payloadMessage.slice(0, LARGE_PAYLOAD_THRESHOLD)}...[truncated due to error]`
              const msg: JobResultMessage = {
                type: 'job-result',
                jobId,
                result: truncatedPayload
              }
              sendMessage(msg)
            })
        } else {
          // Small result - use existing direct approach
          const msg: JobResultMessage = {
            type: 'job-result',
            jobId,
            result: payloadMessage
          }
          sendMessage(msg)
        }
      }
      if (type === 'complete') {
        clearTimeout(timeout)
        worker.terminate()
        const msg: JobStatusMessage = {
          type: 'job-status',
          jobId,
          status: 'completed'
        }
        sendMessage(msg)
      }
    }

    worker.onmessageerror = (err) => {
      // console.log('[error][worker error]', err)
      // clearTimeout(timeout)
      const msg: JobExceptionMessage = {
        type: 'job-exception',
        kind: 'exception',
        jobId,
        exception: 'message' in err ? (err.message as string) : 'Unknown Error'
      }
      sendMessage(msg)
      // worker.terminate()
    }

    function formatErrorEvent(ev: ErrorEvent): string {
      // If there's a real Error object with a stack, use that
      if (ev.error instanceof Error && typeof ev.error.stack === 'string') {
        return ev.error.stack
      }

      // Otherwise, build a single‑line fallback:
      return `${ev.message}\n    at ${ev.filename}:${ev.lineno}:${ev.colno}`
    }

    worker.onerror = (err) => {
      console.log('[error][worker error]', err)
      console.log(`string inspect (${util.inspect(err)})`)
      // clearTimeout(timeout)
      // if (err.error) {
      const msg: JobExceptionMessage = {
        type: 'job-exception',
        kind: 'exception',
        jobId,
        exception: {
          name: 'error',
          message: err.message,
          stack: formatErrorEvent(err)
        }
      }
      sendMessage(msg)
      // }
      // sendMessage({
      //   type: 'job-status',
      //   jobId,
      //   status: 'failed',
      //   error: err && typeof err === 'object' && 'message' in err ? (err.message as string) : 'Unknown Error'
      // })
      // worker.terminate()
    }

    sendMessage({type: 'job-status', jobId, status: 'running'})

    const timeout = setTimeout(() => {
      console.log('worker timedout')
      worker.terminate()
      const msg: JobStatusMessage = {
        type: 'job-status',
        jobId,
        status: 'timeout',
        error: 'VM reached max time of execution allowed, timed out.'
      }
      sendMessage(msg)
    }, JOB_TIMEOUT_MS)
  } catch (err) {
    console.log('caught err', err)
    const errReason =
      err && typeof err === 'object' && 'message' in err ? (err.message as string) : 'Unknown Error'

    const msg: JobStatusMessage = {
      type: 'job-status',
      jobId,
      status: 'failed',
      error: errReason
    }

    sendMessage(msg)
  }
}

function sendMessage(message: SandboxMessage) {
  globalThis.process.stdout.write(encodeMessage(message))
}

// Helper functions for large payload handling
async function readLargePayload(filePath: string): Promise<string> {
  const ipcDir = globalThis.Deno.env.get('IPC_DIR')
  if (!ipcDir) {
    console.log('[worker] ERROR: IPC_DIR environment variable not set')
    throw new Error('IPC_DIR environment variable not set')
  }

  const fullPath = path.join(ipcDir, filePath)
  console.log('[worker] Reading large payload from:', fullPath)

  try {
    const content = await fs.readFile(fullPath, 'utf8')
    console.log('[worker] Successfully read file, content length:', content.length)
    await fs.unlink(fullPath) // Cleanup after reading
    console.log('[worker] Cleaned up file:', fullPath)
    return content
  } catch (error) {
    console.log('[worker] Error reading large payload file:', error)
    throw error
  }
}

async function writeLargePayload(jobId: string, content: string): Promise<string> {
  const ipcDir = globalThis.Deno.env.get('IPC_DIR')
  if (!ipcDir) {
    throw new Error('IPC_DIR environment variable not set')
  }

  const timestamp = Date.now()
  const fileName = `${timestamp}.${jobId}.output.json`
  const fullPath = path.join(ipcDir, fileName)

  await fs.writeFile(fullPath, content, 'utf8')
  return fileName
}

// Add at the bottom of sandbox.ts instead of main().catch(...)
const importMeta = import.meta as unknown
if (importMeta && typeof importMeta === 'object' && 'main' in importMeta && importMeta.main) {
  // Detect if we're the main module being executed directly
  main().catch((err: unknown) => {
    console.log('Sandbox fatal error:', err)
    // process.exit(1)
  })
} else {
  // Add this if you need to export functionality for other modules
  console.info('sandbox.ts loaded as module - execution prevented')
}
