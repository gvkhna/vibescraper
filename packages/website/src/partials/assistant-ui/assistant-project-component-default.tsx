import { ChatFileProjectVersionBlock } from './chat-file-version-block'

export interface AssistantProjectComponentDefaultProps {}

export function AssistantProjectComponentDefault(props: AssistantProjectComponentDefaultProps) {
  return (
    <ChatFileProjectVersionBlock
      versionBlock={{
        type: 'extractor',
        version: 1,
        changes: [],
        overallStatus: 'error'
      }}
      isLoading={true}
      isViewing={false}
    />
  )
}
