// spawn-server.ts
import {type ChildProcess, spawn, execSync} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import {ESLint} from 'eslint'
import {
  decodeMessage,
  encodeMessage,
  type JobExceptionMessage,
  type JobLogMessage,
  type JobResultMessage,
  type JobStatusMessage,
  type JobTestMessage,
  type NewJobMessage,
  type LargePayloadMessage,
  type SandboxMessage
} from './sandbox-worker'
import {nowait, simpleId} from './utils'
import {access, mkdir, writeFile} from 'node:fs/promises'
import {constants} from 'node:fs'
import {rule as prefixRule} from './sandbox-eslint-prefix-imports'
import {rule as nodeFetchRule} from './sandbox-eslint-node-fetch'
import SandboxWorkerScriptRaw from './sandbox-worker.ts?raw'
import WorkerRuntimeSetupRaw from './worker-runtime-setup.mjs?raw'
import WorkerRuntimeTestingSetupRaw from './worker-runtime-testing-setup.mjs?raw'
import WorkerRuntimeNoTestsSetupRaw from './worker-runtime-no-tests-setup.mjs?raw'

export type Logger = (...args: unknown[]) => void

// const __cwd = globalThis.process.cwd()

export type CodeExecutionMessage =
  | CodeExecutionStartMessage
  | CodeExecutionStatusMessage
  | CodeExecutionLogMessage
  | CodeExecutionExceptionMessage
  | CodeExecutionTestMessage
  | CodeExecutionResultMessage

export interface CodeExecutionStartMessage {
  codeExecutionId: string
  messageId: string
  type: 'start'
  startedAt: number
}

export interface CodeExecutionStatusMessage {
  codeExecutionId: string
  messageId: string
  type: 'status'
  completedAt?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout'
  error?: string
}

export interface CodeExecutionResultMessage {
  codeExecutionId: string
  messageId: string
  type: 'result'
  completedAt?: number
  result: string | null
}

export interface CodeExecutionLogMessage {
  codeExecutionId: string
  messageId: string
  type: 'log'
  timestamp: number
  kind: 'log' | 'info' | 'warn' | 'error' | 'debug'
  log: string
}

export interface CodeExecutionTestMessage {
  codeExecutionId: string
  messageId: string
  type: 'test'
  status: 'passed' | 'failed' | 'running' | 'skipped'
  name: string
  eventTimestamp: number
  message: string
  duration: number
}

export interface CodeExecutionExceptionMessage {
  codeExecutionId: string
  messageId: string
  type: 'exception'
  timestamp: number
  exception:
    | string
    | {
        name: string
        message: string
        stack: string
      }
}

export interface SandboxWorkerJob {
  id: string
  code: string
  status: JobStatusMessage['status']
  // logs: CodeExecutionLogMessage | CodeExecutionExceptionMessage[]
  createdAt: number
  completedAt?: number
  error?: string
}

export class SandboxManager extends EventTarget {
  private readonly tmpDir: string
  private readonly sandboxDir: string
  private readonly denoDir: string
  private readonly ipcDir: string
  private readonly sandboxWorkerScriptPath: string
  private readonly workerRuntimeSetupPath: string
  private readonly workerRuntimeTestingSetupPath: string
  private readonly workerRuntimeNoTestsSetupPath: string
  private child: ChildProcess | null = null
  private jobs = new Map<string, SandboxWorkerJob>()
  private activeJobs = new Set<string>()
  private log: Logger
  private denoPath: string | null = null
  private shouldCleanup: boolean

  // IPC constants
  private readonly LARGE_PAYLOAD_THRESHOLD = 256

