import debug from 'debug'

import type { ProjectPublicId } from '@/db/schema'
import type { ProjectChatPublicId } from '@/db/schema'
import { useStore } from '@/store/use-store'

const log = debug('app:assistant-pending-initial-message-await')

export async function assistantPendingInitialMessageAwait(
  projectPublicId: ProjectPublicId,
  selectedChat: ProjectChatPublicId,
  callback: () => void
): Promise<void> {
  const store = useStore.getState()

  // Check if there's a pending message for this project
  const pendingInitialMessage = store.assistantSlice.pendingInitialMessage[projectPublicId]

  // If no pending message or it doesn't match the selected chat, return early
  if (!pendingInitialMessage || pendingInitialMessage !== selectedChat) {
    log('No pending initial message or chat mismatch')
    return
  }

  // Set up subscription and clear in one promise
  return new Promise<void>((resolve) => {
    // Subscribe BEFORE clearing to ensure we catch the state transition
    const unsubscribe = useStore.subscribe(
      (state) => state.assistantSlice.pendingInitialMessage[projectPublicId],
      (newPending, prevPending) => {
        log('assistant message await state change prev:', prevPending, newPending)
        // This state transition will only happen once: when the pending message is cleared
        if (prevPending && !newPending) {
          log('Pending message cleared, invoking callback')
          unsubscribe()
          callback()
          resolve()
        }
      }
    )

    // Clear the pending message after subscription is set up
    store.assistantSlice.clearPendingInitialMessage(projectPublicId)
  })
}
