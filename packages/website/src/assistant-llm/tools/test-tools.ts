import {tool} from 'ai'
import {z} from 'zod'
import debug from 'debug'
import tools from '@/assistant-llm/tools'

const log = debug('app:test-tools')

/**
 * Simple test tools to verify tool calling works
 */
export function makeTestTools() {
  return {
    // Simple tool with no parameters
    ping: tool({
      ...tools.ping,
      execute: async ({input}, opts) => {
        log('ping called')
        return {
          success: true,
          message: 'pong'
        }
      }
    }),

    // Schema update tool
    'schema-update': tool({
      ...tools['schema-update'],
      execute: async ({filename, content, version}, opts) => {
        log('schema-update called for:', filename)

        // Simulate some async work
        await new Promise((resolve) => setTimeout(resolve, 500))

        return {
          success: true,
          filename,
          version: version ?? 'v1',
          message: `Schema ${filename} updated successfully`
        }
      }
    }),

    // Code update tool
    'code-update': tool({
      ...tools['code-update'],
      execute: async ({filename, content, version}, opts) => {
        log('code-update called for:', filename)

        // Simulate some async work
        await new Promise((resolve) => setTimeout(resolve, 800))

        return {
          success: true,
          filename,
          version: version ?? 'v1',
          message: `Code ${filename} updated successfully`
        }
      }
    })

    // Tool with input parameters
    // echo: tool({
    //   description: 'Echo back the input message with a prefix',
    //   inputSchema: z.object({
    //     message: z.string().describe('Message to echo'),
    //     prefix: z.string().optional().describe('Optional prefix to add')
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     result: z.string()
    //   }),
    //   execute: async (input) => {
    //     log('echo called with:', input)
    //     const prefix = input.prefix ?? 'Echo:'
    //     return {
    //       success: true,
    //       result: `${prefix} ${input.message}`
    //     }
    //   }
    // }),

    // Tool that simulates async work
    // calculate: tool({
    //   description: 'Add two numbers together',
    //   inputSchema: z.object({
    //     a: z.number().describe('First number'),
    //     b: z.number().describe('Second number')
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     result: z.number().optional(),
    //     error: z.string().optional()
    //   }),
    //   execute: async (input) => {
    //     log('calculate called with:', input)

    //     // Simulate some async work
    //     await new Promise(resolve => setTimeout(resolve, 100))

    //     try {
    //       const result = input.a + input.b
    //       return {
    //         success: true,
    //         result
    //       }
    //     } catch (error) {
    //       return {
    //         success: false,
    //         error: error instanceof Error ? error.message : 'Calculation failed'
    //       }
    //     }
    //   }
    // }),

    // Tool that can fail
    // mayFail: tool({
    //   description: 'Tool that randomly succeeds or fails for testing error handling',
    //   inputSchema: z.object({
    //     shouldFail: z.boolean().optional().describe('Force failure if true')
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     data: z.string().optional(),
    //     error: z.string().optional()
    //   }),
    //   execute: async (input) => {
    //     log('mayFail called with:', input)

    //     const shouldFail = input.shouldFail ?? (Math.random() < 0.3) // 30% chance of failure

    //     if (shouldFail) {
    //       return {
    //         success: false,
    //         error: 'Simulated failure for testing'
    //       }
    //     }

    //     return {
    //       success: true,
    //       data: 'Operation succeeded!'
    //     }
    //   }
    // }),

    // Tool with complex nested input/output
    // complexData: tool({
    //   description: 'Handle complex nested data structures',
    //   inputSchema: z.object({
    //     user: z.object({
    //       name: z.string(),
    //       age: z.number().optional(),
    //       tags: z.array(z.string()).optional()
    //     }),
    //     config: z.object({
    //       enabled: z.boolean(),
    //       settings: z.record(z.string()).optional()
    //     }).optional()
    //   }),
    //   outputSchema: z.object({
    //     success: z.boolean(),
    //     processed: z.object({
    //       summary: z.string(),
    //       userTags: z.array(z.string()),
    //       configKeys: z.array(z.string())
    //     }).optional(),
    //     error: z.string().optional()
    //   }),
    //   execute: async (input) => {
    //     log('complexData called with:', JSON.stringify(input, null, 2))

    //     try {
    //       const userTags = input.user.tags ?? []
    //       const configKeys = input.config?.settings ? Object.keys(input.config.settings) : []

    //       return {
    //         success: true,
    //         processed: {
    //           summary: `User ${input.user.name} (${input.user.age ?? 'age unknown'}) with ${userTags.length} tags`,
    //           userTags,
    //           configKeys
    //         }
    //       }
    //     } catch (error) {
    //       return {
    //         success: false,
    //         error: error instanceof Error ? error.message : 'Processing failed'
    //       }
    //     }
    //   }
    // })
  }
}

// Export type for the tools
export type TestTools = ReturnType<typeof makeTestTools>
