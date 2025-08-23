import type {StateSlice} from './use-store'
import api from '@/lib/api-client'
import debug from 'debug'

const log = debug('app:models-slice')

export interface ModelSelectOption {
  name: string
  value: string
}

export interface ModelsSlice {
  models: ModelSelectOption[]
  lastUpdated: number | null
  isLoading: boolean

  // Actions
  fetchModels: () => Promise<void>
}

// Default models for select component
const DEFAULT_MODELS: ModelSelectOption[] = [
  {
    name: 'Small',
    value: 'small'
  },
  {
    name: 'Medium',
    value: 'medium'
  },
  {
    name: 'Large',
    value: 'large'
  }
]

export const createModelsSlice: StateSlice<ModelsSlice> = (set, get) => ({
  models: DEFAULT_MODELS,
  lastUpdated: null,
  isLoading: false,

  fetchModels: async () => {
    const currentState = get().modelsSlice

    // Check if we should refresh (once per day)
    if (currentState.lastUpdated) {
      const oneDayMs = 24 * 60 * 60 * 1000
      const shouldRefresh = Date.now() - currentState.lastUpdated > oneDayMs
      if (!shouldRefresh) {
        return
      }
    }

    set(
      (draft) => {
        draft.modelsSlice.isLoading = true
      },
      true,
      'models/fetchModels:start'
    )

    try {
      const response = await api.assistant.models.$get()
      if (response.ok) {
        const data = await response.json()
        set(
          (draft) => {
            draft.modelsSlice.models = [
              {
                name: data.models.small ? `Small - ${data.models.small}` : 'Small',
                value: 'small'
              },
              {
                name: data.models.medium ? `Medium - ${data.models.medium}` : 'Medium',
                value: 'medium'
              },
              {
                name: data.models.large ? `Large - ${data.models.large}` : 'Large',
                value: 'large'
              }
            ]
            draft.modelsSlice.lastUpdated = Date.now()
          },
          true,
          'models/fetchModels:success'
        )
      }
    } catch (error) {
      log('Failed to fetch models:', error)
      // Silently fail and use cached/default data
    } finally {
      set(
        (draft) => {
          draft.modelsSlice.isLoading = false
        },
        true,
        'models/fetchModels:done'
      )
    }
  }
})
