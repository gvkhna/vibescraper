import {createToolMockModel, type ToolMockModelKey, type ToolMockModelValue} from './create-tool-mock-model'

export function mockTestToolsModel() {
  const x = new Map<ToolMockModelKey, ToolMockModelValue>()

  x.set('ping', (p) => {
    return [
      {type: 'tool-input-start', toolName: 'ping', id: 'ping-1'},
      {type: 'tool-input-delta', delta: '{"input":true}', id: 'ping-1'},
      {type: 'tool-input-end', id: 'ping-1'},
      {
        type: 'tool-call',
        toolCallId: 'ping-1',
        toolName: 'ping',
        input: '{"input": true}',
        providerExecuted: true
      },
      {
        type: 'tool-result',
        toolCallId: 'ping-1',
        toolName: 'ping',
        result: {success: true, message: 'pong'}
      }
    ] satisfies ToolMockModelValue
  })

  x.set('update schema', (p) => {
    return [
      // First tool: schema-update
      {type: 'tool-input-start', toolName: 'schema-update', id: 'schema-1'},
      {type: 'tool-input-delta', delta: '{"filename":"schema.json","content":"{}","version":"v2"}', id: 'schema-1'},
      {type: 'tool-input-end', id: 'schema-1'},
      {
        type: 'tool-call',
        toolCallId: 'schema-1',
        toolName: 'schema-update',
        input: '{"filename":"schema.json","content":"{}","version":"v2"}',
        providerExecuted: true
      },
      {
        type: 'tool-result',
        toolCallId: 'schema-1',
        toolName: 'schema-update',
        result: {success: true, filename: 'schema.json', version: 'v2', message: 'Schema updated'}
      },
      // Second tool: code-update
      {type: 'tool-input-start', toolName: 'code-update', id: 'code-1'},
      {type: 'tool-input-delta', delta: '{"filename":"extractor.js","content":"// code","version":"v2"}', id: 'code-1'},
      {type: 'tool-input-end', id: 'code-1'},
      {
        type: 'tool-call',
        toolCallId: 'code-1',
        toolName: 'code-update',
        input: '{"filename":"extractor.js","content":"// code","version":"v2"}',
        providerExecuted: true
      },
      {
        type: 'tool-result',
        toolCallId: 'code-1',
        toolName: 'code-update',
        result: {success: true, filename: 'extractor.js', version: 'v2', message: 'Code updated'}
      }
    ] satisfies ToolMockModelValue
  })

  return createToolMockModel(x)
}
