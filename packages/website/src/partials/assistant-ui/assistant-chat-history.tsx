'use client'
import {Button} from '@/components/ui/button'
import {Card, CardHeader, CardTitle} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {MoreHorizontal, Trash2} from 'lucide-react'
import {useProjectStore} from '@/store/use-project-store'
import debug from 'debug'
import {nowait} from '@/lib/async-utils'

const log = debug('app:assistant-chat-history')

export function AssistantChatHistory() {
  const project = useProjectStore((state) => state.projectSlice.project?.project)

  const projectChatsState = useProjectStore((state) => state.assistantSlice.projectChatsState)
  const selectChat = useProjectStore((state) => state.assistantSlice.selectChat)
  const newChat = useProjectStore((state) => state.assistantSlice.newChat)
  const deleteProjectChat = useProjectStore((state) => state.assistantSlice.deleteProjectChat)

  const projectPublicId = project?.publicId
  if (!projectPublicId) {
    log('expected project public id not found!')
    return
  }

  const conversations = projectChatsState[project.publicId]
  if (!conversations) {
    log('expected project conversations but not found!')
    return
  }

  return (
    <div className='flex min-h-screen flex-col bg-gray-50'>
      {/* <header className='sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex h-14 items-center px-4'>
          <div className='relative max-w-md flex-1'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search for a chat...'
              className='w-full bg-muted/50 pl-8'
            />
          </div>
        </div>
      </header> */}
      <div className='flex-1 space-y-4 p-4'>
        <div className='flex pb-4'>
          <Button
            className='flex-1'
            onClick={() => {
              newChat(projectPublicId)
            }}
          >
            New Chat
          </Button>
        </div>
        {conversations.projectChats
          .filter((chat) => chat.chatType !== 'empty')
          .map((conversation) => (
            <div
              key={conversation.publicId}
              className='group relative cursor-pointer transition-colors'
              onClick={() => {
                selectChat(projectPublicId, conversation.publicId)
              }}
            >
              <Card className='hover:bg-muted/50 relative transition-colors'>
                <CardHeader className='px-4 pb-4 pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <CardTitle className='text-base'>{conversation.title || 'Untitled Chat'}</CardTitle>
                      {/* {conversation.locked && <Lock className='h-4 w-4 text-muted-foreground' />} */}
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          className='w-[180px]'
                        >
                          {/* <DropdownMenuItem>
                            <Share className='mr-2 h-4 w-4' />
                            <span>Share</span>
                          </DropdownMenuItem> */}
                          {/* <DropdownMenuItem>
                            <Pencil className='mr-2 h-4 w-4' />
                            <span>Rename</span>
                          </DropdownMenuItem> */}
                          {/* <DropdownMenuItem>
                            <Star className='mr-2 h-4 w-4' />
                            <span>Favorite</span>
                          </DropdownMenuItem> */}
                          {/* <DropdownMenuSeparator /> */}
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => {
                              nowait(deleteProjectChat(projectPublicId, conversation.publicId))
                            }}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                {/* <CardContent className='px-4 pb-4 pt-0'>
                <p className='line-clamp-1 text-sm text-muted-foreground'>{conversation.preview}</p>
              </CardContent> */}
                {/* <CardFooter className='pt-2'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-6 w-6'>
                    <AvatarImage
                      src={conversation.avatar || '/placeholder.svg'}
                      alt={conversation.user}
                    />
                    <AvatarFallback>{conversation.user.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium'>{conversation.user}</span>
                  <span className='text-xs text-muted-foreground'>{conversation.updated}</span>
                </div>
              </CardFooter> */}
              </Card>
            </div>
          ))}
      </div>
    </div>
  )
}
