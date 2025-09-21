import type { WritableDraft } from 'immer'

import type { EnforceExactWritable } from '@/lib/type-utils'

export type LoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed'
export type SavingState = 'idle' | 'saving' | 'error'

export interface AsyncEntityState {
  readonly loadingStatus: LoadingState
  readonly savingStatus: SavingState
  readonly isDirty: boolean
}

export function initialAsyncEntityState(): WritableDraft<AsyncEntityState> {
  return {
    loadingStatus: 'unloaded',
    savingStatus: 'idle',
    isDirty: false
  }
}

export function isDirty(entity: AsyncEntityState): boolean {
  return entity.isDirty
}

export function isLoading(entity: AsyncEntityState): boolean {
  return entity.loadingStatus === 'loading'
}

export function isLoaded(entity: AsyncEntityState): boolean {
  return entity.loadingStatus === 'loaded'
}

export function isFailed(entity: AsyncEntityState): boolean {
  return entity.loadingStatus === 'failed'
}

export function startLoading<T>(entity: EnforceExactWritable<T, AsyncEntityState>) {
  const draft = entity as WritableDraft<AsyncEntityState>
  draft.loadingStatus = 'loading'
}

// Successfully finish loading and set the data
export function finishLoading<T>(entity: EnforceExactWritable<T, AsyncEntityState>) {
  const draft = entity as WritableDraft<AsyncEntityState>
  draft.loadingStatus = 'loaded'
  draft.isDirty = false
}

// Mark loading as failed
export function failLoading<T>(entity: EnforceExactWritable<T, AsyncEntityState>) {
  const draft = entity as WritableDraft<AsyncEntityState>
  draft.loadingStatus = 'failed'
}

// Mark the entity as dirty when a change occurs
export function markDirty<T>(entity: EnforceExactWritable<T, AsyncEntityState>) {
  const draft = entity as WritableDraft<AsyncEntityState>
  draft.isDirty = true
}

// Start saving the entity (for example, when an API call is initiated)
export function startSaving<T>(entity: EnforceExactWritable<T, AsyncEntityState>) {
  const draft = entity as WritableDraft<AsyncEntityState>
  // When saving begins, we assume that there's a pending change.
  draft.savingStatus = 'saving'
}

// Finish saving; if no new changes occurred during the save, clear the dirty flag.
// The snapshot parameter is the data captured right before the save started.
export function finishSaving<T>({
  entity,
  isUnchanged
}: {
  entity: EnforceExactWritable<T, AsyncEntityState>
  isUnchanged: boolean
}) {
  const draft = entity as WritableDraft<AsyncEntityState>
  // Compare the snapshot to the current data to detect changes made during saving.
  // const isUnchanged = entity.data === snapshot;
  draft.savingStatus = 'idle'
  draft.isDirty = isUnchanged ? false : true
}

// Mark that saving failed.
export function failSaving<T>(entity: EnforceExactWritable<T, AsyncEntityState>) {
  const draft = entity as WritableDraft<AsyncEntityState>
  draft.savingStatus = 'error'
}
