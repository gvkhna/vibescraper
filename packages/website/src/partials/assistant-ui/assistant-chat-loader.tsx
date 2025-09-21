'use client'

import debug from 'debug'

import { nowait } from '@/lib/async-utils'
import { isLoaded } from '@/store/async-entity-state'
import { useStore } from '@/store/use-store'

import { AssistantChat } from './assistant-chat'

const log = debug('app:assistant-chat-loader')

function LoadingScreen() {
  return (
    <div className='flex h-full items-center justify-center'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent' />
    </div>
  )
}

export function AssistantChatLoader() {
  const project = useStore((state) => state.projectSlice.project?.project)
  const projectCommit = useStore((state) => state.extractorSlice.projectCommit)
  const projectChatsState = useStore((state) => state.assistantSlice.projectChatsState)
  const selectedProjectChat = useStore((state) => state.assistantSlice.selectedProjectChat)
  const projectChatMessagesState = useStore((state) => state.assistantSlice.projectChatMessagesState)

  const loadProjectChatMessages = useStore((state) => state.assistantSlice.loadProjectChatMessages)
  const loadNewChat = useStore((state) => state.assistantSlice.loadNewChat)

  const projectPublicId = project?.publicId
  if (!projectPublicId) {
    log('expected project public id not found!')
    return null
  }

  if (!projectCommit) {
    log('expected project commit but not found!')
    return null
  }

  const projectChats = projectChatsState[projectPublicId]?.projectChats
  if (!projectChats) {
    log('expected project chats but not found')
    return null
  }

  const selectedChat = selectedProjectChat[projectPublicId]

  if (!selectedChat) {
    log('expected selected chat but not found')
    queueMicrotask(() => {
      nowait(loadNewChat(projectPublicId))
    })
    return <LoadingScreen />
  }

  const projectChat = projectChats.find((chat) => chat.publicId === selectedChat)

  if (!projectChat) {
    log('expected project chat but not found')
    queueMicrotask(() => {
      nowait(loadNewChat(projectPublicId))
    })
    return <LoadingScreen />
  }

  if (projectChat.chatType === 'empty') {
    log('returning empty chat state')
    return (
      <AssistantChat
        projectPublicId={projectPublicId}
        projectCommitPublicId={projectCommit.publicId}
        selectedChat={selectedChat}
        projectChat={projectChat}
        initialMessageIds={[]}
      />
    )
  } else {
    log('loading messages for non-empty chat')
    const chatMessagesState = projectChatMessagesState[projectChat.publicId]
    const messagesAsyncEntity = chatMessagesState?.asyncEntityState

    if (!chatMessagesState || !messagesAsyncEntity) {
      // we need to load it
      queueMicrotask(() => {
        nowait(loadProjectChatMessages(projectChat.publicId))
      })
      return <LoadingScreen />
    }

    log('checking states')
    if (isLoaded(messagesAsyncEntity)) {
      // Messages are loaded, render the chat
      return (
        <AssistantChat
          projectPublicId={projectPublicId}
          projectCommitPublicId={projectCommit.publicId}
          selectedChat={selectedChat}
          projectChat={projectChat}
          initialMessageIds={chatMessagesState.projectChatMessages}
        />
      )
    }

    return <LoadingScreen />
  }
}
