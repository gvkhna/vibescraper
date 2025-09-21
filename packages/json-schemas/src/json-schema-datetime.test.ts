import { describe, expect, it, test } from 'vitest'

import { validateDataAgainstSchema } from './json-schema'

const dateTimeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    dt: { type: 'string', format: 'date-time' }
  },
  required: ['dt']
} as const

describe('jSON Schema date-time format', () => {
  it('accepts RFC3339 with Z (UTC)', () => {
    expect.assertions(1)

    const data = { dt: '2024-08-12T14:21:30Z' }
    const result = validateDataAgainstSchema(dateTimeSchema, data)

    expect(result.success).toBe(true)
  })

  it('accepts RFC3339 with timezone offset', () => {
    expect.assertions(1)

    const data = { dt: '2024-08-12T14:21:30+05:30' }
    const result = validateDataAgainstSchema(dateTimeSchema, data)

    expect(result.success).toBe(true)
  })

  it('rejects missing timezone (no Z or offset)', () => {
    expect.assertions(1)

    const data = { dt: '2024-08-12T14:21:30' } // no timezone
    const result = validateDataAgainstSchema(dateTimeSchema, data)

    expect(result.success).toBe(false)
  })

  it('rejects non-date-time strings', () => {
    expect.hasAssertions()

    const badSamples = [
      { dt: '2024-08-12' }, // date only
      { dt: 'invalid' } // not a date
    ]
    for (const sample of badSamples) {
      const result = validateDataAgainstSchema(dateTimeSchema, sample)

      expect(result.success).toBe(false)
    }
  })
})
