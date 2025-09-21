import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function readFixture(name: string) {
  const p = path.join(__dirname, '..', 'fixtures', name)
  const buf = fs.readFileSync(p)
  return new Uint8Array(buf)
}
