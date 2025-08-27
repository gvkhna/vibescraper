import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {ExtractorPage} from '@/partials/extractor/extractor-page'
import {z} from 'zod'
import {useEffect} from 'react'
import {useStore} from '@/store/use-store'
import type {ProjectChatPublicId, ProjectPublicId} from '@/db/schema'
import {ProjectDialogs} from '@/partials/dialogs/project-dialogs'
import {nowait} from '@/lib/async-utils'

// Define search params schema for optional chat parameter
const searchSchema = z.object({
  chat: z.string().optional()
})

export const Route = createFileRoute('/app/scraper/$project-public-id/edit')({
  validateSearch: searchSchema,
  component: Page
})

function Page() {
  const {['project-public-id']: projectPublicId} = Route.useParams()
  const {chat: chatId} = Route.useSearch()
  const navigate = useNavigate({from: '/app/scraper/$project-public-id/edit'})

  const loadProject = useStore((state) => state.projectSlice.loadProject)

  useEffect(() => {
    // If there was a chatId in the URL, clear it immediately after loading
    // This prevents any issues with navigation during chat operations
    if (chatId) {
      // console.log('chatid', chatId)
      navigate({
        search: {},
        replace: true
      })
        .then(() => {
          nowait(loadProject(projectPublicId as ProjectPublicId, chatId as ProjectChatPublicId))
        })
        .catch(() => {})
    } else {
      nowait(loadProject(projectPublicId as ProjectPublicId))
    }
  }, [projectPublicId, chatId, loadProject, navigate])

  return (
    <>
      <ExtractorPage
        projectPublicId={projectPublicId}
        chatId={chatId}
      />
      <ProjectDialogs />
    </>
  )
}
