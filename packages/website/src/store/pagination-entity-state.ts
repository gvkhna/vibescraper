import type {WritableDraft, Draft} from 'immer'
import type {EnforceExactWritable} from '@/lib/type-utils'

export type LoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed'
export type SavingState = 'idle' | 'saving' | 'error'

export const DEFAULT_PAGE_SIZE = 100 // <- set to 2 for testing, bump to 25 for prod

export interface PaginationEntityState<TCursor> {
  readonly hasNextPage: boolean
  readonly startCursor?: TCursor | null
}

export function initialPaginationEntityState<TCursor>(): WritableDraft<PaginationEntityState<TCursor>> {
  return {
    hasNextPage: false,
    startCursor: null
  }
}

export function updatePaginationEntityState<T, TCursor>(
  entity: EnforceExactWritable<T, PaginationEntityState<TCursor>>,
  {startCursor, hasNextPage}: {startCursor: TCursor | null; hasNextPage: boolean}
) {
  const draft = entity as WritableDraft<PaginationEntityState<TCursor>>
  draft.startCursor = startCursor as Draft<TCursor> | null | undefined
  draft.hasNextPage = hasNextPage
}

export function resetPaginationEntityState<T, TCursor>(
  entity: EnforceExactWritable<T, PaginationEntityState<TCursor>>
) {
  const draft = entity as WritableDraft<PaginationEntityState<TCursor>>
  draft.startCursor = null
  draft.hasNextPage = false
}

/**
 * A db row that can be cursor‐paginated: must have a publicId string.
 */
export interface PaginationEntityCursorRow {
  publicId: string
}

/**
 * The result of cursor pagination, with pageInfo.
 */
export interface PaginationEntityResult<T, C extends string> {
  items: T[]
  pageInfo: PaginationEntityState<C>
}

/**
 * Returns you a `paginate` function that is hard-wired to use
 * your chosen cursor brand `C`.  T is always inferred from the input rows.
 */
export function createPaginationEntity<C extends string>() {
  return function paginate<T extends PaginationEntityCursorRow>(
    rows: T[] | undefined,
    pageSize: number
  ): PaginationEntityResult<T, C> {
    if (!rows || rows.length === 0) {
      return {
        items: [],
        pageInfo: {hasNextPage: false, startCursor: null}
      }
    }

    const hasNextPage = rows.length > pageSize
    const items = hasNextPage ? rows.slice(0, pageSize) : rows
    const last = items[items.length - 1]

    const startCursor = hasNextPage ? (last.publicId as unknown as C) : null

    return {
      items,
      pageInfo: {hasNextPage, startCursor}
    }
  }
}
