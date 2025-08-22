import type {Meta, StoryObj} from '@storybook/react'
import {JsonTreeTable} from './json-tree-table'

const meta: Meta<typeof JsonTreeTable> = {
  title: 'JsonTreeTable',
  component: JsonTreeTable,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs'],
  argTypes: {
    expandLevel: {
      control: {type: 'number', min: 0, max: 5},
      description: 'Default expansion level for nested objects'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Light Mode Stories
export const SimpleObjectLight: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: {
      name: 'John Doe',
      age: 30,
      active: true,
      score: 95.5
    },
    expandLevel: 2
  }
}

export const SimpleObjectDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: {
      name: 'John Doe',
      age: 30,
      active: true,
      score: 95.5
    },
    expandLevel: 2
  }
}

// Array of objects
export const ArrayDataLight: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: [
      {
        rank: 1,
        title: 'First Item',
        link: 'https://example.com/1'
      },
      {
        rank: 2,
        title: 'Second Item',
        link: 'https://example.com/2'
      },
      {
        rank: 3,
        title: 'Third Item',
        link: 'https://example.com/3'
      }
    ] as any,
    expandLevel: 2
  }
}

export const ArrayDataDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: [
      {
        rank: 1,
        title: 'First Item',
        link: 'https://example.com/1'
      },
      {
        rank: 2,
        title: 'Second Item',
        link: 'https://example.com/2'
      },
      {
        rank: 3,
        title: 'Third Item',
        link: 'https://example.com/3'
      }
    ] as any,
    expandLevel: 2
  }
}

// Nested complex data
export const ComplexData: Story = {
  args: {
    data: {
      user: {
        id: 123,
        profile: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          settings: {
            theme: 'dark',
            notifications: true,
            preferences: ['email', 'sms']
          }
        }
      },
      posts: [
        {
          id: 1,
          title: 'Hello World',
          tags: ['intro', 'welcome'],
          metadata: {
            views: 1250,
            likes: 89
          }
        }
      ],
      config: {
        version: '1.0.0',
        features: {
          editing: false,
          search: true
        }
      }
    },
    expandLevel: 1
  }
}

// Mixed data types - Light Mode
export const MixedTypesLight: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: {
      string: 'text value',
      number: 42,
      boolean: true,
      nullValue: null,
      failValue: undefined,
      array: [1, 2, 3],
      object: {nested: 'value'},
      emptyArray: [],
      emptyObject: {}
    } as any,
    expandLevel: 3
  }
}

export const MixedTypesDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...MixedTypesLight.args
  }
}

// Large data with long values - Light Mode
export const LargeDataValuesLight: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: {
      longUrl:
        'https://www.verylongdomainname.com/api/v1/users/12345/profile/settings/notifications/email/preferences/marketing/campaigns/analytics/reports/detailed/summary?includeMetrics=true&format=json&timezone=UTC&startDate=2024-01-01&endDate=2024-12-31',
      longDescription:
        'Lorem ipsum dolor sit amet, \nconsectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      htmlContent:
        '<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold mb-4">Welcome to Our Website</h1><p class="text-lg text-gray-600 mb-6">This is a sample HTML content with multiple elements and attributes.</p><ul class="list-disc list-inside space-y-2"><li>First item with some text</li><li>Second item with more content</li><li>Third item with even more detailed information</li></ul></div>',
      jsonString: '{"nested":{"deeply":{"embedded":{"json":"value","numbers":[1,2,3,4,5],"boolean":true}}}}',
      errorMessage:
        'Error: Failed to connect to database at connection string postgresql://user:password@localhost:5432/database_name_that_is_very_long_and_descriptive?sslmode=require&connection_timeout=30&application_name=my_application_name',
      stackTrace:
        'Error: Something went wrong\\n    at processData (/app/src/services/data-processor.js:42:15)\\n    at handleRequest (/app/src/controllers/api-controller.js:128:23)\\n    at Router.handle (/app/node_modules/express/lib/router/index.js:284:12)\\n    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)',
      configuration: {
        database: {
          host: 'production-database-cluster-primary.amazonaws.com',
          port: 5432,
          username: 'application_user_with_long_descriptive_name',
          password: 'extremely_secure_password_with_many_characters_and_symbols_123456789',
          database: 'production_application_database_with_descriptive_name',
          connectionOptions: {
            maxConnections: 100,
            connectionTimeout: 30000,
            idleTimeout: 600000,
            ssl: true,
            sslMode: 'require'
          }
        }
      }
    },
    expandLevel: 1
  }
}

