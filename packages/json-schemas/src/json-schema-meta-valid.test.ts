import type { JsonObject, JsonValue } from 'type-fest'
import { describe, expect, it, test } from 'vitest'

import {
  objectRootMetaSchema,
  primaryKeyInRequiredMetaSchema,
  rootPrimaryKeyMetaSchema,
  validatePrimaryKeyItemSchema
} from './json-meta-schemas'
import { validateDataAgainstSchema } from './json-schema'

describe('meta-Schema Validation Tests', () => {
  it('valid schema conforming to object-root meta-schema', () => {
    expect.assertions(1)

    const validSchema: JsonObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id']
    }

    const result = validateDataAgainstSchema(objectRootMetaSchema, validSchema)

    expect(result.success).toBe(true)
  })

  it('invalid schema not conforming to object-root meta-schema', () => {
    expect.assertions(2)

    const invalidSchema: JsonObject = {
      type: 'array', // Must be 'object' according to meta-schema
      items: { type: 'string' }
    }

    const result = validateDataAgainstSchema(objectRootMetaSchema, invalidSchema)

    expect(result.success).toBe(false)
    expect(result.message).toContain('type')
  })
})

describe('primary Key Format Tests', () => {
  const primaryKeyValidMetaSchema: JsonObject = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      properties: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            'x-primary-key': { const: true }
          }
        }
      }
    }
  }

  it('valid schema - x-primary-key is true', () => {
    const validSchema: JsonObject = {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          'x-primary-key': true
        },
        name: { type: 'string' }
      }
    }

    const result = validateDataAgainstSchema(primaryKeyValidMetaSchema, validSchema)

    expect(result.success).toBe(true)
  })

  it('invalid schema - x-primary-key is not true', () => {
    const invalidSchema: JsonObject = {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          'x-primary-key': false // Must be true, not false
        },
        name: { type: 'string' }
      }
    }

    const result = validateDataAgainstSchema(primaryKeyValidMetaSchema, invalidSchema)

    expect(result.success).toBe(false)
  })
})

describe('root Primary Key Tests', () => {
  it('valid schema - has root x-primary-key string', () => {
    const validSchema: JsonObject = {
      type: 'object',
      'x-primary-key': 'id',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    }

    const result = validateDataAgainstSchema(rootPrimaryKeyMetaSchema, validSchema)

    expect(result.success).toBe(true)
  })

  it('invalid schema - missing root x-primary-key', () => {
    const invalidSchema: JsonObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    }

    const result = validateDataAgainstSchema(rootPrimaryKeyMetaSchema, invalidSchema)

    expect(result.success).toBe(false)
    expect(result.message).toContain('x-primary-key')
  })
})

describe('primary Key Reference Tests', () => {
  // Note: JSON Schema with $data cannot validate that required array contains the x-primary-key value
  // This schema just validates both fields exist and have correct types
  const primaryKeyReferenceMetaSchema: JsonObject = {
    $id: 'https://example.com/meta/primary-key-reference',
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      'x-primary-key': { type: 'string' },
      required: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['x-primary-key', 'required']
  }

  it('valid schema - primary key property exists and is required', () => {
    const validSchema: JsonObject = {
      type: 'object',
      'x-primary-key': 'id',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    }

    const result = validateDataAgainstSchema(primaryKeyReferenceMetaSchema, validSchema)

    expect(result.success).toBe(true)
  })

  it('invalid schema - missing required array', () => {
    const invalidSchema: JsonObject = {
      type: 'object',
      'x-primary-key': 'id',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
      // Missing required array entirely
    }

    const result = validateDataAgainstSchema(primaryKeyReferenceMetaSchema, invalidSchema)

    expect(result.success).toBe(false)
    expect(result.message).toContain('required')
  })
})

describe('$data Reference Tests', () => {
  it('$data reference works - smaller/larger example', () => {
    const schema: JsonObject = {
      properties: {
        smaller: {
          type: 'number',
          maximum: { $data: '1/larger' }
        },
        larger: { type: 'number' }
      }
    }

    const validData: JsonValue = {
      smaller: 5,
      larger: 7
    }

    const invalidData: JsonValue = {
      smaller: 10,
      larger: 7
    }

    const validResult = validateDataAgainstSchema(schema, validData)

    expect(validResult.success).toBe(true)

    const invalidResult = validateDataAgainstSchema(schema, invalidData)

    expect(invalidResult.success).toBe(false)
  })
})

describe('primary Key in Required Tests', () => {
  it('valid schema - primary key in required array', () => {
    const validSchema: JsonObject = {
      type: 'object',
      'x-primary-key': 'id',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    }

    const result = validateDataAgainstSchema(primaryKeyInRequiredMetaSchema, validSchema)

    expect(result.success).toBe(true)
  })

  it('invalid schema - primary key not in required array', () => {
    const invalidSchema: JsonObject = {
      type: 'object',
      'x-primary-key': 'id',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['name'] // Missing 'id'
    }

    const result = validateDataAgainstSchema(primaryKeyInRequiredMetaSchema, invalidSchema)

    expect(result.success).toBe(false)
  })
})

describe('combined Schema Requirements Tests', () => {
  it('valid schema passes all requirements', () => {
    const validSchema: JsonObject = {
      type: 'object',
      'x-primary-key': 'id',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    }

    const result = validatePrimaryKeyItemSchema(validSchema)
    // if (!result.success) {
    //   console.log('Validation failed:', result.message)
    // }

    expect(result.success).toBe(true)
  })

  it('invalid schema missing requirements', () => {
    const invalidSchema: JsonObject = {
      type: 'array', // Wrong type
      items: { type: 'string' }
      // Missing x-primary-key, properties, and required
    }

    const result = validatePrimaryKeyItemSchema(invalidSchema)

    expect(result.success).toBe(false)
    expect(result.message).toBeDefined()
  })
})
