/* eslint-disable no-console */
import {describe, test} from 'vitest'
import {compileJsonSchema, validateDataAgainstSchema} from './json-schema'
import type {JsonObject, JsonValue} from 'type-fest'

describe('JSON Schema Compilation Tests', () => {
  test('Valid simple schema', () => {
    const schema: JsonObject = {
      type: 'object',
      properties: {
        name: {type: 'string'},
        age: {type: 'number', minimum: 0}
      },
      required: ['name']
    }

    const result = compileJsonSchema(schema)
    console.log('Simple valid schema:', result)
  })

  test('Invalid schema - wrong type value', () => {
    const schema: JsonObject = {
      type: 'invalidType', // Invalid type
      properties: {
        name: {type: 'string'}
      }
    }

    const result = compileJsonSchema(schema)
    console.log('Wrong type schema:', result)
  })

  test('Invalid schema - bad property definition', () => {
    const schema: JsonObject = {
      type: 'object',
      properties: {
        name: 'string' // Should be an object with type property
      }
    }

    const result = compileJsonSchema(schema)
    console.log('Bad property definition:', result)
  })

  test('Invalid schema - conflicting constraints', () => {
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
    console.log('Conflicting constraints:', result)
  })

  test('Complex valid schema', () => {
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
            length: {type: 'number'},
            width: {type: 'number'},
            height: {type: 'number'}
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
    console.log('Complex schema:', result)
  })

  test('Valid schema - recursive reference', () => {
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
            value: {type: 'string'},
            next: {$ref: '#/definitions/node'} // Recursive reference (actually valid)
          }
        }
      }
    }

    const result = compileJsonSchema(schema)
    console.log('Recursive reference:', result)
  })

  test('Invalid schema - undefined reference', () => {
    const schema: JsonObject = {
      type: 'object',
      properties: {
        item: {
          $ref: '#/definitions/nonexistent' // Reference doesn't exist
        }
      }
    }

    const result = compileJsonSchema(schema)
    console.log('Undefined reference:', result)
  })

  test('Invalid schema - wrong keyword usage', () => {
    const schema: JsonObject = {
      type: 'string',
      properties: {
        // properties only valid for objects
        name: {type: 'string'}
      }
    }

    const result = compileJsonSchema(schema)
    console.log('Wrong keyword usage:', result)
  })
})

describe('Data Validation Against Schema Tests', () => {
  const simpleSchema: JsonObject = {
    type: 'object',
    properties: {
      name: {type: 'string'},
      age: {type: 'number', minimum: 0}
    },
    required: ['name']
  }

  test('Valid data against schema', () => {
    const data: JsonValue = {
      name: 'John Doe',
      age: 30
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    console.log('Valid data:', result)
  })

  test('Missing required field', () => {
    const data: JsonValue = {
      age: 30
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    console.log('Missing required field:', result)
  })

  test('Wrong type for field', () => {
    const data: JsonValue = {
      name: 123, // Should be string
      age: 30
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    console.log('Wrong type for field:', result)
  })

  test('Value below minimum', () => {
    const data: JsonValue = {
      name: 'John',
      age: -5 // Below minimum of 0
    }

    const result = validateDataAgainstSchema(simpleSchema, data)
    console.log('Value below minimum:', result)
  })

  test('Additional properties when not allowed', () => {
    const strictSchema: JsonObject = {
      type: 'object',
      properties: {
        name: {type: 'string'}
      },
      required: ['name'],
      additionalProperties: false
    }

    const data: JsonValue = {
      name: 'John',
      extra: 'field' // Not allowed
    }

    const result = validateDataAgainstSchema(strictSchema, data)
    console.log('Additional properties:', result)
  })

  test('Complex nested validation', () => {
    const nestedSchema: JsonObject = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: {type: 'string', minLength: 2},
            email: {type: 'string', format: 'email'}
          },
          required: ['name', 'email']
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {type: 'number'},
              price: {type: 'number', minimum: 0}
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
    console.log('Complex nested validation:', result)
  })

  test('Valid data with format validation', () => {
    const formatSchema: JsonObject = {
      type: 'object',
      properties: {
        email: {type: 'string', format: 'email'},
        website: {type: 'string', format: 'uri'},
        birthdate: {type: 'string', format: 'date'}
      },
      required: ['email']
    }

    const data: JsonValue = {
      email: 'user@example.com',
      website: 'https://example.com',
      birthdate: '1990-01-15'
    }

    const result = validateDataAgainstSchema(formatSchema, data)
    console.log('Format validation (valid):', result)
  })

  test('Invalid format validation', () => {
    const formatSchema: JsonObject = {
      type: 'object',
      properties: {
        email: {type: 'string', format: 'email'},
        website: {type: 'string', format: 'uri'}
      }
    }

    const data: JsonValue = {
      email: 'invalid-email',
      website: 'not a url'
    }

    const result = validateDataAgainstSchema(formatSchema, data)
    console.log('Format validation (invalid):', result)
  })
})
