import type { Meta, StoryObj } from '@storybook/react'
import { JsonSchemaTable } from './json-schema-table'

const meta = {
  title: 'JsonSchemaTable',
  component: JsonSchemaTable,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
} satisfies Meta<typeof JsonSchemaTable>

export default meta
type Story = StoryObj<typeof meta>

const sampleSchema = {
  type: 'object' as const,
  properties: {
    id: {
      type: 'string' as const,
      description: 'Unique identifier'
    },
    name: {
      type: 'string' as const,
      description: 'Full name'
    },
    age: {
      type: 'integer' as const,
      description: 'Age in years'
    },
    email: {
      type: 'string' as const,
      format: 'email'
    },
    isActive: {
      type: 'boolean' as const,
      description: 'Account status'
    }
  },
  required: ['id', 'name', 'email'],
  'x-primary-key': 'id'
}

const complexSchema = {
  type: 'object' as const,
  'x-primary-key': 'slug',
  properties: {
    // String variations
    title: {
      type: 'string' as const,
      description: 'Article title'
    },
    slug: {
      type: 'string' as const,
      pattern: '^[a-z0-9-]+$'
    },
    // Number variations
    price: {
      type: 'number' as const,
      description: 'Product price',
      minimum: 0
    },
    quantity: {
      type: 'integer' as const,
      minimum: 1,
      maximum: 1000
    },
    // Boolean
    published: {
      type: 'boolean' as const,
      description: 'Publication status'
    },
    // Null type
    deletedAt: {
      type: 'null' as const,
      description: 'Deletion timestamp'
    },
    // Array type
    tags: {
      type: 'array' as const,
      description: 'List of tags',
      items: {
        type: 'string'
      }
    },
    // Object type
    metadata: {
      type: 'object' as const,
      description: 'Additional metadata',
      properties: {
        author: { type: 'string' },
        version: { type: 'number' }
      }
    },
    // Union types (multiple allowed types)
    optionalField: {
      type: ['string', 'null'] as const,
      description: 'Optional string field'
    },
    mixedType: {
      type: ['string', 'number', 'boolean'] as const,
      description: 'Field allowing multiple types'
    }
  },
  required: ['title', 'price', 'published']
}

const nestedSchema = {
  type: 'object' as const,
  'x-primary-key': 'user',
  properties: {
    user: {
      type: 'object' as const,
      description: 'User information',
      properties: {
        profile: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          }
        }
      }
    },
    settings: {
      type: 'object' as const,
      description: 'Application settings',
      properties: {
        theme: { type: 'string' },
        notifications: { type: 'boolean' }
      }
    },
    history: {
      type: 'array' as const,
      description: 'Activity history',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          timestamp: { type: 'integer' }
        }
      }
    }
  },
  required: ['user']
}

const minimalSchema = {
  type: 'object' as const,
  properties: {
    value: {
      type: 'null' as const
    }
  },
  required: []
}

const allTypesSchema = {
  type: 'object' as const,
  'x-primary-key': 'stringField',
  properties: {
    stringField: {
      type: 'string' as const,
      description: 'A string field'
    },
    numberField: {
      type: 'number' as const,
      description: 'A number field'
    },
    integerField: {
      type: 'integer' as const,
      description: 'An integer field'
    },
    booleanField: {
      type: 'boolean' as const,
      description: 'A boolean field'
    },
    nullField: {
      type: 'null' as const,
      description: 'A null field'
    },
    arrayField: {
      type: 'array' as const,
      description: 'An array field'
    },
    objectField: {
      type: 'object' as const,
      description: 'An object field'
    }
  },
  required: ['stringField', 'numberField', 'booleanField']
}

export const Basic: Story = {
  args: {
    data: sampleSchema,
    className: 'bg-white'
  }
}

export const Complex: Story = {
  args: {
    data: complexSchema,
    className: 'bg-white'
  }
}

export const Nested: Story = {
  args: {
    data: nestedSchema,
    className: 'bg-white'
  }
}

export const AllTypes: Story = {
  args: {
    data: allTypesSchema,
    className: 'bg-white'
  }
}

export const Minimal: Story = {
  args: {
    data: minimalSchema,
    className: 'bg-white'
  }
}

export const Dark: Story = {
  args: {
    data: complexSchema,
    className: 'bg-gray-900'
  },
  parameters: {
    backgrounds: { default: 'dark' }
  },
  decorators: [
    (Story) => (
      <div className='dark'>
        <Story />
      </div>
    )
  ]
}

// Test malformed schemas to ensure component doesn't crash
const malformedSchema = {
  type: 'array',
  items: { type: 'string' }
} as any

export const InvalidSchema: Story = {
  args: {
    data: malformedSchema,
    className: 'bg-white'
  }
}

export const InvalidSchemaDark: Story = {
  args: {
    data: malformedSchema,
    className: 'bg-gray-900'
  },
  parameters: {
    backgrounds: { default: 'dark' }
  },
  decorators: [
    (Story) => (
      <div className='dark'>
        <Story />
      </div>
    )
  ]
}
