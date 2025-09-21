/* eslint-disable no-console */
import { execSync } from 'node:child_process'
import process from 'node:process'

export default async function globalSetup() {
  try {
    // Get the version info (string with deno, v8, typescript versions)
    const versionOutput = execSync('deno --version', { encoding: 'utf8' }).trim()

    // Get the path to the Deno binary
    let denoPath: string
    try {
      denoPath = execSync(process.platform === 'win32' ? 'where deno' : 'which deno', {
        encoding: 'utf8'
      }).trim()
    } catch {
      denoPath = '<unknown>'
    }

    console.log(`[GLOBAL SETUP] Deno: ${denoPath}`)
    console.log(`[GLOBAL SETUP] Version:\n${versionOutput}`)
  } catch {
    throw new Error('Deno is required for integration tests but was not found in PATH.')
  }
}
