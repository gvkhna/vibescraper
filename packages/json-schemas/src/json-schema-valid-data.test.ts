import type { JsonObject, JsonValue } from 'type-fest'
import { describe, expect, it, test } from 'vitest'

import { validateDataAgainstSchema } from './json-schema'

describe('data Validation Against Schema Tests', () => {
  const simpleSchema: JsonObject = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number', minimum: 0 }
    },
    required: ['name']
  }

  it('valid data against schema', () => {
    expect.assertions(1)

    const data: JsonValue = {
      name: 'John Doe',
      age: 30
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    // console.log('Valid data:', result)

    expect(result.success).toBe(true)
  })

  it('missing required field', () => {
    expect.assertions(2)

    const data: JsonValue = {
      age: 30
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    // console.log('Missing required field:', result)

    expect(result.success).toBe(false)
    expect(result.message ?? '').toMatch(/required property 'name'/)
  })

  it('wrong type for field', () => {
    expect.assertions(3)

    const data: JsonValue = {
      name: 123, // Should be string
      age: 30
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    // console.log('Wrong type for field:', result)

    expect(result.success).toBe(false)
    expect(result.message ?? '').toContain('/name')
    expect(result.message ?? '').toMatch(/must be string/i)
  })

  it('value below minimum', () => {
    expect.assertions(2)

    const data: JsonValue = {
      name: 'John',
      age: -5 // Below minimum of 0
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    // console.log('Value below minimum:', result)

    expect(result.success).toBe(false)
    expect(result.message ?? '').toMatch(/must be >= 0/)
  })

  it('additional properties when not allowed', () => {
    expect.assertions(2)

    const strictSchema: JsonObject = {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name'],
      additionalProperties: false
    }

    const data: JsonValue = {
      name: 'John',
      extra: 'field' // Not allowed
    }

    const result = validateDataAgainstSchema(strictSchema, data)
    // console.log('Additional properties:', result)

    expect(result.success).toBe(false)
    expect(result.message ?? '').toMatch(/must NOT have additional properties/)
  })

  it('complex nested validation', () => {
    expect.assertions(5)

    const nestedSchema: JsonObject = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' }
          },
          required: ['name', 'email']
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              price: { type: 'number', minimum: 0 }
            },
            required: ['id', 'price']
          },
          minItems: 1
        }
      },
      required: ['user', 'items']
    }

    const invalidData: JsonValue = {
      user: {
        name: 'J', // Too short
        email: 'not-an-email' // Invalid format
      },
      items: [] // Empty array (minItems: 1)
    }

    const result = validateDataAgainstSchema(nestedSchema, invalidData)
    // console.log('Complex nested validation:', result)

    expect(result.success).toBe(false)

    const msg = result.message ?? ''

    expect(msg).toContain('/user/name')
    expect(msg).toMatch(/fewer than 2/)
    expect(msg).toMatch(/format "email"/)
    expect(msg).toMatch(/must NOT have fewer than 1 items/)
  })

  it('valid data with format validation', () => {
    expect.assertions(1)

    const formatSchema: JsonObject = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        website: { type: 'string', format: 'uri' },
        birthdate: { type: 'string', format: 'date' }
      },
      required: ['email']
    }

    const data: JsonValue = {
      email: 'user@example.com',
      website: 'https://example.com',
      birthdate: '1990-01-15'
    }

    const result = validateDataAgainstSchema(formatSchema, data)
    // console.log('Format validation (valid):', result)

    expect(result.success).toBe(true)
  })

  it('invalid format validation', () => {
    expect.assertions(3)

    const formatSchema: JsonObject = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        website: { type: 'string', format: 'uri' }
      }
    }

    const data: JsonValue = {
      email: 'invalid-email',
      website: 'not a url'
    }

    const result = validateDataAgainstSchema(formatSchema, data)
    // console.log('Format validation (invalid):', result)

    expect(result.success).toBe(false)

    const msg = result.message ?? ''

    expect(msg).toMatch(/format "email"/)
    expect(msg).toMatch(/format "uri"/)
  })
})
