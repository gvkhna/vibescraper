#!/usr/bin/env node
import 'dotenv/config'
import process from 'node:process'
import {startWorker, cleanupWorker} from './graphile.config'

async function main() {
  console.log('Starting Graphile Worker in standalone mode...')

  // Handle shutdown signals
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`)
    await cleanupWorker()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  try {
    await startWorker()
    console.log('Worker is running. Press Ctrl+C to stop.')
  } catch (error) {
    console.error('Failed to start worker:', error)
    process.exit(1)
  }
}

main().catch(console.error)
