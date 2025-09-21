/* eslint-disable no-undefined */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type {
  TAny,
  TArray,
  TBoolean,
  TInteger,
  TNumber,
  TObject,
  TSchema,
  TString,
  TUndefined,
  TUnion
} from '@sinclair/typebox'
import debug from 'debug'

import type { TreeNode, TreeNodeType } from './tree-table-editor'

type JsonLikeSchema = TUndefined | TAny | TObject

const log = debug('app:typebox-schema-to-schema-table')
/**
 * Checks if a schema is a string type
 */
function isString(schema: TSchema): schema is TString {
  return schema.type === 'string'
}

/**
 * Checks if a schema is a number type
 */
function isNumber(schema: TSchema): schema is TNumber {
  return schema.type === 'number'
}

/**
 * Checks if a schema is an integer type
 */
function isInteger(schema: TSchema): schema is TInteger {
  return schema.type === 'integer'
}

/**
 * Checks if a schema is a boolean type
 */
function isBoolean(schema: TSchema): schema is TBoolean {
  return schema.type === 'boolean'
}

/**
 * Checks if a schema is an array type
 */
function isArray(schema: TSchema): schema is TArray {
  return schema.type === 'array'
}

/**
 * Checks if a schema is an object type
 */
function isObject(schema: TSchema): schema is TObject {
  return schema.type === 'object'
}

/**
 * Checks if a schema is a union type
 */
function isUnion(schema: TSchema): schema is TUnion {
  return 'anyOf' in schema && Array.isArray(schema.anyOf)
}

/**
 * Converts a TypeBox schema to TreeNode format with override support
 * @param schema - The TypeBox schema object to convert
 * @param schemaName - The name to give the top-level schema node
 * @param includeTopLevel - Whether to include the top-level object in the result
 * @param currentState - Optional object with current values to override defaults
 * @param overrides - Optional object specifying which fields allow overrides
 * @returns Array of TreeNode objects
 */
export function typeboxSchemaToSchemaTable(
  schema: TObject,
  schemaName = 'parameters',
  includeTopLevel = true,
  currentState: Record<string, any> = {},
  overrides: Record<string, any> = {}
): TreeNode[] {
  if (includeTopLevel) {
    // Return the object with its children
    return [processSchemaObject(schema, schemaName, currentState, overrides)]
  } else {
    // Skip the top-level object and just return its children
    const children: TreeNode[] = []

    // Process properties if they exist
    const properties = schema.properties ?? {}
    for (const [propName, propSchema] of Object.entries(properties)) {
      // Get the current value for this property
      const currentValue = currentState?.[propName]

      // Get the override setting for this property
      const allowOverride: boolean = overrides?.[propName] ?? false

      // Process the property with the full overrides object for nested access
      const childNode = processProperty(propName, propSchema, currentValue, allowOverride, overrides)
      if (childNode) {
        children.push(childNode)
      }
    }

    return children
  }
}

/**
 * Process a TypeBox schema object
 */
function processSchemaObject(
  schema: TObject,
  name: string,
  currentState: Record<string, any> = {},
  overrides: Record<string, any> = {}
): TreeNode {
  const node: TreeNode = {
    name,
    type: 'Object',
    value: '(Object)',
    title: schema.title,
    children: []
  }

  // Process properties if they exist
  const properties = schema.properties || {}
  for (const [propName, propSchema] of Object.entries(properties)) {
    // Get the current value for this property
    const currentValue = currentState?.[propName]

    // Get the override setting for this property
    const allowOverride: boolean = overrides?.[propName] ?? false

    // Process the property with the full overrides object for nested access
    const childNode = processProperty(propName, propSchema, currentValue, allowOverride, overrides)
    if (childNode) {
      node.children?.push(childNode)
    }
  }

  return node
}

// Function to extract content media type from an intersection
function getContentMediaType(property: TSchema): string {
  // For intersection types
  if (property.type === 'object' && 'allOf' in property && Array.isArray(property.allOf)) {
    // First check for a const value in any part (highest priority)
    for (const part of property.allOf) {
      if (part?.properties?.contentMediaType?.const) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return part.properties.contentMediaType.const
      }
    }

    // Then check for a standard contentMediaType in any part
    for (const part of property.allOf) {
      // This would be for a direct property that's not a literal
      if (part?.properties?.contentMediaType) {
        log('part properties content media type', part.properties.contentMediaType)
        // return PROMPT_MIME_TYPE // Or some default
      }
    }
  }

  // Fallback
  return ''
  // return PROMPT_MIME_TYPE
}

