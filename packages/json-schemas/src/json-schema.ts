import Ajv, { type ErrorObject } from 'ajv'
import addErrors from 'ajv-errors'
import addFormats from 'ajv-formats'
import type { JsonObject, JsonValue } from 'type-fest'

export interface ValidationResult {
  success: boolean
  message?: string
}

/**
 * Creates a new AJV instance with consistent configuration
 * @returns Configured AJV instance
 */
function createAjvInstance(refSchemas?: JsonObject[]): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: true,
    $data: true, // Enable $data references for cross-field validation
    schemas: refSchemas ?? []
  })

  addFormats(ajv)
  addErrors(ajv)
  return ajv
}

/**
 * Formats AJV errors into a single string message
 * @param errors - AJV error objects
 * @param forDataValidation - Whether this is for data validation (vs schema validation)
 * @returns Formatted error message
 */
function formatErrorMessages(errors: ErrorObject[], forDataValidation = false): string {
  return errors
    .map((err) => {
      // For data validation, use instancePath; for schema validation, use schemaPath
      const path = forDataValidation
        ? err.instancePath || 'root'
        : err.instancePath || err.schemaPath || 'root'
      return `${path}: ${err.message}`
    })
    .join('; ')
}

/**
 * Compiles and validates a JSON Schema to ensure it's a valid JSON Schema 7
 * @param schema - The JSON Schema to validate
 * @returns Compilation result with error message if invalid
 */
export function compileJsonSchema(schema: JsonObject): ValidationResult {
  try {
    const ajv = createAjvInstance()

    // Validate the schema structure
    const isSchemaValid = ajv.validateSchema(schema)

    if (!isSchemaValid && ajv.errors) {
      return {
        success: false,
        message: formatErrorMessages(ajv.errors, false)
      }
    }

    // Try to compile the schema
    ajv.compile(schema)

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown compilation error'
    }
  }
}

/**
 * Validates JSON data against a JSON Schema
 * @param schema - The JSON Schema to validate against
 * @param data - The data to validate
 * @returns Validation result with error message if invalid
 */
export function validateDataAgainstSchema(
  schema: JsonObject,
  data: JsonValue,
  refSchemas?: JsonObject[]
): ValidationResult {
  try {
    const ajv = createAjvInstance(refSchemas)

    // Compile the schema
    const validate = ajv.compile(schema)

    // Validate the data
    const isValid = validate(data)

    if (!isValid && validate.errors) {
      return {
        success: false,
        message: formatErrorMessages(validate.errors, true)
      }
    }

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown validation error'
    }
  }
}
