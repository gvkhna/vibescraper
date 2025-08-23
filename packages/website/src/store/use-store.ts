import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {persist, devtools, createJSONStorage, subscribeWithSelector} from 'zustand/middleware'
import {enablePatches} from 'immer'
import type {StateCreator} from 'zustand'
import mergeDeepLeft from 'ramda/es/mergeDeepLeft'

import {createAssistantSlice, type AssistantSlice} from './assistant-slice'
import {createEditorSlice, type EditorSlice} from './editor-slice'
import {createProjectSlice, type ProjectSlice} from './project-slice'
import {createRecentProjectsSlice, type RecentProjectsSlice} from './recent-projects-slice'
import {createExtractorSlice, type ExtractorSlice} from './extractor-slice'
import {createModelsSlice, type ModelsSlice} from './models-slice'

// Do not use
// enableMapSet() prefer to use json objects for clear serialization
enablePatches()

export interface CombinedState {
  assistantSlice: AssistantSlice
  editorSlice: EditorSlice
  projectSlice: ProjectSlice
  recentProjectsSlice: RecentProjectsSlice
  extractorSlice: ExtractorSlice
  modelsSlice: ModelsSlice
}

export type StateSlice<T> = StateCreator<
  CombinedState,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/subscribeWithSelector', never]],
  [['zustand/persist', Partial<T>]],
  T
>

export const LOCAL_STORAGE_PROJECT_STORE_KEY = 'project-store'

export const useStore = create<CombinedState>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((...api) => ({
          assistantSlice: (createAssistantSlice as (...a: unknown[]) => AssistantSlice)(...api),
          editorSlice: (createEditorSlice as (...a: unknown[]) => EditorSlice)(...api),
          projectSlice: (createProjectSlice as (...a: unknown[]) => ProjectSlice)(...api),
          recentProjectsSlice: (createRecentProjectsSlice as (...a: unknown[]) => RecentProjectsSlice)(
            ...api
          ),
          extractorSlice: (createExtractorSlice as (...a: unknown[]) => ExtractorSlice)(...api),
          modelsSlice: (createModelsSlice as (...a: unknown[]) => ModelsSlice)(...api)
        })),
        {
          name: LOCAL_STORAGE_PROJECT_STORE_KEY,
          storage: createJSONStorage(() => globalThis.localStorage),
          partialize: (state) => {
            return {
              assistantSlice: {
                selectedProjectChat: state.assistantSlice.selectedProjectChat,
                chatModels: state.assistantSlice.chatModels
                // projectComponentIdempotencyKeys: state.assistantSlice.projectComponentIdempotencyKeys
              },
              // projectSlice: {
              //   project: state.projectSlice.project
              // },
              // save editor config to local storage persist
              editorSlice: {
                rightPanelSize: state.editorSlice.rightPanelSize,
                rightPanelOpen: state.editorSlice.rightPanelOpen,
                activeTab: state.editorSlice.activeTab,
                lastExtractionDropdownTab: state.editorSlice.lastExtractionDropdownTab
              },
              recentProjectsSlice: {
                recentProjects: state.recentProjectsSlice.recentProjects
              },
              modelsSlice: {
                models: state.modelsSlice.models,
                lastUpdated: state.modelsSlice.lastUpdated
              }
            }
          },
          merge: (persistedState, currentState) => {
            // persistedState is unknown, so we need to cast it to CombinedState | undefined
            const typedPersistedState = persistedState as CombinedState | undefined

            // console.log('merge persisted state', persistedState)
            // console.log('current state', currentState)

            // We need to do a deep merge here because the default merge strategy is a
            // shallow merge. Without doing this, our actions would not be included in
            // our merged state, resulting in unexpected behavior.
            // note: deep merging is only required if values are being persisted
            // otherwise simply pass in the current state
            return typedPersistedState ? mergeDeepLeft(typedPersistedState, currentState) : currentState
          }
        }
      )
    )
  )
)
