import debug from 'debug'

import type { ProjectPublicId } from '@/db/schema'
import type { BrandedType } from '@/db/schema/common'
import { shortid } from '@/lib/short-id'

import type { LoadingState } from './async-entity-state'
import type { StateSlice } from './use-store'

export type TabId = BrandedType<string, 'TabId'>

const log = debug('editor-slice')

export type ExtractionPanelTabType =
  | 'preview'
  | 'raw-html'
  | 'formatted-html'
  | 'cleaned-html'
  | 'plaintext'
  | 'filtered-html'
  | 'readability-html'
  | 'markdown'
  | 'data-table'
  | 'data-json'
  | 'data-schema'
  | 'schema-json'
  | 'extraction-script'
  | 'crawler-script'
  | 'log'

// New type for the configuration dropdown (schema/script/log)
export type ConfigurationTabType =
  | 'data-schema'
  | 'schema-json'
  | 'extraction-script'
  | 'crawler-script'
  | 'log'

// New type for the data dropdown (data table/json)
export type DataTabType = 'data-table' | 'data-json'

export type AssistantPanelView = 'conversation' | 'chat-history'

// export type EditorTab = {
//   tabId: TabId
//   projectFile?: ProjectFileRef
//   editorType: 'editor' | 'settings' | 'project-settings'
//   rightPanelTab?: 'agent-execution' | 'agent-errors' | 'commits' | 'file'
//   // allowsSaving: boolean
//   // isUnsaved: boolean
//   loadState: LoadingState
//   // asyncEntityState: AsyncEntityState
//   // isLoading: boolean
//   // isLoaded: boolean
// }

export interface EditorSlice {
  // leftPanelWidth: string

  activeTab: Record<ProjectPublicId, ExtractionPanelTabType | undefined | null>
  setActiveTab: (id: ExtractionPanelTabType) => void

  // Store the last selected dropdown tab for quick access
  lastExtractionDropdownTab: Record<ProjectPublicId, ExtractionPanelTabType | undefined | null>
  setLastExtractionDropdownTab: (tab: ExtractionPanelTabType) => void

  // Store the last selected configuration dropdown tab (schema/extraction-script/log)
  lastConfigurationDropdownTab: Record<ProjectPublicId, ConfigurationTabType | undefined | null>
  setLastConfigurationDropdownTab: (tab: ConfigurationTabType) => void

  // Store the last selected data dropdown tab (data table/json)
  lastDataDropdownTab: Record<ProjectPublicId, DataTabType | undefined | null>
  setLastDataDropdownTab: (tab: DataTabType) => void

  // setLeftPanelTab: (id: EditorSlice['leftPanelTab']) => void
  // setLeftPanelWidth: (width: string) => void

  assistantPanelView: Record<ProjectPublicId, AssistantPanelView | undefined | null>
  setAssistantPanelView: (view: AssistantPanelView) => void
  rightPanelSize: number
  setRightPanelSize: (size: number) => void
  rightPanelOpen: boolean
  toggleRightPanelOpen: () => void
  setRightPanelOpen: (open: boolean) => void

  // setRightPanelTab: (id: ProjectFilePublicId, rightPanelTab: EditorTab['rightPanelTab']) => void

  // bottomPanelSize: number
  // setBottomPanelSize: (size: number) => void
  // bottomPanelOpen: boolean
  // setBottomPanelOpen: (open: boolean) => void
  // toggleBottomPanelOpen: () => void

  // startTabLoading: (filePublicId: ProjectFilePublicId) => void
  // completeTabLoading: (filePublicId: ProjectFilePublicId) => void
  // failTabLoading: (tabId: TabId) => void
}