// Real-world extraction data - Light Mode
export const ExtractionDataLight: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: [
      {
        rank: 1,
        title:
          'Show HN: I built a tool to automatically generate API documentation from your codebase using AI and static analysis',
        link: 'https://github.com/developer-tools/api-doc-generator',
        author: 'tech_enthusiast_2024',
        points: 247,
        comments: 89,
        time: '3 hours ago',
        url: 'https://news.ycombinator.com/item?id=123456789',
        site: 'github.com',
        description:
          'This tool analyzes your codebase, understands your API endpoints, parameters, responses, and generates comprehensive documentation automatically. It supports multiple programming languages and frameworks including Node.js, Python, Go, and more.',
        tags: ['developer-tools', 'api', 'documentation', 'ai', 'automation']
      },
      {
        rank: 2,
        title: 'The hidden costs of microservices: Why our startup went back to a monolith after 2 years',
        link: 'https://engineeringblog.startup.com/microservices-to-monolith-journey',
        author: 'startup_cto',
        points: 892,
        comments: 234,
        time: '5 hours ago',
        url: 'https://news.ycombinator.com/item?id=123456790',
        site: 'engineeringblog.startup.com',
        longFormContent:
          'When we started our company two years ago, we were convinced that microservices were the way to go. We had read all the blog posts, attended the conferences, and were ready to build a distributed system that would scale to millions of users. Fast forward to today, and we are running a monolith again. This is the story of our journey, the lessons we learned, and why sometimes the boring solution is the right solution.',
        metrics: {
          developmentTime: '18 months',
          teamSize: 12,
          services: 23,
          deploymentComplexity: 'high',
          maintenanceOverhead: '40% of development time'
        }
      }
    ] as any,
    expandLevel: 1
  }
}

// Add corresponding dark mode stories
export const LargeDataValuesDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...LargeDataValuesLight.args
  }
}

export const ExtractionDataDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...ExtractionDataLight.args
  }
}

// Deeply nested data structure - Light Mode
export const DeeplyNestedLight: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: {
      application: {
        name: 'vibescraper',
        version: '1.0.0',
        environment: 'production',
        configuration: {
          database: {
            primary: {
              host: 'db-primary.region.amazonaws.com',
              credentials: {
                username: 'app_user',
                password: 'secure_password_123',
                connectionString:
                  'postgresql://app_user:secure_password_123@db-primary.region.amazonaws.com:5432/vibescraper_prod?sslmode=require'
              },
              options: {
                maxConnections: 50,
                timeout: 30000,
                retryAttempts: 3,
                pooling: {
                  min: 5,
                  max: 20,
                  idleTimeoutMillis: 600000
                }
              }
            },
            replica: {
              hosts: [
                'db-replica-1.region.amazonaws.com',
                'db-replica-2.region.amazonaws.com',
                'db-replica-3.region.amazonaws.com'
              ],
              loadBalancing: 'round-robin'
            }
          },
          services: {
            authentication: {
              provider: 'better-auth',
              sessionDuration: '7 days',
              providers: ['google', 'github', 'email'],
              secrets: {
                jwtSecret: 'very_long_jwt_secret_key_that_should_be_kept_secure_in_production_environments',
                encryptionKey: 'another_very_long_encryption_key_for_sensitive_data_protection'
              }
            },
            scraping: {
              strategies: ['fetch', 'playwright', 'playwright-stealth', 'camoufox'],
              limits: {
                concurrency: 10,
                requestsPerMinute: 1000,
                maxPageSize: '50MB',
                timeout: 60000
              },
              userAgents: [
                'Mozilla/5.0 (compatible; Vibescraper/1.0; +https://vibescraper.com)',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              ]
            }
          }
        }
      }
    },
    expandLevel: 2
  }
}

export const DeeplyNestedDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...DeeplyNestedLight.args
  }
}

// Edge Cases - All JsonValue variations
export const EdgeCaseUndefined: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: undefined,
    expandLevel: 2
  }
}

export const EdgeCaseNull: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: null,
    expandLevel: 2
  }
}

