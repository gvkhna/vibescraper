import type { JsonObject } from 'type-fest'

import { validateDataAgainstSchema } from './json-schema'

/**
 * Meta-schema that validates a schema is an object type with at least one property and at least one required field
 */
export const objectRootMetaSchema = {
  $id: 'urn:vibescraper:meta:object-root:v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Object Root Schema',
  description: 'Validates that a schema defines an object with properties and required fields',
  type: 'object',
  properties: {
    type: { const: 'object' },
    properties: {
      type: 'object',
      minProperties: 1
    },
    required: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1
    }
  },
  required: ['type', 'properties', 'required'],
  additionalProperties: true,
  errorMessage: 'Schema must define type as "object" with at least one property and one required field'
} as const satisfies JsonObject

/**
 * Meta-schema that validates x-primary-key exists at the root and is a string
 */
export const rootPrimaryKeyMetaSchema = {
  $id: 'urn:vibescraper:meta:root-primary-key:v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Root Primary Key Schema',
  description: 'Validates that a schema has an x-primary-key field at the root that is a string',
  type: 'object',
  properties: {
    'x-primary-key': { type: 'string' }
  },
  required: ['x-primary-key'],
  errorMessage:
    'Schema must have "x-primary-key" field with a string value specifying the primary key property name'
} as const satisfies JsonObject

/**
 * Meta-schema that validates x-primary-key value is in the required array
 */
export const primaryKeyInRequiredMetaSchema = {
  $id: 'urn:vibescraper:meta:primary-key-in-required:v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Primary Key in Required Schema',
  description: 'Validates that the x-primary-key value is included in the required array',
  type: 'object',
  properties: {
    'x-primary-key': { type: 'string' },
    required: {
      type: 'array',
      contains: {
        const: { $data: '/x-primary-key' }
      }
    }
  },
  required: ['x-primary-key', 'required'],
  errorMessage: 'The property specified in "x-primary-key" must be included in the "required" array'
} as const satisfies JsonObject

/**
 * Combined meta-schema that validates all object schema requirements
 */
export const combinedObjectMetaSchema = {
  $id: 'urn:vibescraper:meta:combined-object-schema:v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Combined Object Schema Validation',
  description: 'Validates all requirements for a proper object schema',
  allOf: [
    { $ref: 'urn:vibescraper:meta:object-root:v1' },
    { $ref: 'urn:vibescraper:meta:root-primary-key:v1' },
    { $ref: 'urn:vibescraper:meta:primary-key-in-required:v1' }
  ]
} as const satisfies JsonObject

/**
 * Validates a schema against all meta-schema requirements
 * @param schema - The schema to validate
 * @returns Validation result with all error messages
 */
export function validatePrimaryKeyItemSchema(schema: JsonObject) {
  return validateDataAgainstSchema(combinedObjectMetaSchema, schema, [
    combinedObjectMetaSchema,
    objectRootMetaSchema,
    rootPrimaryKeyMetaSchema,
    primaryKeyInRequiredMetaSchema
  ])
}
