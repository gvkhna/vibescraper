import template from 'lodash-es/template'

import AssistantPromptRaw from './assistant-prompt-v3.txt?raw'
import ExtractorPromptRaw from './extractor-prompt.txt?raw'
import SchemaToolsPromptRaw from './schema-tools-prompt.txt?raw'
import TestPingPromptRaw from './test-ping-prompt.txt?raw'
import TestPromptRaw from './test-prompt.txt?raw'

export function AssistantPrompt(opts: object) {
  return template(AssistantPromptRaw)(opts)
}

export function TestPrompt(opts: object) {
  return template(TestPromptRaw)(opts)
}

export function TestPingPrompt(opts: object) {
  return template(TestPingPromptRaw)(opts)
}

export function ExtractorPrompt(opts: object) {
  return template(ExtractorPromptRaw)(opts)
}

export function SchemaToolsPrompt(opts: object) {
  return template(SchemaToolsPromptRaw)(opts)
}