export const EdgeCaseString: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: 'This is a simple string value',
    expandLevel: 2
  }
}

export const EdgeCaseNumber: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: 42.5,
    expandLevel: 2
  }
}

export const EdgeCaseBoolean: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: true,
    expandLevel: 2
  }
}

export const EdgeCaseEmptyArray: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: [],
    expandLevel: 2
  }
}

export const EdgeCaseEmptyObject: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: {},
    expandLevel: 2
  }
}

export const EdgeCasePrimitiveArray: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: [1, 'hello', true, null, 42.5],
    expandLevel: 2
  }
}

export const EdgeCaseLongString: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    data: 'This is an extremely long string that should test text wrapping and overflow behavior in the component. It contains multiple sentences and should demonstrate how the component handles very long text values that might exceed the available column width and require proper text wrapping or scrolling behavior.',
    expandLevel: 2
  }
}

// Dark mode variants for all edge cases
export const EdgeCaseUndefinedDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseUndefined.args
  }
}

export const EdgeCaseNullDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseNull.args
  }
}

export const EdgeCaseStringDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseString.args
  }
}

export const EdgeCaseNumberDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseNumber.args
  }
}

export const EdgeCaseBooleanDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseBoolean.args
  }
}

export const EdgeCaseEmptyArrayDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseEmptyArray.args
  }
}

export const EdgeCaseEmptyObjectDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseEmptyObject.args
  }
}

export const EdgeCasePrimitiveArrayDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCasePrimitiveArray.args
  }
}

export const EdgeCaseLongStringDark: Story = {
  decorators: [
    (Story) => (
      <div className='dark min-h-screen bg-slate-950 p-8'>
        <Story />
      </div>
    )
  ],
  args: {
    ...EdgeCaseLongString.args
  }
}

// Container constraint tests
export const ConstrainedSmall: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <div className='mx-auto max-w-md'>
          <h3 className='mb-4 text-lg font-semibold'>Small Container (max-w-md)</h3>
          <div className='h-96 border-4 border-purple-500 rounded-lg overflow-hidden flex flex-col bg-purple-50'>
            <div className='bg-white h-full w-full'>
            <Story />
          </div>
          </div>
        </div>
      </div>
    )
  ],
  args: {
    data: {
      veryLongPropertyNameThatWillCauseHorizontalOverflow: 'This is a very long value that should cause horizontal scrolling when the container is too narrow to display it properly',
      anotherVeryLongPropertyName: 'Another long value to test overflow behavior',
      nested: {
        deeplyNestedPropertyWithLongName: 'Nested value that is also quite long',
        moreNestedData: {
          evenDeeperPropertyName: 'Very deep nested value',
          arrayOfLongItems: [
            'First very long array item that will test horizontal scrolling',
            'Second very long array item with even more text to overflow',
            'Third item with extensive text content'
          ]
        }
      },
      manyTopLevelProperties: 'To test vertical scrolling',
      item1: 'Value 1',
      item2: 'Value 2', 
      item3: 'Value 3',
      item4: 'Value 4',
      item5: 'Value 5',
      item6: 'Value 6',
      item7: 'Value 7',
      item8: 'Value 8',
      item9: 'Value 9',
      item10: 'Value 10'
    },
    expandLevel: 2
  }
}

export const ConstrainedMedium: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <div className='mx-auto max-w-2xl'>
          <h3 className='mb-4 text-lg font-semibold'>Medium Container (max-w-2xl)</h3>
          <div className='h-64 border-4 border-orange-500 rounded-lg overflow-hidden flex flex-col bg-orange-50'>
            <div className='bg-white h-full w-full'>
            <Story />
          </div>
          </div>
        </div>
      </div>
    )
  ],
  args: {
    data: [
      {
        id: 1,
        title: 'Long title that might cause horizontal overflow in medium containers',
        url: 'https://very-long-domain-name-for-testing-overflow.com/api/v1/endpoint/with/many/segments/that/will/definitely/overflow',
        description: 'A detailed description that contains a lot of text and should demonstrate how the component handles text wrapping and horizontal scrolling when the content is wider than the available container space.',
        metadata: {
          tags: ['long-tag-name-1', 'another-very-long-tag-name', 'third-extremely-long-tag'],
          performance: {
            loadTime: 250,
            renderTime: 45,
            totalTime: 295
          }
        }
      },
      {
        id: 2,
        title: 'Second item with different but equally long content',
        url: 'https://another-long-url.com/different/path/structure',
        nested: {
          deepProperty: 'Deep value',
          anotherDeepProperty: 'Another deep value'
        }
      }
    ],
    expandLevel: 1
  }
}

