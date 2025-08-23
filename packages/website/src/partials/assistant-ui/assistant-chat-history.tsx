import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {MoreHorizontal, Trash2, MessageSquare, Clock, Plus} from 'lucide-react'
import {cn} from '@/lib/utils'
import {formatDistanceToNow} from 'date-fns'
import {useStore} from '@/store/use-store'
import {nowait} from '@/lib/async-utils'
import debug from 'debug'

const log = debug('app:assistant-chat-history')

interface AssistantChatHistoryProps {
  className?: string
}

export function AssistantChatHistory({className}: AssistantChatHistoryProps) {
  const project = useStore((state) => state.projectSlice.project?.project)
  const projectChatsState = useStore((state) => state.assistantSlice.projectChatsState)
  const selectedProjectChat = useStore((state) => state.assistantSlice.selectedProjectChat)
  const selectChat = useStore((state) => state.assistantSlice.selectChat)
  const newChat = useStore((state) => state.assistantSlice.newChat)
  const deleteProjectChat = useStore((state) => state.assistantSlice.deleteProjectChat)
  const setAssistantPanelView = useStore((state) => state.editorSlice.setAssistantPanelView)

  const projectPublicId = project?.publicId
  if (!projectPublicId) {
    log('expected project public id not found!')
    return null
  }

  const conversations = projectChatsState[projectPublicId]
  if (!conversations) {
    log('expected project conversations but not found!')
    return null
  }

  const selectedChatId = selectedProjectChat[projectPublicId]
  const displayChats = conversations.projectChats

  return (
    <div className={cn('flex h-full flex-col overflow-hidden bg-[#0A0A0B]', className)}>
      {/* New Chat Button */}
      <div className='flex-shrink-0 border-b border-white/10 p-3'>
        <Button
          className='w-full bg-blue-600 text-white hover:bg-blue-700'
          onClick={() => {
            newChat(projectPublicId)
            setAssistantPanelView('conversation')
          }}
        >
          <Plus className='mr-2 h-4 w-4' />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className='flex-1 overflow-y-auto overflow-x-hidden'>
        <div className='space-y-1 p-3'>
          {displayChats.length === 0 ? (
            <div className='flex h-32 items-center justify-center px-2 text-center'>
              <div>
                <MessageSquare className='mx-auto mb-2 h-6 w-6 text-white/30' />
                <p className='text-xs text-white/50'>No conversations yet</p>
                <p className='mt-1 text-xs text-white/30'>Start a new chat</p>
              </div>
            </div>
          ) : (
            displayChats
              .filter((chat) => chat.chatType !== 'empty')
              .map((chat) => (
                <div
                  key={chat.publicId}
                  className={cn(
                    'group relative cursor-pointer rounded-lg transition-all',
                    'hover:bg-white/5',
                    selectedChatId === chat.publicId && 'bg-white/10'
                  )}
                  onClick={() => {
                    selectChat(projectPublicId, chat.publicId)
                    setAssistantPanelView('conversation')
                  }}
                >
                  <div className='flex items-start gap-3 p-3'>
                    <div className='min-w-0 flex-1 overflow-hidden'>
                      <h3 className='truncate text-sm font-medium text-white'>
                        {chat.title || 'Untitled Chat'}
                      </h3>
                      <div className='mt-1 flex items-center gap-3 text-xs text-white/40'>
                        <span className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {chat.updatedAt
                            ? formatDistanceToNow(new Date(chat.updatedAt), {addSuffix: true})
                            : 'recently'}
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-white/60 hover:bg-white/10 hover:text-white'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          className='w-[160px] border-white/10 bg-[#151517]'
                        >
                          <DropdownMenuItem
                            className='text-red-400 hover:bg-red-900/20 hover:text-red-400'
                            onClick={() => {
                              nowait(deleteProjectChat(projectPublicId, chat.publicId))
                            }}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
