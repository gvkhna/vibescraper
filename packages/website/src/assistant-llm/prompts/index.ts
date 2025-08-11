import TestPromptRaw from './test-prompt.txt?raw'
import TestPingPromptRaw from './test-ping-prompt.txt?raw'
import template from 'lodash-es/template'

export function TestPrompt(opts: object) {
  return template(TestPromptRaw)(opts)
}

export function TestPingPrompt(opts: object) {
  return template(TestPingPromptRaw)(opts)
}
