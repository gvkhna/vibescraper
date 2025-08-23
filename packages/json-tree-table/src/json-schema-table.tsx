import * as React from 'react'
import type {JsonObject} from 'type-fest'
import {TreeTableEditor} from './tree-table-editor'
import {jsonObjectToSchemaTable} from './json-object-to-schema-table'

// AJV type values
export const JSON_SCHEMA_TYPES = [
  'number',
  'integer',
  'string',
  'boolean',
  'array',
  'object',
  'null'
] as const
export type JsonSchemaType = (typeof JSON_SCHEMA_TYPES)[number]

// Property definition with type
export interface PropertySchema {
  type: JsonSchemaType | JsonSchemaType[]
  // Allow other properties like description, etc.
  [key: string]: unknown
}

// Simple schema type for our specific use case
export interface SimpleObjectSchema {
  type: 'object'
  properties: Record<string, PropertySchema>
  required?: string[]
}

export interface JsonSchemaTableProps {
  data: JsonObject
  className?: string
}

import type {TreeNode, TreeNodeType} from './tree-table-editor'

// Helper to convert JSON Schema directly to TreeNode array
function jsonSchemaToSchemaTable(schema: SimpleObjectSchema): TreeNode[] {
  const result: TreeNode[] = []
  
  // Check if there's a primary key defined
  const primaryKey = typeof (schema as any)['x-primary-key'] === 'string' 
    ? (schema as any)['x-primary-key'] 
    : null

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const type = Array.isArray(propSchema.type) ? propSchema.type[0] : propSchema.type
    
    // Map JSON Schema types to TreeNode types
    let nodeType: TreeNodeType
    let nodeValue: string | boolean | number | null
    let children: TreeNode[] | null = null
    
    switch (type) {
      case 'string':
        nodeType = 'String'
        nodeValue = ''
        break
      case 'number':
        nodeType = 'Number'
        nodeValue = 0
        break
      case 'integer':
        nodeType = 'Number'
        nodeValue = 0
        break
      case 'boolean':
        nodeType = 'Boolean'
        nodeValue = false
        break
      case 'null':
        nodeType = 'Null'
        nodeValue = 'null'
        break
      case 'array':
        nodeType = 'Array'
        nodeValue = 'array'
        children = []
        break
      case 'object':
        nodeType = 'Object'
        nodeValue = 'object'
        children = []
        break
      default:
        nodeType = 'Null'
        nodeValue = null
    }
    
    // Check if this property is required
    const isRequired = schema.required?.includes(key) || false
    
    result.push({
      name: key,
      type: nodeType,
      value: nodeValue,
      checkboxValue: isRequired,
      children,
      description: propSchema.description as string | undefined,
      expanded: true,
      badge: primaryKey === key ? 'Primary Key' : undefined
    })
  }

  return result
}

export function JsonSchemaTable({data, className}: JsonSchemaTableProps) {
  // Transform the schema data to tree nodes
  const schemaData = React.useMemo(() => {
    // Only transform if data is valid
    if (!isValidJsonSchema(data)) {
      return []
    }

    // Convert schema directly to tree nodes
    return jsonSchemaToSchemaTable(data)
  }, [data])

  // Validate that data is a valid JSON schema object
  if (!isValidJsonSchema(data)) {
    return (
      <div className='rounded bg-red-50 p-4 text-red-600'>
        Error: Invalid JSON Schema format. Expected an object with type and properties.
      </div>
    )
  }

  return (
    <TreeTableEditor
      schemaData={schemaData}
      className={className}
      // Configure for schema editing
      enabledAddRootItemButton={false}
      disabledEditRootKeys={true}
      enableArray={true}
      enableCheckboxField={true}
      checkboxFieldName={'Required'}
      disableCheckboxFieldEdit={true}
      enableCheckboxTooltip={false}
      enableValueField={false}
      disableValueFieldEdit={true}
      enableDescriptionTooltip={false}
      disableDescriptionEdit={true}
      disableEditTypes={true}
      disableResize={true}
      overhideHeaderKey={'Property'}
      disableExpansionChevrons={true}
    />
  )
}

// Helper to validate if data looks like a JSON schema
function isValidJsonSchema(data: unknown): data is SimpleObjectSchema {
  if (!isJsonObject(data)) {
    return false
  }

  // Must have type field set to 'object'
  if (data.type !== 'object') {
    return false
  }

  // Must have properties field that is an object
  if (!('properties' in data) || typeof data.properties !== 'object' || data.properties === null) {
    return false
  }

  // Validate each property has a valid type
  for (const propValue of Object.values(data.properties)) {
    if (!isJsonObject(propValue)) {
      return false
    }

    // Check if it has a type field
    if (!('type' in propValue)) {
      return false
    }

    // Validate the type value(s)
    if (Array.isArray(propValue.type)) {
      // If array, all values must be valid types
      if (!propValue.type.every((t) => JSON_SCHEMA_TYPES.includes(t as JsonSchemaType))) {
        return false
      }
    } else if (!JSON_SCHEMA_TYPES.includes(propValue.type as JsonSchemaType)) {
      // Single type must be valid
      return false
    }
  }

  // Optional: check if required is a string array
  if ('required' in data && !Array.isArray(data.required)) {
    return false
  }

  return true
}

// Type guard for JsonObject
function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
