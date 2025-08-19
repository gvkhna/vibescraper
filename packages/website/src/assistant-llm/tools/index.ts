import {type ToolSet} from 'ai'
import z from 'zod'

const tools = {
  // someTool: tool({})
  ping: {
    description: 'Simple ping test - returns pong',
    inputSchema: z.object({
      input: z.boolean()
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  readSchema: {
    description: 'Read current Data Schema',
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      schema: z.record(z.string(), z.any()).optional().nullable(),
      version: z.number().optional().nullable(),
      message: z.string().optional().nullable(),
      error: z.string().optional()
    })
  },
  writeSchema: {
    description: 'Replace Data Schema',
    inputSchema: z.object({
      schema: z.record(z.string(), z.any()).describe('The complete JSON Schema object'),
      message: z.string().optional().describe('Commit message for this version')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      version: z.number().optional(),
      error: z.string().optional()
    })
  },
  readScript: {
    description: 'Read current Extraction Script',
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      script: z.string().optional().nullable(),
      version: z.number().optional().nullable(),
      name: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      scriptLanguage: z.string().optional().nullable(),
      error: z.string().optional()
    })
  },
  writeScript: {
    description: 'Replace Extraction Script',
    inputSchema: z.object({
      script: z.string().describe('The complete JavaScript extraction script'),
      name: z.string().optional().describe('Name for this script version'),
      description: z.string().optional().describe('Description for this version')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      version: z.number().optional(),
      error: z.string().optional()
    })
  },
  readHtml: {
    description: 'Read cached HTML content from previous scrape',
    inputSchema: z.object({
      format: z
        .enum(['raw', 'cleaned', 'readability', 'markdown', 'text'])
        .optional()
        .default('cleaned')
        .describe('HTML format to return')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      html: z.string().optional().nullable(),
      url: z.string().optional().nullable(),
      statusCode: z.number().optional().nullable(),
      cached: z.boolean().optional(),
      // timestamp: z.string().optional().nullable(),
      error: z.string().optional()
    })
  },
  triggerScrape: {
    description: 'Initiate scraping of the current URL',
    inputSchema: z.object({
      forceRefresh: z.boolean().optional().default(false).describe('Force fresh scrape, bypassing cache')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      // cached: z.boolean().optional(),
      // url: z.string().optional(),
      // statusCode: z.number().optional(),
      // extractionResult: z.object({
      //   success: z.boolean(),
      //   data: z.any().optional(),
      //   error: z.string().optional(),
      //   validationErrors: z.array(z.string()).optional()
      // }).optional(),
      error: z.string().optional()
    })
  }
  // 'schema-update': {
  //   description: 'Update the project schema definition',
  //   inputSchema: z.object({
  //     filename: z.string().describe('The schema file to update'),
  //     content: z.string().describe('The new schema content'),
  //     version: z.string().optional().describe('Schema version')
  //   }),
  //   outputSchema: z.object({
  //     success: z.boolean(),
  //     filename: z.string(),
  //     version: z.string().optional(),
  //     message: z.string().optional()
  //   })
  // },
  // 'code-update': {
  //   description: 'Update extraction code',
  //   inputSchema: z.object({
  //     filename: z.string().describe('The code file to update'),
  //     content: z.string().describe('The new code content'),
  //     version: z.string().optional().describe('Code version')
  //   }),
  //   outputSchema: z.object({
  //     success: z.boolean(),
  //     filename: z.string(),
  //     version: z.string().optional(),
  //     message: z.string().optional()
  //   })
  // }
} satisfies ToolSet
export default tools