export const ConstrainedTiny: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <div className='mx-auto w-64'>
          <h3 className='mb-4 text-lg font-semibold'>Tiny Container (w-64)</h3>
          <div className='h-48 border-4 border-pink-500 rounded-lg overflow-hidden flex flex-col bg-pink-50'>
            <div className='bg-white h-full w-full'>
            <Story />
          </div>
          </div>
        </div>
      </div>
    )
  ],
  args: {
    data: {
      key1: 'Very long value that will definitely overflow in tiny container',
      key2: 'Another long value for testing',
      key3: 'Third long value to add more rows',
      key4: 'Fourth value with more text',
      key5: 'Fifth value for vertical scrolling',
      key6: 'Sixth value to test more overflow',
      key7: 'Seventh value with additional content',
      key8: 'Eighth value for testing',
      key9: 'Ninth value to ensure vertical scroll',
      key10: 'Tenth value for complete testing',
      url: 'https://example.com/very/long/path/that/will/overflow',
      num: 12345.67890,
      nested: {
        prop1: 'Nested value 1',
        prop2: 'Nested value 2'
      }
    },
    expandLevel: 1
  }
}

// Fill tests - Large containers with minimal data
export const FillTestVertical: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <h3 className='mb-4 text-lg font-semibold'>Vertical Fill Test - Tall Container, Little Data</h3>
        <div className='h-[600px] w-full border-4 border-red-500 rounded-lg overflow-hidden flex flex-col relative'
             style={{background: 'repeating-linear-gradient(45deg, #fecaca 0px, #fecaca 20px, #fca5a5 20px, #fca5a5 40px)'}}>
          <div className='absolute top-2 right-2 text-xs bg-white px-2 py-1 rounded shadow text-red-800 z-10'>
            H: 600px | Data: 3 items
          </div>
          <div className='bg-white h-full w-full'>
            <Story />
          </div>
        </div>
      </div>
    )
  ],
  args: {
    data: {
      key1: 'Short value',
      key2: 'Another short value',
      key3: 42
    },
    expandLevel: 1
  }
}

export const FillTestHorizontal: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <h3 className='mb-4 text-lg font-semibold'>Horizontal Fill Test - Wide Container, Little Data</h3>
        <div className='h-48 w-full border-4 border-blue-500 rounded-lg overflow-hidden flex flex-col relative'
             style={{background: 'repeating-linear-gradient(90deg, #bfdbfe 0px, #bfdbfe 30px, #93c5fd 30px, #93c5fd 60px)'}}>
          <div className='absolute top-2 right-2 text-xs bg-white px-2 py-1 rounded shadow text-blue-800 z-10'>
            W: 100% | Data: 3 items
          </div>
          <div className='bg-white h-full w-full'>
            <Story />
          </div>
        </div>
      </div>
    )
  ],
  args: {
    data: {
      short: 'val',
      num: 123,
      bool: true
    },
    expandLevel: 1
  }
}

export const FillTestCombined: Story = {
  decorators: [
    (Story) => (
      <div className='min-h-screen bg-white p-8'>
        <h3 className='mb-4 text-lg font-semibold'>Combined Fill Test - Large Container, Minimal Data</h3>
        <div className='h-96 w-full border-4 border-green-500 rounded-lg overflow-hidden flex flex-col relative'
             style={{background: 'repeating-linear-gradient(45deg, #bbf7d0 0px, #bbf7d0 25px, #86efac 25px, #86efac 50px)'}}>
          <div className='absolute top-2 right-2 text-xs bg-white px-2 py-1 rounded shadow text-green-800 z-10'>
            384px × 100% | Data: 4 items
          </div>
          <div className='bg-white h-full w-full'>
            <Story />
          </div>
        </div>
      </div>
    )
  ],
  args: {
    data: {
      name: 'Test',
      value: 42,
      active: true,
      simple: {
        nested: 'value'
      }
    },
    expandLevel: 2
  }
}
