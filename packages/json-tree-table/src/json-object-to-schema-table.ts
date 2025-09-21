// assuming your types are defined in a separate file

import type { JsonArray, JsonObject } from 'type-fest'

import type { TreeNode, TreeNodeType } from './tree-table-editor'

/**
 * Converts a standard JSON object into a TreeNode array for the table editor
 * @param json The input JSON object to convert
 * @param expandLevel The level to auto-expand nodes (0 = none, 1 = first level, etc)
 * @param enumOptions Optional map of field names to their enum options
 * @returns An array of TreeNode objects
 */
export function jsonObjectToSchemaTable(
  json: JsonObject | JsonArray,
  expandLevel = 0,
  enumOptions: Record<string, string[]> = {}
): TreeNode[] {
  const result: TreeNode[] = []

  if (Array.isArray(json)) {
    json.forEach((value, index) => {
      result.push(createTreeNode(`Item ${index}`, value, enumOptions[index.toString()], 0, expandLevel))
    })
  } else {
    // Process each key-value pair in the JSON object
    for (const [key, value] of Object.entries(json)) {
      result.push(createTreeNode(key, value, enumOptions[key], 0, expandLevel))
    }
  }

  return result
}

/**
 * Creates a TreeNode based on the type of the value
 * @param name The name (key) of the node
 * @param value The value to analyze
 * @param enumOptions Optional array of enum options if this is an enum field
 * @param currentDepth Current nesting depth
 * @param expandLevel Level to auto-expand nodes
 * @returns A TreeNode object
 */
function createTreeNode(
  name: string,
  value: any,
  enumOptions?: string[] | null,
  currentDepth = 0,
  expandLevel = 0
): TreeNode {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return {
      name,
      type: 'Null',
      value: 'null'
    }
  }

  // Determine the type of the value and create appropriate TreeNode
  const valueType = typeof value

  // Handle primitive types
  switch (valueType) {
    case 'string':
      // Check if it's a date string
      return {
        name,
        type: 'String',
        value
      }

    case 'number':
      return {
        name,
        type: 'Number',
        value
      }

    case 'boolean':
      return {
        name,
        type: 'Boolean',
        value: String(value)
      }
  }

  // Handle array types
  if (Array.isArray(value)) {
    // For arrays of objects or mixed types, use generic Array
    return {
      name,
      type: 'Array',
      value: '',
      children: value.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return createTreeNode('', item, undefined, currentDepth + 1, expandLevel)
        } else {
          return {
            name: '',
            type: getTypeForValue(item),
            value: item ?? ''
          }
        }
      }),
      checkboxValue: true,
      expanded: currentDepth < expandLevel
    }
  }

  // Handle object types
  if (valueType === 'object') {
    const children: TreeNode[] = []
    // let index = 0

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    for (const [childKey, childValue] of Object.entries(value)) {
      children.push(createTreeNode(childKey, childValue, undefined, currentDepth + 1, expandLevel))
    }

    // If no children, add an empty placeholder
    if (children.length === 0) {
      children.push({
        name: `New Item #0`,
        type: 'String',
        value: ''
      })
    }

    return {
      name,
      type: 'Object',
      value: '(Object)',
      children,
      expanded: currentDepth < expandLevel
    }
  }

  // Default fallback
  return {
    name,
    type: 'String',
    value: String(value)
  }
}

/**
 * Helper function to determine the type name for a value
 */
function getTypeForValue(value: any): TreeNodeType {
  if (value === null || value === undefined) {
    return 'String'
  }

  const type = typeof value
  switch (type) {
    case 'string':
      return 'String'
    case 'number':
      return 'Number'
    case 'boolean':
      return 'Boolean'
    case 'object':
      if (Array.isArray(value)) {
        return 'Array'
      }
      return 'Object'
    default:
      return 'String'
  }
}

/**
 * Check if a string is likely a date string
 */
function isDateString(value: string): boolean {
  // Simple check for ISO date format or common date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/
  if (!dateRegex.test(value)) {
    return false
  }

  // Try to parse it as a date
  const date = new Date(value)
  return !isNaN(date.getTime())
}

// /**
//  * Usage example
//  */
// const sampleJson = {
//   A_FILLED_STRING: ['value1', 'value2'],
//   A_EMTPY_STRING: '',
//   A_ENUM: 'choice',
//   DICT_VAR: {
//     key1: 'value1',
//     key2: 42
//   },
//   MY_DATE_VAR: '2023-05-15',
//   NUMBER_VAR: 42,
//   BOOL_VAR: false,
//   'My list of strings': ['item1', 'item2', 'item3'],
//   'My Array of numbers': [1, 2, 3, 4, 5]
// };

// // Provide enum options for fields that should be treated as enums
// const enumOptions = {
//   A_ENUM: ['choice', 'select']
// };

// const treeNodes = jsonToTreeNodes(sampleJson, enumOptions);
// console.log(JSON.stringify(treeNodes, null, 2));

// export { jsonToTreeNodes };