  constructor(
    tmpDir_: string,
    logger?: Logger,
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    nodeEnv: string = 'development',
    private readonly sandboxWorkerScriptRaw: string = SandboxWorkerScriptRaw,
    private readonly workerRuntimeSetupRaw: string = WorkerRuntimeSetupRaw,
    private readonly workerRuntimeTestingSetupRaw: string = WorkerRuntimeTestingSetupRaw,
    private readonly workerRuntimeNoTestsSetupRaw: string = WorkerRuntimeNoTestsSetupRaw
  ) {
    super()

    // Set cleanup flag based on environment
    this.shouldCleanup = nodeEnv !== 'development'

    // Default to console.log if no logger provided
    this.log =
      logger ??
      ((...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.log('[SandboxManager]', ...args)
      })

    this.log(`Initializing with NODE_ENV=${nodeEnv}, cleanup=${this.shouldCleanup ? 'enabled' : 'disabled'}`)
    // this.startSandbox()

    this.tmpDir = path.resolve(tmpDir_, 'sandbox')
    this.denoDir = path.resolve(this.tmpDir, 'deno_dir')
    this.sandboxDir = path.join(this.tmpDir, 'vm')
    this.ipcDir = path.resolve(this.tmpDir, 'ipc')

    this.sandboxWorkerScriptPath = path.join(this.tmpDir, 'sandbox-worker.ts')
    this.workerRuntimeSetupPath = path.join(this.tmpDir, 'worker-runtime-setup.mjs')
    this.workerRuntimeTestingSetupPath = path.join(this.tmpDir, 'worker-runtime-testing-setup.mjs')
    this.workerRuntimeNoTestsSetupPath = path.join(this.tmpDir, 'worker-runtime-no-tests-setup.mjs')

    // this.initialize()
    //   .then(() => this.startSandbox())
    //   .catch((err) => {
    //     console.error('Failed to initialize sandbox:', err)
    //     // process.exit(1)
    //   })

    // Check for Deno CLI availability
    this.checkDenoAvailability()

    // Immediately create IPC directory for large payload support
    nowait(this.createIpcDirectory(), this.log)

    nowait(this.startSandbox(), this.log)
    // this.setupCleanupInterval()
  }

