// shutdown.ts
import process from 'node:process'

type ShutdownTask = {
  name: string
  fn: () => Promise<void>
}

export class ShutdownManager {
  private tasks: ShutdownTask[] = []
  private shuttingDown = false
  private logger = (...args: unknown[]) => {}

  constructor(logger: (...args: unknown[]) => void) {
    // Wire up process signals/events
    process.on('SIGINT', () => {
      this.initiate('SIGINT')
    })
    process.on('SIGTERM', () => {
      this.initiate('SIGTERM')
    })
    process.on('beforeExit', () => {
      this.initiate('beforeExit')
    })
    process.on('uncaughtException', (err) => {
      this.logger('Uncaught exception:', err)
      this.initiate('uncaughtException')
    })
    process.on('unhandledRejection', (reason) => {
      this.logger('Unhandled rejection:', reason)
      this.initiate('unhandledRejection')
    })
  }

  /**
   * Register a task to be run on shutdown.
   */
  add(name: string, fn: () => Promise<void>): void {
    this.tasks.push({ name, fn })
  }

  private async shutdown() {
    for (const task of this.tasks) {
      try {
        this.logger(`→ Running task: ${task.name}`)
        await task.fn()
        this.logger(`✓ Completed task: ${task.name}`)
      } catch (err) {
        this.logger(`✗ Failed task: ${task.name}`, err)
      }
    }
    this.logger('All shutdown tasks completed. Exiting.')
  }

  /**
   * Trigger shutdown (runs tasks in series).
   */
  private initiate(source: string) {
    if (this.shuttingDown) {
      return
    }
    this.shuttingDown = true
    this.logger(`Received ${source}, shutting down...`)
    // eslint-disable-next-line no-void
    void this.shutdown()
  }
}