export const createEditorSlice: StateSlice<EditorSlice> = (set, get) =>
  ({
    activeTab: {},
    lastExtractionDropdownTab: {},
    lastConfigurationDropdownTab: {},
    lastDataDropdownTab: {},
    rightPanelOpen: true,
    assistantPanelView: {},
    // bottomPanelOpen: false,
    leftPanelTab: 'preview',
    leftPanelWidth: '36rem',
    rightPanelSize: 21,
    setRightPanelSize: (size) => {
      set(
        (draft) => {
          draft.editorSlice.rightPanelSize = size
        },
        true,
        'editor/setRightPanelSize'
      )
    },
    toggleRightPanelOpen: () => {
      set(
        (draft) => {
          draft.editorSlice.rightPanelOpen = !draft.editorSlice.rightPanelOpen
        },
        true,
        'editor/toggleRightPanelOpen'
      )
    },
    setRightPanelOpen: (open) => {
      set(
        (draft) => {
          draft.editorSlice.rightPanelOpen = open
        },
        true,
        'editor/setRightPanelOpen'
      )
    },
    // startTabLoading: (publicId) => {
    //   const activeProjectId = get().projectSlice.project?.project.publicId

    //   if (!activeProjectId) {
    //     return
    //   }
    //   set(
    //     (draft) => {
    //       const activeProjectTabs = draft.editorSlice.openTabs[activeProjectId]
    //       if (!activeProjectTabs) {
    //         log('expected active project tabs but not found')
    //         return
    //       }
    //       const tab = activeProjectTabs.find((t) => t.projectFile?.publicId === publicId)
    //       log('found tab', tab)
    //       if (tab) {
    //         tab.loadState = 'loading'
    //         // tab.isLoading = true
    //         // tab.isLoaded = false
    //       }
    //     },
    //     true,
    //     'editor/startTabLoading'
    //   )
    // },
    // completeTabLoading: (publicId) => {
    //   const activeProjectId = get().projectSlice.project?.project.publicId

    //   if (!activeProjectId) {
    //     return
    //   }
    //   set(
    //     (draft) => {
    //       const activeProjectTabs = draft.editorSlice.openTabs[activeProjectId]
    //       if (!activeProjectTabs) {
    //         log('expected active project tabs but not found')
    //         return
    //       }
    //       const tab = activeProjectTabs.find((t) => t.projectFile?.publicId === publicId)
    //       if (tab) {
    //         tab.loadState = 'loaded'
    //         // tab.isLoading = false
    //         // tab.isLoaded = true
    //       }
    //     },
    //     true,
    //     'editor/completeTabLoading'
    //   )
    // },
    // failTabLoading: (tabId) => {
    //   const activeProjectId = get().projectSlice.project?.project.publicId

    //   if (!activeProjectId) {
    //     return
    //   }
    //   set(
    //     (draft) => {
    //       const activeProjectTabs = draft.editorSlice.openTabs[activeProjectId]
    //       if (!activeProjectTabs) {
    //         log('expected active project tabs but not found')
    //         return
    //       }
    //       const tab = activeProjectTabs.find((t) => t.tabId === tabId)
    //       if (tab) {
    //         tab.loadState = 'failed'
    //         // tab.isLoading = false
    //         // tab.isLoaded = false
    //       }
    //     },
    //     true,
    //     'editor/failTabLoading'
    //   )
    // },
    setAssistantPanelView(view) {
      const activeProjectId = get().projectSlice.project?.project.publicId

      if (!activeProjectId) {
        return
      }
      set(
        (draft) => {
          draft.editorSlice.assistantPanelView[activeProjectId] = view
        },
        true,
        'editor/setAssistantPanelView'
      )
    },
    setActiveTab: (id) => {
      const activeProjectId = get().projectSlice.project?.project.publicId

      if (!activeProjectId) {
        return
      }
      set(
        (draft) => {
          draft.editorSlice.activeTab[activeProjectId] = id
        },
        true,
        'editor/setActiveTab'
      )
    },
    setLastExtractionDropdownTab: (tab) => {
      const activeProjectId = get().projectSlice.project?.project.publicId

      if (!activeProjectId) {
        return
      }
      set(
        (draft) => {
          draft.editorSlice.lastExtractionDropdownTab[activeProjectId] = tab
        },
        true,
        'editor/setLastExtractionDropdownTab'
      )
    },
    setLastConfigurationDropdownTab: (tab) => {
      const activeProjectId = get().projectSlice.project?.project.publicId

      if (!activeProjectId) {
        return
      }
      set(
        (draft) => {
          draft.editorSlice.lastConfigurationDropdownTab[activeProjectId] = tab
        },
        true,
        'editor/setLastConfigurationDropdownTab'
      )
    },
    setLastDataDropdownTab: (tab) => {
      const activeProjectId = get().projectSlice.project?.project.publicId

      if (!activeProjectId) {
        return
      }
      set(
        (draft) => {
          draft.editorSlice.lastDataDropdownTab[activeProjectId] = tab
        },
        true,
        'editor/setLastDataDropdownTab'
      )
    }
  }) as EditorSlice