/**
 * Process individual property from TypeBox schema
 */
function processProperty(
  name: string,
  property: TSchema,
  currentValue?: any,
  allowOverride = false,
  overrides: Record<string, any> = {}
): TreeNode | null {
  // if (!property) {
  //   return null
  // }

  let type: TreeNodeType = 'String' // Default type
  let value: TreeNode['value'] = ''
  let options: string[] | undefined
  const description = property.description
  const title = property.title

  if (isString(property)) {
    type = 'String'

    // Use current value if provided, otherwise use default from schema
    value = currentValue !== undefined ? currentValue : (property.default ?? '')
  } else if (isNumber(property) || isInteger(property)) {
    type = 'Number'
    value = currentValue !== undefined ? currentValue : property.default !== undefined ? property.default : ''
  } else if (isBoolean(property)) {
    type = 'Boolean'
    value =
      currentValue !== undefined ? currentValue : property.default !== undefined ? property.default : false
  } else if (isArray(property)) {
    type = 'Array'

    value = currentValue !== undefined ? currentValue : (property.default ?? '')
  } else if (isObject(property)) {
    type = 'Object'
    value = '(Object)'
  }

  // Handle Union types (like Type.Union in your example)
  if (isUnion(property)) {
    // Check if this is an enum-like union of literals
    const literals = property.anyOf
      .filter((t) => 'const' in t || ('enum' in t && Array.isArray(t.enum)))
      .map((t) => {
        if ('const' in t) {
          return String(t.const)
        }
        if ('enum' in t && Array.isArray(t.enum) && t.enum.length > 0) {
          return String(t.enum[0])
        }
        return undefined
      })
      .filter((val): val is string => val !== undefined)

    // if (literals.length > 0) {
    //   type = 'Enum'
    //   options = literals
    //   value = currentValue !== undefined ? currentValue : (property.default ?? literals[0] ?? '')
    // }
  }

  // Create the TreeNode
  const node: TreeNode = {
    name,
    type,
    value,
    description,
    title,
    // Add the override checkbox value
    checkboxValue: allowOverride
  }

  // Add options for Enum type
  if (options) {
    node.options = options
  }

  // Add children for Object type
  if (type === 'Object' && isObject(property) && property.properties) {
    node.children = []

    // If we have a current state for this object, use it for child properties
    const childCurrentState = typeof currentValue === 'object' && currentValue !== null ? currentValue : {}

    // Get the nested overrides for this object if available
    const nestedOverrides =
      overrides?.[name] && typeof overrides[name] === 'object' ? (overrides[name] as Record<string, any>) : {}

    for (const [childName, childSchema] of Object.entries(property.properties)) {
      const childCurrentValue = childCurrentState[childName]
      const childAllowOverride: boolean = nestedOverrides?.[childName] ?? false

      const childNode = processProperty(
        childName,
        childSchema,
        childCurrentValue,
        childAllowOverride,
        nestedOverrides
      )

      if (childNode) {
        node.children.push(childNode)
      }
    }
  }

  return node
}

/**
 * Determine the item type for array items
 */
function getItemType(items: TSchema): TreeNodeType {
  if (!items) {
    return 'String'
  }

  if (isString(items)) {
    // if (items.contentMediaType === PROMPT_MIME_TYPE) {
    //   return 'Prompt'
    // }
    return 'String'
  }
  if (isNumber(items) || isInteger(items)) {
    return 'Number'
  }
  if (isBoolean(items)) {
    return 'Boolean'
  }

  return 'String' // Default
}

/**
 * Extract override settings from TreeNode data
 * @param treeNodes - The TreeNode array to extract from
 * @returns A plain object with override settings
 */
export function extractOverrides(treeNodes: TreeNode[]): Record<string, any> {
  const result: Record<string, any> = {}

  // Process each node in the array
  for (const node of treeNodes) {
    // Skip unnamed nodes
    if (!node.name || node.name.trim() === '') {
      continue
    }

    // Add the override setting
    result[node.name] = !!node.checkboxValue

    // Process nested objects recursively
    if (node.type === 'Object' && node.children && node.children.length > 0) {
      const childOverrides = extractNestedOverrides(node.children)
      if (Object.keys(childOverrides).length > 0) {
        result[node.name] = childOverrides
      }
    }
  }

  return result
}

/**
 * Helper function to extract override settings from nested TreeNodes
 */
