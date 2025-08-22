import {Type} from '@sinclair/typebox'
import {Value} from '@sinclair/typebox/value'
import {TypeCompiler} from '@sinclair/typebox/compiler'
import {type TreeNode} from './tree-table-editor'

export function schemaTableToJsonSchema(schemaData: TreeNode[]) {
  const convertNodeToSchema = (node: TreeNode): any => {
    switch (node.type) {
      case 'String':
        return Type.String()

      case 'Number':
        return Type.Number()

      case 'Boolean':
        return Type.Boolean()

      case 'Null':
        return Type.Null()

      case 'Array':
        if (!node.children || node.children.length === 0) {
          return Type.Array(Type.Any())
        } else {
          // Use the first child as the template for array items
          return Type.Array(convertNodeToSchema(node.children[0]))
        }

      case 'Object': {
        if (!node.children || node.children.length === 0) {
          return Type.Object({})
        } else {
          const properties: Record<string, any> = {}

          node.children.forEach((child) => {
            // If required is explicitly true, add as is; otherwise, wrap with Optional
            if (child.checkboxValue === true) {
              properties[child.name] = convertNodeToSchema(child)
            } else {
              properties[child.name] = Type.Optional(convertNodeToSchema(child))
            }
          })

          return Type.Object(properties)
        }
        break
      }
      default:
        return Type.Any()
    }
  }

  // Create the root schema
  const buildRootSchema = () => {
    const properties: Record<string, any> = {}
    const required: string[] = []

    schemaData.forEach((node) => {
      if (node.checkboxValue === true) {
        properties[node.name] = convertNodeToSchema(node)
      } else {
        properties[node.name] = Type.Optional(convertNodeToSchema(node))
      }
    })

    return Type.Object(properties)
  }

  // Build the TypeBox schema
  const typeboxSchema = buildRootSchema()

  // console.log('typebox schema', typeboxSchema)

  const compiledSchema = TypeCompiler.Compile(typeboxSchema)

  return {
    typeboxSchema,
    jsonSchema: () => {
      return compiledSchema.Schema()
    },
    jsonString: () => {
      return JSON.stringify(compiledSchema.Schema(), null, 2)
    },
    // jsonSchema,
    // async toJSONSchema() {
    //   return await toJSONSchema(typeboxSchema)
    // },
    validateObject(data: any) {
      return Value.Check(typeboxSchema, data)
    }
  }
}
