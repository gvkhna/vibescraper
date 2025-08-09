import type {Patch, WritableDraft} from 'immer'
import type {EnforceExactWritable} from '@/lib/type-utils'

const MAX_HISTORY_LENGTH = 100 // Limit history to prevent memory issues

export interface UndoHistoryState {
  readonly past: Array<{patches: Patch[]; inversePatches: Patch[]}>
  readonly future: Array<{patches: Patch[]; inversePatches: Patch[]}>
  readonly canUndo: boolean
  readonly canRedo: boolean
}

export function initialUndoHistoryState(): UndoHistoryState {
  return {
    past: [],
    future: [],
    canUndo: false,
    canRedo: false
  }
}

export function recordHistoryChange<T>(
  history: EnforceExactWritable<T, UndoHistoryState>,
  patches: Patch[],
  inversePatches: Patch[]
) {
  const draft = history as WritableDraft<UndoHistoryState>
  draft.future = []
  draft.past.push({patches, inversePatches})
  if (draft.past.length > MAX_HISTORY_LENGTH) {
    draft.past.shift() // Remove oldest item
  }

  draft.canUndo = true
  draft.canRedo = false
}

export function getUndoPatches(history: UndoHistoryState) {
  const {past, future} = history

  if (past.length === 0) {
    return
  }

  const lastChange = past[past.length - 1]
  return lastChange.inversePatches
}

export function updateUndoHistory<T>(history: EnforceExactWritable<T, UndoHistoryState>) {
  const draft = history as WritableDraft<UndoHistoryState>
  const {past, future} = draft

  if (past.length === 0) {
    return
  }

  const lastChange = past[past.length - 1]

  draft.past.pop()
  draft.future.unshift(lastChange)
  draft.canUndo = draft.past.length > 0
  draft.canRedo = true
}

export function getRedoPatches(history: UndoHistoryState) {
  const {past, future} = history

  if (future.length === 0) {
    return
  }

  const nextChange = future[0]
  return nextChange.patches
}

export function updateRedoHistory<T>(history: EnforceExactWritable<T, UndoHistoryState>) {
  const draft = history as WritableDraft<UndoHistoryState>
  const {past, future} = draft

  if (future.length === 0) {
    return
  }

  const nextChange = future[0]
  draft.past.push(nextChange)
  draft.future.shift()
  draft.canUndo = true
  draft.canRedo = draft.future.length > 0
}