  // Public method to ensure sandbox is ready
  public async waitForReady(): Promise<void> {
    // Wait up to 10 seconds for child process to be ready
    const maxWaitTime = 10000
    const startTime = Date.now()

    while (!this.child?.stdin) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Sandbox failed to start within 10 seconds')
      }
      this.log('Waiting for sandbox child process to be ready...')
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.log('Sandbox is ready')
  }

  private checkDenoAvailability(): void {
    try {
      // Try to get Deno version to verify it's installed
      const result = execSync('deno --version', {encoding: 'utf8'})
      this.log('Deno found:', result.split('\n')[0])

      // Try to get the path to Deno executable
      try {
        const denoPath = execSync('which deno', {encoding: 'utf8'}).trim()
        this.denoPath = denoPath
        this.log('Deno path:', denoPath)
      } catch {
        // On Windows, 'which' might not work, try 'where'
        try {
          const denoPath = execSync('where deno', {encoding: 'utf8'}).split('\n')[0].trim()
          this.denoPath = denoPath
          this.log('Deno path:', denoPath)
        } catch {
          // Deno is in PATH but we couldn't get the exact path
          this.denoPath = 'deno'
        }
      }
    } catch (error) {
      const errorMessage =
        `Deno CLI is not installed or not in PATH. SandboxManager requires Deno to execute sandboxed code.\n` +
        `Please install Deno from https://deno.land/ and ensure it's in your PATH.\n` +
        `Error: ${error}`
      this.log('ERROR:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  private async createIpcDirectory() {
    try {
      await mkdir(this.ipcDir, {recursive: true})
      await this.cleanupOrphanedIpcFiles()
      this.log(`Created IPC directory: ${this.ipcDir}`)
    } catch (err) {
      this.log('Error creating IPC directory:', err)
    }
  }

  private async initialize() {
    // Create TMP_DIR if it doesn't exist
    await mkdir(this.tmpDir, {recursive: true})
    await mkdir(this.sandboxDir, {recursive: true})
    await mkdir(this.ipcDir, {recursive: true})

    // Cleanup any orphaned IPC files from previous runs
    await this.cleanupOrphanedIpcFiles()

    await writeFile(this.sandboxWorkerScriptPath, this.sandboxWorkerScriptRaw)
    this.log(`Created worker script at ${this.sandboxWorkerScriptPath}`)

    try {
      await access(this.sandboxWorkerScriptPath, constants.R_OK | constants.W_OK)
    } catch (err) {
      throw new Error(`Sandbox Worker Script not accessible: ${err}`)
    }

    await writeFile(this.workerRuntimeSetupPath, this.workerRuntimeSetupRaw)
    this.log(`Created worker-runtime script at ${this.workerRuntimeSetupPath}`)

    try {
      await access(this.workerRuntimeSetupPath, constants.R_OK | constants.W_OK)
    } catch (err) {
      throw new Error(`Worker Runtime Setup script not accessible: ${err}`)
    }

    await writeFile(this.workerRuntimeTestingSetupPath, this.workerRuntimeTestingSetupRaw)
    this.log(`Created worker-runtime-testing script at ${this.workerRuntimeTestingSetupPath}`)

    try {
      await access(this.workerRuntimeTestingSetupPath, constants.R_OK | constants.W_OK)
    } catch (err) {
      throw new Error(`Worker Runtime Setup script not accessible: ${err}`)
    }

    await writeFile(this.workerRuntimeNoTestsSetupPath, this.workerRuntimeNoTestsSetupRaw)
    this.log(`Created worker-runtime-no-tests script at ${this.workerRuntimeNoTestsSetupPath}`)

    try {
      await access(this.workerRuntimeNoTestsSetupPath, constants.R_OK | constants.W_OK)
    } catch (err) {
      throw new Error(`Worker Runtime Setup script not accessible: ${err}`)
    }
  }

  private async startSandbox() {
    await this.initialize()

    // Use the detected Deno path or fallback to 'deno'
    const denoCommand = this.denoPath ?? 'deno'

    this.child = spawn(
      denoCommand,
      [
        'run',
        `--allow-read=${this.tmpDir},${this.denoDir},${this.sandboxDir},${this.ipcDir}`,
        `--allow-write=${this.sandboxDir},${this.denoDir},${this.ipcDir}`,
        '--allow-net',
        '--unstable-worker-options',
        '--no-prompt',
        '--allow-import',
        '--allow-env',
        `--v8-flags=--max-heap-size=256,--max-old-space-size=256`,
        // '--inspect=127.0.0.1:9229',
        this.sandboxWorkerScriptPath
      ],
      {
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: {
          HOME: globalThis.process.env.HOME ?? this.sandboxDir,
          DENO_DIR: this.denoDir,
          DENO_NO_PACKAGE_JSON: '1',
          DENO_NO_PROMPT: '1',
          DENO_NO_UPDATE_CHECK: '1',
          PATH: globalThis.process.env.PATH,
          SANDBOX_DIR: this.sandboxDir,
          IPC_DIR: this.ipcDir,
          WORKER_RUNTIME_SETUP_PATH: this.workerRuntimeSetupPath,
          WORKER_RUNTIME_TESTING_SETUP_PATH: this.workerRuntimeTestingSetupPath,
          WORKER_RUNTIME_NO_TESTS_SETUP_PATH: this.workerRuntimeNoTestsSetupPath
        }
      }
    )

    this.child.unref()

    // log('this child', this.child)

    this.child.stdout?.setEncoding('utf8')
    this.child.stderr?.setEncoding('utf8')

    this.child.stdout?.on('data', (data) => {
      this.log('child stdout data', data)
      if (typeof data === 'string') {
        this.handleSandboxOutput(data)
      }
    })
    this.child.stderr?.on('data', (data) => {
      this.log('child stderr data', data)
      this.log('[Sandbox Error]', data)
    })

    this.child.on('close', (code) => {
      this.log(`Sandbox exited with code ${code}, restarting...`)

      // STEP 1: Mark all *active* jobs as failed
      for (const jobId of this.activeJobs) {
        const job = this.jobs.get(jobId)
        if (!job) {
          continue
        }
        // The job might already be completed, but if it's still marked 'pending' or 'running',
        // we treat it as a crash-failure:
        if (job.status === 'pending' || job.status === 'running') {
          job.status = 'failed'
          job.error = `VM encountered a fatal error, out of memory or system resources exhausted. (exit code ${code ?? 1})`
          job.completedAt = Date.now()

          // Emit the same shape as a 'job-status' message so the generator sees it
          const msg: JobStatusMessage = {
            type: 'job-status',
            jobId,
            status: 'failed',
            error: job.error
          }
          // This triggers the generator's listener
          this.dispatchEvent(new CustomEvent('job-status', {detail: msg}))

          // Optionally do final cleanup
          nowait(this.cleanupJob(jobId), this.log)
        }
      }
      // STEP 2: Clear them from activeJobs
      this.activeJobs.clear()
      setTimeout(() => {
        nowait(this.startSandbox(), this.log)
      }, 1500)
    })
  }

  private pendingLargeResults = new Map<string, {filePath: string; timestamp: number}>()

  private handleSandboxOutput(data: string) {
    const text = data
    const lines = text.split('\n')

    this.log(`handleSandboxOutput: received ${lines.length} lines, total length: ${text.length}`)

    for (const line of lines) {
      if (line.trim() === '') {
        continue
      }

      try {
        const message = decodeMessage(line)
        if (!message) {
          if (line.trim()) {
            this.log('handleSandboxOutput: failed to decode line:', line.substring(0, 100))
          }
          continue
        }

        this.log('handleSandboxOutput: decoded message type:', message.type, 'jobId:', message.jobId || 'N/A')

        // Existing message handling logic...
        switch (message.type) {
          case 'new-job':
            break
          case 'large-payload': {
            const msg: LargePayloadMessage = message
            if (msg.originalMessage === 'job-result') {
              // Store large result info for the job
              this.pendingLargeResults.set(msg.jobId, {
                filePath: msg.filePath,
                timestamp: msg.timestamp
              })
            }
            break
          }
          case 'job-status': {
            const msg: JobStatusMessage = message
            this.updateJobStatus(msg)
            break
          }
          case 'job-log': {
            const msg: JobLogMessage = message
            this.addJobLog(msg)
            break
          }
          case 'job-test': {
            const msg: JobTestMessage = message
            this.addJobTest(msg)
            break
          }
          case 'job-exception': {
            const msg: JobExceptionMessage = message
            this.addJobException(msg)
            break
          }
          case 'job-result': {
            const msg: JobResultMessage = message
            // Check if this job has a pending large result
            const largeResult = this.pendingLargeResults.get(msg.jobId)

            if (largeResult) {
              // For large results, DON'T dispatch the empty result
              // Instead, read the file and dispatch the enhanced result
              this.log('Large result detected for job:', msg.jobId, 'Reading from:', largeResult.filePath)
              this.readLargeResult(largeResult.filePath)
                .then((actualResult) => {
                  this.log('Successfully read large result, length:', actualResult.length)
                  const enhancedMessage: JobResultMessage = {
                    ...msg,
                    result: actualResult
                  }
                  this.pendingLargeResults.delete(msg.jobId) // Cleanup
                  this.log('Dispatching enhanced job-result with large payload')
                  this.addJobResult(enhancedMessage)
                })
                .catch((e: unknown) => {
                  this.log('Error reading large result file:', e)
                  this.pendingLargeResults.delete(msg.jobId) // Cleanup on error
                  // On error, dispatch empty result so generator doesn't hang
                  this.addJobResult(msg)
                })
              // DON'T dispatch anything here - wait for async read
            } else {
              // Normal small result processing
              this.addJobResult(msg)
            }
            break
          }
          default: {
            // This block enforces exhaustiveness. If a new event type is added to SandboxMessage,
            // TypeScript will flag this as an error until you handle it.
            const _exhaustive: never = message
            throw new Error(`Unhandled event type: ${JSON.stringify(_exhaustive)}`)
          }
        }
      } catch (err) {
        this.log('Error processing message:', err)
      }
    }
  }

  private async readLargeResult(filePath: string): Promise<string> {
    const fullPath = path.join(this.ipcDir, filePath)
    const content = await fs.readFile(fullPath, 'utf8')

    // Clean up the file after reading if in production mode
    if (this.shouldCleanup) {
      await fs.unlink(fullPath).catch(() => {
        this.log(`[cleanup] Failed to remove large result file: ${filePath}`)
      })
    }

    return content
  }

  // Update status handler to trigger cleanup
  private updateJobStatus(message: JobStatusMessage) {
    const {jobId, status, error} = message
    // jobId: string, status: SandboxWorkerJob['status'], error?: string
    const job = this.jobs.get(jobId)
    if (job) {
      job.status = status

      if (['completed', 'failed', 'timeout'].includes(status)) {
        job.completedAt = Date.now()
        this.activeJobs.delete(jobId)
        nowait(this.cleanupJob(jobId), this.log) // Immediate cleanup
      }

      if (error) {
        job.error = error
      }

      const statusNotification: JobStatusMessage = {
        jobId: jobId,
        status: status,
        type: 'job-status',
        error: job.error,
        completedAt: job.completedAt
      }

      this.dispatchEvent(new CustomEvent('job-status', {detail: statusNotification}))
    }
  }

  private addJobLog(message: JobLogMessage) {
    const {jobId} = message
    const job = this.jobs.get(jobId)
    if (job) {
      this.dispatchEvent(new CustomEvent('job-log', {detail: message}))
    }
  }

  private addJobException(message: JobExceptionMessage) {
    const {jobId} = message
    const job = this.jobs.get(jobId)
    if (job) {
      this.dispatchEvent(new CustomEvent('job-exception', {detail: message}))
    }
  }

  private addJobResult(message: JobResultMessage) {
    const {jobId} = message
    const job = this.jobs.get(jobId)
    if (job) {
      this.dispatchEvent(new CustomEvent('job-result', {detail: message}))
    }
  }

  private addJobTest(message: JobTestMessage) {
    const {jobId} = message
    const job = this.jobs.get(jobId)
    if (job) {
      this.dispatchEvent(new CustomEvent('job-test', {detail: message}))
    }
  }

  // Add cleanup method
  private async cleanupJob(jobId: string) {
    if (!this.shouldCleanup) {
      this.log(`[cleanup] Skipping cleanup for job ${jobId} (development mode)`)
      return
    }

    const jobDir = path.join(this.sandboxDir, jobId)
    try {
      // Clean up the job directory
      await fs.rm(jobDir, {recursive: true, force: true})

      // Clean up any IPC files for this job (input/output files)
      await this.cleanupIpcFilesForJob(jobId)

      // Clean up in-memory references
      this.pendingLargeResults.delete(jobId)
      this.jobs.delete(jobId)

      this.log(`[cleanup] Cleared job ${jobId}`)
    } catch (err) {
      this.log(`[cleanup] Failed for ${jobId}:`, err)
    }
  }

  // Cleanup IPC files for a specific job
  private async cleanupIpcFilesForJob(jobId: string) {
    if (!this.shouldCleanup) {
      return
    }

    try {
      const files = await fs.readdir(this.ipcDir)
      const jobFiles = files.filter((f) => f.includes(`.${jobId}.`))

      for (const file of jobFiles) {
        const filePath = path.join(this.ipcDir, file)
        await fs.unlink(filePath).catch(() => {}) // Ignore errors for missing files
        this.log(`[cleanup] Removed IPC file: ${file}`)
      }
    } catch (err) {
      this.log(`[cleanup] Error cleaning IPC files for job ${jobId}:`, err)
    }
  }

  // Cleanup all orphaned IPC files (called on sandbox restart)
  private async cleanupOrphanedIpcFiles() {
    if (!this.shouldCleanup) {
      this.log('[cleanup] Skipping orphaned IPC file cleanup (development mode)')
      return
    }

    try {
      const files = await fs.readdir(this.ipcDir)
      for (const file of files) {
        const filePath = path.join(this.ipcDir, file)
        await fs.unlink(filePath).catch(() => {}) // Ignore errors
      }
      this.log(`[cleanup] Cleared ${files.length} orphaned IPC files`)
    } catch (err) {
      this.log('[cleanup] Error cleaning orphaned IPC files:', err)
    }
  }

  async lintFixCode(code: string): Promise<string> {
    this.log('starting code:', code)
    const eslint = new ESLint({
      fix: true,
      overrideConfigFile: true,
      ignore: false,
      allowInlineConfig: false,
      overrideConfig: {
        languageOptions: {
          parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module'
          }
        },
        rules: {'deno-compat/prefix-imports': 'error'}
        // rules: {'deno-compat/prefix-imports': 'error', 'deno-compat/remove-legacy-fetch': 'error'}
      },
      plugins: {
        'deno-compat': {
          rules: {'prefix-imports': prefixRule}
          // rules: {'prefix-imports': prefixRule, 'remove-legacy-fetch': nodeFetchRule}
        }
      }
    })

    // const cfg = await eslint.calculateConfigForFile('virtual.js')
    // log('Effective ESLint config for this run ->', cfg)

    const [result] = await eslint.lintText(code, {filePath: 'virtual.js'})
    this.log('eslint error count', result.errorCount, result.warningCount)
    this.log('eslint fixable', result.fixableErrorCount, result.fixableWarningCount)
    this.log(
      'eslint messages: ',
      result.messages.map((m) => ({
        rule: m.ruleId,
        msg: m.message,
        hasFix: Boolean(m.fix)
      }))
    )

    if (!result.output) {
      this.log('eslint fix failed returning original code')
      return code
    }
    this.log('modified code returned: ', result.output)
    return result.output
  }

  async *executeCode(
    code: string,
    testing = false,
    functionInput?: unknown[]
  ): AsyncGenerator<CodeExecutionMessage, void, void> {
    const jobId = simpleId()
    const job: SandboxWorkerJob = {
      id: jobId,
      code,
      status: 'pending',
      // logs: [],
      createdAt: Date.now()
    }

    this.jobs.set(jobId, job)
    this.activeJobs.add(jobId)

    const transformedCode = await this.lintFixCode(code)

    // Check if we need to use file-based IPC for large inputs
    let messageToSend: NewJobMessage | LargePayloadMessage

    // Calculate size of stringified input for threshold check
    const stringifiedInput = functionInput ? JSON.stringify(functionInput) : null
    const inputSize = stringifiedInput ? stringifiedInput.length : 0

    if (stringifiedInput && inputSize >= this.LARGE_PAYLOAD_THRESHOLD) {
      // Large input - write to file and send wrapper message
      const timestamp = Date.now()
      const fileName = `${timestamp}.${jobId}.input.json`
      const filePath = path.join(this.ipcDir, fileName)

      this.log('Large input detected, writing to file:', fileName, 'size:', inputSize)

      // Ensure IPC directory exists before writing
      await mkdir(this.ipcDir, {recursive: true})
      // Write the JSON array directly to the file
      await writeFile(filePath, stringifiedInput, 'utf8')

      // Send wrapper message via stdin
      messageToSend = {
        type: 'large-payload',
        originalMessage: 'new-job',
        filePath: fileName,
        jobId,
        timestamp
      }

      // Also need to send the actual job message, but without functionInput
      const jobMessage: NewJobMessage = {
        type: 'new-job',
        jobId,
        code: transformedCode,
        testing
        // functionInput omitted - will be read from file
      }

      // First send the wrapper to indicate large payload coming
      const wrapperEncoded = encodeMessage(messageToSend)
      this.log(
        'Sending large payload wrapper, child exists:',
        !!this.child,
        'stdin exists:',
        !!this.child?.stdin
      )
      if (!this.child?.stdin) {
        this.log('ERROR: Cannot send message - child process or stdin not available')
        throw new Error('Sandbox child process not ready')
      }
      this.child.stdin.write(wrapperEncoded)

      // Then send the job message
      const jobEncoded = encodeMessage(jobMessage)
      this.log('Large payload: sent wrapper and job messages')
      this.child.stdin.write(jobEncoded)
    } else {
      // Small input - use existing direct approach
      const startMessage: NewJobMessage = {
        type: 'new-job',
        jobId,
        code: transformedCode,
        testing,
        functionInput
      }

      const encodedMessage = encodeMessage(startMessage)
      this.log(
        'Small payload: sending direct message, size:',
        inputSize,
        'child exists:',
        !!this.child,
        'stdin exists:',
        !!this.child?.stdin
      )
      if (!this.child?.stdin) {
        this.log('ERROR: Cannot send message - child process or stdin not available')
        throw new Error('Sandbox child process not ready')
      }
      this.child.stdin.write(encodedMessage)
      this.log('Small payload: message sent successfully')
    }

    const abortController = new AbortController()
    const queue: CodeExecutionMessage[] = []
    let resolveQueue: (() => void) | null = null

    const startNotification: CodeExecutionStartMessage = {
      type: 'start',
      messageId: simpleId(),
      codeExecutionId: jobId,
      startedAt: job.createdAt
    }

    queue.push(startNotification)

    // Listeners
    const listener = (event: Event) => {
      const msg = (event as CustomEvent<SandboxMessage>).detail
      this.log('listener message', msg)
      if (msg.jobId === jobId) {
        switch (msg.type) {
          case 'job-exception': {
            const logNotification: CodeExecutionExceptionMessage = {
              codeExecutionId: jobId,
              messageId: simpleId(),
              type: 'exception',
              timestamp: Date.now(),
              exception: msg.exception
            }
            queue.push(logNotification)
            break
          }
          case 'job-log': {
            const logNotification: CodeExecutionLogMessage = {
              codeExecutionId: jobId,
              messageId: simpleId(),
              type: 'log',
              timestamp: Date.now(),
              kind: msg.kind,
              log: msg.log
            }
            queue.push(logNotification)
            break
          }
          case 'job-test': {
            const testNotification: CodeExecutionTestMessage = {
              codeExecutionId: jobId,
              messageId: simpleId(),
              type: 'test',
              status: msg.status,
              eventTimestamp: msg.eventTimestamp,
              name: msg.name,
              message: msg.message,
              duration: msg.duration
            }
            queue.push(testNotification)
            break
          }
          case 'job-status': {
            const statusNotification: CodeExecutionStatusMessage = {
              codeExecutionId: jobId,
              messageId: simpleId(),
              type: 'status',
              status: msg.status,
              completedAt: msg.completedAt,
              error: msg.error
            }
            queue.push(statusNotification)
            break
          }
          case 'new-job': {
            break
          }
          case 'job-result': {
            this.log('Listener received job-result, result length:', msg.result.length || 0)
            const resultNotification: CodeExecutionResultMessage = {
              codeExecutionId: jobId,
              messageId: simpleId(),
              type: 'result',
              completedAt: Date.now(),
              result: msg.result
            }
            queue.push(resultNotification)
            break
          }
          case 'large-payload': {
            // This should never be reached since large-payload messages are handled above
            // in the main handleSandboxOutput switch. If we reach here, it's an error.
            this.log('ERROR: large-payload message reached event listener - this should not happen')
            break
          }
          default: {
            // This block enforces exhaustiveness. If a new event type is added to SandboxMessage,
            // TypeScript will flag this as an error until you handle it.
            const _exhaustive: never = msg
            throw new Error(`Unhandled event type: ${JSON.stringify(_exhaustive)}`)
          }
        }
      }
      // if (msg.type === 'job-status' && msg.jobId === jobId) {
      //   const statusNotification: CodeExecutionStatusMessage = {
      //     messageId: ulid(),
      //     type: 'status',
      //     status: msg.status,
      //     codeExecutionId: jobId,
      //     completedAt: msg.completedAt,
      //     error: msg.error
      //   }
      //   queue.push(statusNotification)
      // }
      // if (msg.type === 'job-log' && msg.jobId === jobId) {
      //   const logNotification: CodeExecutionLogMessage = {
      //     messageId: ulid(),
      //     timestamp: Date.now(),
      //     type: 'log',
      //     codeExecutionId: jobId,
      //     kind: msg.kind,
      //     log: msg.log
      //   }
      //   queue.push(logNotification)
      // }
      resolveQueue?.()
      // if (
      //   (msg.type === 'job-status' && msg.jobId === jobId) ||
      //   (msg.type === 'job-log' && msg.jobId === jobId)
      // ) {
      //   if (msg.type === )
      //   queue.push(msg)
      //   resolveQueue?.()
      // }
    }

    this.addEventListener('job-log', listener)
    this.addEventListener('job-status', listener)
    this.addEventListener('job-exception', listener)
    this.addEventListener('job-test', listener)
    this.addEventListener('job-result', listener)

    // Cleanup
    const cleanup = () => {
      this.removeEventListener('job-log', listener)
      this.removeEventListener('job-status', listener)
      this.removeEventListener('job-exception', listener)
      this.removeEventListener('job-test', listener)
      this.removeEventListener('job-result', listener)
      abortController.abort()
    }

    abortController.signal.addEventListener('abort', cleanup)

    // Track if we've seen an exception (which means no result will come)
    let hasSeenException = false

    try {
      while (true) {
        while (queue.length > 0) {
          const msg = queue.shift()!
          this.log('yielding msg', msg)
          yield msg

          // Track exceptions
          if (msg.type === 'exception') {
            hasSeenException = true
          }

          // Exit condition depends on whether we're executing a function or just code
          if (functionInput) {
            // For function execution, exit only when we get the result
            // The completed status will come before the result, so we just wait for result
            if (msg.type === 'result' && msg.result) {
              this.log('Function execution complete with result')
              return
            }
            // Also exit on completed status if we've seen an exception (no result will come)
            // Or on failed/timeout status
            if (msg.type === 'status' && ['completed', 'failed', 'timeout'].includes(msg.status)) {
              if (hasSeenException || msg.status !== 'completed') {
                this.log('Function execution ended:', msg.status, 'hasException:', hasSeenException)
                return
              }
              // If completed but no exception, keep waiting for result
            }
          } else {
            // For regular code execution, exit on completion status
            if (msg.type === 'status' && ['completed', 'failed', 'timeout'].includes(msg.status)) {
              this.log('Code execution complete')
              return
            }
          }
        }

        await new Promise<void>((resolve) => {
          resolveQueue = resolve
          // Don't add a new abort listener each time - it's already handled in cleanup
          if (abortController.signal.aborted) {
            resolve()
          }
        })
      }
    } finally {
      cleanup()
    }
  }

  async executeCodeBuffered(code: string, testing = false): Promise<CodeExecutionMessage[]> {
    const all: CodeExecutionMessage[] = []
    for await (const msg of this.executeCode(code, testing)) {
      all.push(msg)
    }
    return all
  }

  async executeFunctionBuffered(
    code: string,
    input: unknown[],
    testing = false
  ): Promise<{result?: unknown; messages: CodeExecutionMessage[]}> {
    const all: CodeExecutionMessage[] = []
    for await (const msg of this.executeCode(code, testing, input)) {
      all.push(msg)
    }

    // Extract the result from the messages
    const resultMessage = all.find((msg) => msg.type === 'result')

    if (resultMessage?.result && typeof resultMessage.result === 'string') {
      try {
        // Try to parse as JSON - if successful, return with result
        const parsedResult = JSON.parse(resultMessage.result)
        return {result: parsedResult, messages: all}
      } catch {
        // If JSON parsing fails, don't include result key
        return {messages: all}
      }
    }

    // If no result message, don't include result key
    return {messages: all}
  }

  // async executeCode(code: string): Promise<SandboxWorkerJob> {
  //   const jobId = ulid()
  //   const job: SandboxWorkerJob = {
  //     id: jobId,
  //     code,
  //     status: 'pending',
  //     logs: [],
  //     createdAt: Date.now()
  //   }

  //   const message: Message = {
  //     type: 'new-job',
  //     jobId,
  //     code
  //   }

  //   log('writing encoded message: ', jobId)
  //   this.child?.stdin?.write(encodeMessage(message))

  //   return new Promise((resolve) => {
  //     const listener = (updatedJob: SandboxWorkerJob) => {
  //       if (updatedJob.id === jobId && ['completed', 'failed', 'timeout'].includes(updatedJob.status)) {
  //         this.off('job-update', listener)
  //         resolve(updatedJob)
  //       }
  //     }
  //     this.on('job-update', listener)
  //   })
  // }
}

// export const sandboxManager = new SandboxManager()
