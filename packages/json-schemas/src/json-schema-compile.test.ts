import type { JsonObject, JsonValue } from 'type-fest'
import { describe, expect, it, test } from 'vitest'

import { compileJsonSchema } from './json-schema'

describe('jSON Schema Compilation Tests', () => {
  it('valid simple schema', () => {
    expect.assertions(1)

    const schema: JsonObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number', minimum: 0 }
      },
      required: ['name']
    }

    const result = compileJsonSchema(schema)

    // console.log('Simple valid schema:', result)
    expect(result.success).toBe(true)
  })

  it('invalid schema - wrong type value', () => {
    expect.assertions(2)

    const schema: JsonObject = {
      type: 'invalidType', // Invalid type
      properties: {
        name: { type: 'string' }
      }
    }

    const result = compileJsonSchema(schema)

    // console.log('Wrong type schema:', result)
    expect(result.success).toBe(false)
    expect(result.message ?? '').toContain('/type')
  })

  it('invalid schema - bad property definition', () => {
    expect.assertions(2)

    const schema: JsonObject = {
      type: 'object',
      properties: {
        name: 'string' // Should be an object with type property
      }
    }

    const result = compileJsonSchema(schema)

    // console.log('Bad property definition:', result)
    expect(result.success).toBe(false)
    expect(result.message ?? '').toContain('/properties/name')
  })

  it('invalid schema - conflicting constraints', () => {
    expect.assertions(1)

    const schema: JsonObject = {
      type: 'object',
      properties: {
        value: {
          type: 'number',
          minimum: 10,
          maximum: 5 // Maximum less than minimum
        }
      }
    }

    const result = compileJsonSchema(schema)

    // console.log('Conflicting constraints:', result)
    // Schema compiles; constraint conflicts are a data-validation concern
    expect(result.success).toBe(true)
  })

  it('complex valid schema', () => {
    expect.assertions(2)

    const schema: JsonObject = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      title: 'Product Catalog',
      description: 'A product from our catalog',
      properties: {
        productId: {
          type: 'integer',
          description: 'The unique identifier for a product'
        },
        productName: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        price: {
          type: 'number',
          minimum: 0,
          exclusiveMinimum: true
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['electronics', 'clothing', 'food', 'books']
          },
          minItems: 1,
          uniqueItems: true
        },
        dimensions: {
          type: 'object',
          properties: {
            length: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' }
          },
          required: ['length', 'width', 'height']
        },
        inStock: {
          type: 'boolean',
          default: true
        },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              color: {
                type: 'string',
                pattern: '^#[0-9A-Fa-f]{6}$'
              },
              size: {
                type: 'string',
                enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
              },
              sku: {
                type: 'string',
                pattern: '^[A-Z]{3}-[0-9]{4}$'
              }
            },
            required: ['sku'],
            additionalProperties: false
          }
        },
        metadata: {
          type: 'object',
          additionalProperties: {
            type: 'string'
          }
        }
      },
      required: ['productId', 'productName', 'price'],
      additionalProperties: false,
      dependencies: {
        variants: ['inStock']
      }
    }

    const result = compileJsonSchema(schema)

    // console.log('Complex schema:', result)
    // Using draft-07, boolean exclusiveMinimum is invalid (must be a number)
    expect(result.success).toBe(false)
    expect(result.message ?? '').toContain('exclusiveMinimum')
  })

  it('valid schema - recursive reference', () => {
    expect.assertions(1)

    const schema: JsonObject = {
      type: 'object',
      properties: {
        self: {
          $ref: '#/definitions/node'
        }
      },
      definitions: {
        node: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            next: { $ref: '#/definitions/node' } // Recursive reference (actually valid)
          }
        }
      }
    }

    const result = compileJsonSchema(schema)

    // console.log('Recursive reference:', result)
    expect(result.success).toBe(true)
  })

  it('invalid schema - undefined reference', () => {
    expect.assertions(2)

    const schema: JsonObject = {
      type: 'object',
      properties: {
        item: {
          $ref: '#/definitions/nonexistent' // Reference doesn't exist
        }
      }
    }

    const result = compileJsonSchema(schema)

    // console.log('Undefined reference:', result)
    expect(result.success).toBe(false)
    expect(result.message ?? '').toMatch(/reference/i)
  })

  it('invalid schema - wrong keyword usage', () => {
    expect.assertions(1)

    const schema: JsonObject = {
      type: 'string',
      properties: {
        // properties only valid for objects
        name: { type: 'string' }
      }
    }

    const result = compileJsonSchema(schema)

    // console.log('Wrong keyword usage:', result)
    // JSON Schema allows unrelated keywords; they simply won't apply at runtime
    expect(result.success).toBe(true)
  })
})
