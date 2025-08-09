import {useEffect} from 'react'
import debug from 'debug'
// import {ChatInput, ChatInputSubmit, ChatInputTextArea} from '@/components/ui/chat-input'

import api from '@/lib/api-client'
import {useChat} from '@ai-sdk/react'
import {useProjectStore} from '@/store/use-project-store'
import {nowait} from '@/lib/async-utils'
import type {ProjectPublicId, ProjectCommitPublicId} from '@/db/schema/project'
import type {
  ProjectChatDTOType,
  ProjectChatPublicId,
  ProjectChatMessagePublicId
  // ProjectFilePublicId
} from '@/db/schema/project-chat'
// import {projectChatMessagesToMessages} from '@/partials/assistant-ui/chat-message-schema'
// import {ChatConversation} from './_chat-conversation'
import {AssistantProjectContextProvider} from './assistant-project-context'
import {AssistantProjectComponent} from './assistant-project-component'

const log = debug('app:chat-window')

export interface ChatWindowProps {
  projectPublicId: ProjectPublicId
  projectCommitPublicId: ProjectCommitPublicId
  selectedChat: ProjectChatPublicId
  projectChat: ProjectChatDTOType
  initialMessages: ProjectChatMessagePublicId[]
}

export function ChatWindow(props: ChatWindowProps) {
  const chatMessages = useProjectStore((state) => state.assistantSlice.chatMessages)
  const fetchProjectChatMessage = useProjectStore((state) => state.assistantSlice.fetchProjectChatMessage)
  const loadProjectChatTitle = useProjectStore((state) => state.assistantSlice.loadProjectChatTitle)

  const editorSliceActiveTab = useProjectStore((state) => state.editorSlice.activeTab)
  // const editorSliceOpenTabs = useProjectStore((state) => state.editorSlice.openTabs)

  const projectCommitFiles = useProjectStore((state) => state.projectSlice.projectCommitFiles)

  // const activeTabProjectFilePublicId = (): {publicId: ProjectFilePublicId; fileName: string} | null => {
  //   const activeTabRef = editorSliceActiveTab[props.projectPublicId]
  //   const projectOpenTabs = editorSliceOpenTabs[props.projectPublicId]
  //   if (activeTabRef && projectOpenTabs) {
  //     const currentActiveTab = projectOpenTabs.find((tab) => tab.tabId === activeTabRef)
  //     if (currentActiveTab?.projectFile) {
  //       const fileId = currentActiveTab.projectFile.publicId
  //       const projectFile = projectCommitFiles?.find((file) => file.publicId === fileId)
  //       if (projectFile) {
  //         return {publicId: fileId, fileName: projectFile.fileName}
  //       }
  //     }
  //   }
  //   return null
  // }

  type TabInfo = {publicId: ProjectFilePublicId; fileName: string}
  const openTabsInfo = (): TabInfo[] | null => {
    const projectOpenTabs = editorSliceOpenTabs[props.projectPublicId] ?? []
    const activeTabId = editorSliceActiveTab[props.projectPublicId]

    const tabs: TabInfo[] = []

    for (const tab of projectOpenTabs) {
      if (!tab.projectFile) {
        continue
      }

      const file = projectCommitFiles?.find((f) => f.publicId === tab.projectFile!.publicId)
      if (!file) {
        continue
      }

      const info: TabInfo = {publicId: file.publicId, fileName: file.fileName}

      // Push active tab to the **front**, others to the back
      if (tab.tabId === activeTabId) {
        tabs.unshift(info) // active first
      } else {
        tabs.push(info) // everything else
      }
    }

    return tabs
  }

  const {messages, input, handleInputChange, handleSubmit, status, stop} = useChat({
    // key: selectedChat,
    // credentials: 'include',
    api: api.assistant.chat.$url().toString(),
    // body: {projectChatPublicId: props.selectedChat},
    // initialInput: pendingInitialMessage,
    id: props.selectedChat,
    experimental_prepareRequestBody: (bodyOpts) => {
      return {
        message: bodyOpts.messages[bodyOpts.messages.length - 1],
        projectCommitPublicId: props.projectCommitPublicId,
        projectChatPublicId: props.selectedChat,
        openTabs: openTabsInfo()
      }
    },
    initialMessages: projectChatMessagesToMessages(props.initialMessages, chatMessages),
    sendExtraMessageFields: true,

    onResponse(response) {
      log('resp:', response)
      if (props.initialMessages.length === 0) {
        log('starting new chat kicking off reloading')
        // this means we received a response when the chat was initially empty
        // so we can just trigger an api request to generate a title
        queueMicrotask(() => {
          nowait(loadProjectChatTitle(props.projectPublicId, props.projectChat.publicId))
        })
      }
    },
    onToolCall({toolCall}) {
      log('toolcall', toolCall)
    },
    onError(error) {
      log('onError', error)
    },
    onFinish: (message) => {
      log('onFinish', message)
      if (message.id) {
        nowait(fetchProjectChatMessage(props.selectedChat, message.id as ProjectChatMessagePublicId))
      }
    }
  })

  useEffect(() => {
    log('use chat status', status)
  }, [status])

  const handleSubmitMessage = () => {
    log('handling subsequent message submit')
    if (status !== 'ready') {
      return
    }
    handleSubmit()
  }

  return (
    <div
      id='chat'
      className='flex h-full flex-1 flex-col overflow-y-auto'
    >
      <AssistantProjectContextProvider value={AssistantProjectComponent}>
        <ChatConversation messages={messages} />
      </AssistantProjectContextProvider>

      <div className='mx-auto w-full max-w-2xl px-2 py-4'>
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmitMessage}
          loading={status !== 'ready'}
          onStop={stop}
        >
          <ChatInputTextArea placeholder='Type a message...' />
          <ChatInputSubmit />
        </ChatInput>
      </div>
    </div>
  )
}
