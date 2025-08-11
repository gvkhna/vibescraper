import {makeWorkerUtils, parseCronItems, type Runner} from 'graphile-worker'
import {run} from 'graphile-worker'
import {WorkerPreset, Logger, type LogFunctionFactory} from 'graphile-worker'
import debug from 'debug'
import {PRIVATE_VARS} from '@/vars.private'
import {exampleTask} from './tasks/example'
import {z} from 'zod'

const log = debug('app:graphile')

const logFactory: LogFunctionFactory = (scope) => {
  return (level, message, meta) => {
    log(level, message, scope, meta)
  }
}

const preset: GraphileConfig.Preset = {
  extends: [WorkerPreset],
  worker: {
    connectionString: PRIVATE_VARS.DATABASE_URL,
    taskDirectory: '',
    maxPoolSize: 10,
    pollInterval: 2000,
    preparedStatements: true,
    schema: 'graphile_worker',
    crontabFile: 'crontab',
    concurrentJobs: 1,
    logger: new Logger(logFactory)
    // fileExtensions: ['.js', '.cjs', '.mjs', '.ts']
  }
}

export default preset

// Define task structure
type Task<TName extends string, TSchema extends z.ZodType> = {
  taskName: TName
  schema: TSchema
  handler: (payload: z.infer<TSchema>) => Promise<void>
}

// Single source of truth - just add tasks to this array
const tasks = [exampleTask] as const

// Transform array to object for graphile
const taskList = tasks.reduce<Record<string, unknown>>((acc, task) => {
  acc[task.taskName] = task.handler
  return acc
}, {})

// Infer types from the tasks array
type Tasks = (typeof tasks)[number]
type JobName = Tasks['taskName']
type JobPayloadMap = {
  [K in Tasks as K['taskName']]: z.infer<K['schema']>
}

let runner: Runner | null = null
let workerUtils: Awaited<ReturnType<typeof makeWorkerUtils>> | null = null

export async function startWorker() {
  if (runner) {
    log('Worker already running')
    return runner
  }

  runner = await run({
    preset,
    taskList: taskList as never
    // parsedCronItems: parseCronItems([
    //   {
    //     task: 'example',
    //     match: '* * * * *',
    //     payload: {input: 'hello'}
    //   }
    // ])
  })
  await runner.promise
  return runner
}

export async function stopWorker() {
  if (runner) {
    await runner.stop()
    runner = null
    log('Worker stopped')
  }
}

export async function getWorkerUtils() {
  workerUtils ??= await makeWorkerUtils({
    connectionString: PRIVATE_VARS.DATABASE_URL,
    schema: 'graphile_worker'
  })
  return workerUtils
}

// Helper to add jobs with type safety and validation
export async function addJob<T extends JobName>(
  taskIdentifier: T,
  payload: JobPayloadMap[T],
  options?: {
    runAt?: Date
    priority?: number
    maxAttempts?: number
    queueName?: string
  }
) {
  // Find the task and validate payload
  const task = tasks.find((t) => t.taskName === taskIdentifier)
  if (!task) {
    log(`Task "${taskIdentifier}" not found`)
    return
  }

  const parsed = task.schema.safeParse(payload)
  if (!parsed.success) {
    log(`Invalid payload for task "${taskIdentifier}":`, z.treeifyError(parsed.error))
    return
  }

  const utils = await getWorkerUtils()
  return utils.addJob(taskIdentifier, parsed.data as never, options)
}

// Cleanup function
export async function cleanupWorker() {
  await stopWorker()
  if (workerUtils) {
    await workerUtils.release()
    workerUtils = null
  }
}