function extractNestedOverrides(nodes: TreeNode[]): Record<string, any> {
  const result: Record<string, any> = {}

  for (const node of nodes) {
    // Skip unnamed nodes
    if (!node.name || node.name.trim() === '') {
      continue
    }

    // Add the override setting
    result[node.name] = !!node.checkboxValue

    // Process nested objects recursively
    if (node.type === 'Object' && node.children && node.children.length > 0) {
      const childOverrides = extractNestedOverrides(node.children)
      if (Object.keys(childOverrides).length > 0) {
        result[node.name] = childOverrides
      }
    }
  }

  return result
}

/**
 * Converts TreeNode data back to a plain state object
 * @param treeNodes - The TreeNode array to convert
 * @returns A plain JavaScript object representing the current state
 */
export function treeNodeToState(treeNodes: TreeNode[]): Record<string, any> {
  const result: Record<string, any> = {}

  // Process each node in the array
  for (const node of treeNodes) {
    const value = processNodeToState(node)

    // Add to result if this is a named node (skip unnamed nodes)
    if (node.name && node.name.trim() !== '') {
      result[node.name] = value
    }
  }

  return result
}

/**
 * Process a single TreeNode and extract its value for the state object
 */
function processNodeToState(node: TreeNode): any {
  // Handle object type with children
  if (node.type === 'Object' && node.children && node.children.length > 0) {
    return processObjectNodeToState(node)
  }

  // Handle various value types
  switch (node.type) {
    case 'String':
      return node.value === undefined || node.value === null
        ? ''
        : typeof node.value === 'string'
          ? node.value
          : ''

    case 'Number':
      // Return empty string if not set, otherwise convert to number
      if (node.value === '' || node.value === undefined || node.value === null) {
        return ''
      }
      return Number(node.value)

    case 'Boolean':
      return Boolean(node.value)

    case 'Array':
      // If array is saved as string, parse it; otherwise return as is
      if (typeof node.value === 'string') {
        try {
          return JSON.parse(node.value)
        } catch {
          return []
        }
      }
      return Array.isArray(node.value) ? node.value : []

    default:
      return node.value
  }
}

/**
 * Process a node of type Object by recursively processing its children
 */
function processObjectNodeToState(node: TreeNode): Record<string, any> {
  const result: Record<string, any> = {}

  if (!node.children) {
    return result
  }

  // Process each child node
  for (const childNode of node.children) {
    // Skip nodes without names
    if (!childNode.name || childNode.name.trim() === '') {
      continue
    }

    // Process the child node and add to result
    result[childNode.name] = processNodeToState(childNode)
  }

  return result
}

// // Example usage
// const typeboxSchema = Type.Object({
//   url: Type.String({
//     format: 'uri',
//     description: 'The URL of the web page to monitor for changes.'
//   }),
//   'max-retry': Type.Number({
//     minimum: 1,
//     default: 1,
//     description: 'Maximum number of retry attempts.'
//   }),
//   'output-mode': Type.Union([
//     Type.Literal('diff-only'),
//     Type.Literal('full-page'),
//     Type.Literal('both')
//   ], {
//     default: 'diff-only',
//     description: 'Controls what data is sent to the output.'
//   }),
//   'config': Type.Object({
//     timeout: Type.Number({
//       default: 5000,
//       description: 'Request timeout in milliseconds'
//     }),
//     headers: Type.Object({
//       Accept: Type.String({
//         default: 'text/html',
//         description: 'Accept header for requests'
//       })
//     })
//   })
// });

// // Example current state
// const currentState = {
//   url: 'https://example.com',
//   'max-retry': 2,
//   config: {
//     timeout: 10000
//   }
// };

// // Example override settings with nested structure
// const overrideSettings = {
//   url: true,
//   'max-retry': false,
//   'output-mode': true,
//   config: {
//     timeout: true,
//     headers: {
//       Accept: false
//     }
//   }
// };

// // Convert to TreeNode with overrides
// const treeNodeData = typeboxSchemaToTreeNode(
//   typeboxSchema,
//   'schema',
//   false,
//   currentState,
//   overrideSettings
// );

// console.log('TreeNode data with overrides:', JSON.stringify(treeNodeData, null, 2));

// // Convert TreeNode back to state
// const stateData = treeNodeToState(treeNodeData);
// console.log('State data:', JSON.stringify(stateData, null, 2));

// // Extract override settings from TreeNode
// const extractedOverrides = extractOverrides(treeNodeData);
// console.log('Extracted overrides:', JSON.stringify(extractedOverrides, null, 2));
