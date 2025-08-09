import {type ComponentPropsWithoutRef} from 'react'
import debug from 'debug'
import {useProjectStore} from '@/store/use-project-store'
import {nowait} from '@/lib/async-utils'
import {ChatWindow} from './chat-window'
import {LoadingSpinner} from '@/components/loading-spinner'
import {isLoaded} from '@/store/async-entity-state'

const log = debug('app:assistant-chat')

function LoadingScreen() {
  return (
    <div className='flex h-full items-center justify-center'>
      <LoadingSpinner className='h-8 w-8 text-blue-500' />
    </div>
  )
}

export function AssistantChat({className, ...props}: ComponentPropsWithoutRef<'div'>) {
  const project = useProjectStore((state) => state.projectSlice.project?.project)
  const projectCommit = useProjectStore((state) => state.projectSlice.projectCommit)
  const projectChatsState = useProjectStore((state) => state.assistantSlice.projectChatsState)
  const selectedProjectChat = useProjectStore((state) => state.assistantSlice.selectedProjectChat)
  const projectChatMessagesState = useProjectStore((state) => state.assistantSlice.projectChatMessagesState)

  const loadProjectChatMessages = useProjectStore((state) => state.assistantSlice.loadProjectChatMessages)
  const loadNewChat = useProjectStore((state) => state.assistantSlice.loadNewChat)

  const projectPublicId = project?.publicId
  if (!projectPublicId) {
    log('expected project public id not found!')
    return
  }

  if (!projectCommit) {
    log('expected project commit but not found!')
    return
  }

  const projectChats = projectChatsState[projectPublicId]?.projectChats
  if (!projectChats) {
    log('expected project chats but not found')
    return
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
    log('returning empty state')
    return (
      <ChatWindow
        projectPublicId={projectPublicId}
        projectCommitPublicId={projectCommit.publicId}
        selectedChat={selectedChat}
        projectChat={projectChat}
        initialMessages={[]}
      />
    )
  } else {
    log('hit on loading messages')
    const chatMessagesState = projectChatMessagesState[projectChat.publicId]
    const messagesAsyncEntity = chatMessagesState?.asyncEntityState
    if (!chatMessagesState || !messagesAsyncEntity) {
      // we need to load it
      queueMicrotask(() => {
        nowait(loadProjectChatMessages(projectChat.publicId))
      })
    }
    log('checking states')
    if (chatMessagesState && messagesAsyncEntity && isLoaded(messagesAsyncEntity)) {
      // log('loaded project chat messages', chatMessagesState.projectChatMessages)
      return (
        <ChatWindow
          projectPublicId={projectPublicId}
          projectCommitPublicId={projectCommit.publicId}
          selectedChat={selectedChat}
          projectChat={projectChat}
          initialMessages={chatMessagesState.projectChatMessages}
        />
      )
    }

    return <LoadingScreen />
  }
}
