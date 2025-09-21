'use client'

import * as React from 'react'
// import {TabFilteredHtml} from './tab-filtered-html'
import debug from 'debug'
import {
  AlertCircle,
  BookOpen,
  BrushCleaning,
  CheckCircle,
  Code,
  Copy,
  Database,
  FileCode2,
  FileJson,
  FileJson2,
  FileText,
  FileType2,
  Filter,
  Globe,
  PanelBottomOpen,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  SquareFunction
} from 'lucide-react'

import { SplitButtonDropdown, type SplitButtonDropdownTab } from '@/components/split-button-dropdown'
import { Button } from '@/components/ui/button'
import type { ConfigurationTabType, DataTabType, ExtractionPanelTabType } from '@/store/editor-slice'
import { useStore } from '@/store/use-store'

import {
  ExtractionTabs,
  ExtractionTabsContent,
  ExtractionTabsList,
  ExtractionTabsTrigger
} from './extraction-tabs'
import { PipelineStatus } from './pipeline-status'
import { TabCleanedHtml } from './tab-cleaned-html'
import { TabData } from './tab-data'
import { TabDataJson } from './tab-data-json'
import { TabDataSchema } from './tab-data-schema'
import { TabExtractionScript } from './tab-extraction-script'
import { TabFormattedHtml } from './tab-formatted-html'
import { TabLog } from './tab-log'
import { TabMarkdown } from './tab-markdown'
import { TabPlaintext } from './tab-plaintext'
import { TabPreview } from './tab-preview'
import { TabRawHtml } from './tab-raw-html'
import { TabReadabilityHtml } from './tab-readability-html'
import { TabSchemaJson } from './tab-schema-json'

const log = debug('app:extraction-panel')

// Define which tabs belong in the HTML/content dropdown
const CONTENT_DROPDOWN_TABS: SplitButtonDropdownTab<ExtractionPanelTabType>[] = [
  { value: 'preview', label: 'Preview', icon: Globe },
  // {value: 'filtered-html', label: 'Filtered', icon: Filter},
  { value: 'raw-html', label: 'Raw HTML', icon: Code },
  { value: 'formatted-html', label: 'Formatted HTML', icon: FileCode2 },
  { value: 'cleaned-html', label: 'Cleaned HTML', icon: BrushCleaning },
  { value: 'plaintext', label: 'Plaintext', icon: FileText }
  // {value: 'readability-html', label: 'Readability HTML', icon: BookOpen},
  // {value: 'markdown', label: 'Markdown', icon: FileType2}
]

// Define which tabs belong in the configuration dropdown (schema/extraction-script/log)
const CONFIGURATION_DROPDOWN_TABS: SplitButtonDropdownTab<ExtractionPanelTabType>[] = [
  { value: 'data-schema', label: 'Data Schema', icon: FileJson2 },
  { value: 'schema-json', label: 'Schema JSON', icon: FileJson },
  { value: 'extraction-script', label: 'Extraction Script', icon: SquareFunction },
  { value: 'log', label: 'Log', icon: FileText }
]

// Define which tabs belong in the data dropdown (data table/json)
const DATA_DROPDOWN_TABS: SplitButtonDropdownTab<ExtractionPanelTabType>[] = [
  { value: 'data-table', label: 'Data Table', icon: Database },
  { value: 'data-json', label: 'Data JSON', icon: FileJson }
]

export function ExtractionPanel() {
  // Get active project ID
  const projectPublicId = useStore((state) => state.projectSlice.project?.project.publicId)

  // Get scraping state from the parent extractor page context
  // Note: This could be improved by moving isLoading to the store if needed

  // Get activeTab from store, with fallback to 'preview'
  const activeTab = useStore((state) => state.editorSlice.activeTab)
  const setActiveTab = useStore((state) => state.editorSlice.setActiveTab)

  // Subscribe to schema changes for version display
  // const schemas = useStore((state) =>
  //   projectPublicId ? state.extractorSlice.projectSchemas[projectPublicId]?.schemas : null
  // )

  // // Get active schema from the reactive schemas array
  // const activeSchema = React.useMemo(() => {
  //   if (!schemas) {
  //     return null
  //   }
  //   return schemas.find((s) => s.isActive) ?? null
  // }, [schemas])

  // Get last selected dropdown tab from store
  const lastExtractionDropdownTab = useStore((state) => state.editorSlice.lastExtractionDropdownTab)
  const setLastExtractionDropdownTab = useStore((state) => state.editorSlice.setLastExtractionDropdownTab)

  // Get last selected configuration dropdown tab from store
  const lastConfigurationDropdownTab = useStore((state) => state.editorSlice.lastConfigurationDropdownTab)
  const setLastConfigurationDropdownTab = useStore(
    (state) => state.editorSlice.setLastConfigurationDropdownTab
  )

  // Get last selected data dropdown tab from store
  const lastDataDropdownTab = useStore((state) => state.editorSlice.lastDataDropdownTab)
  const setLastDataDropdownTab = useStore((state) => state.editorSlice.setLastDataDropdownTab)

  // Get panel state from editor slice
  const rightPanelOpen = useStore((state) => state.editorSlice.rightPanelOpen)
  const toggleRightPanelOpen = useStore((state) => state.editorSlice.toggleRightPanelOpen)

  if (!projectPublicId) {
    log('expected project public id not found!')
    return null
  }

  const currentActiveTab = activeTab[projectPublicId] ?? 'cleaned-html'
  const currentLastContentDropdownTab = lastExtractionDropdownTab[projectPublicId] ?? 'cleaned-html'
  const currentLastConfigurationDropdownTab = lastConfigurationDropdownTab[projectPublicId] ?? 'data-schema'
  const currentLastDataDropdownTab = lastDataDropdownTab[projectPublicId] ?? 'data-table'

  // Handler for all tab changes - maintains last dropdown tab when appropriate
  const handleTabChange = (value: ExtractionPanelTabType) => {
    setActiveTab(value)
    // Check if this is one of the content dropdown tabs and update the last selected
    if (CONTENT_DROPDOWN_TABS.some((tab) => tab.value === value)) {
      setLastExtractionDropdownTab(value)
    }
    // Check if this is one of the configuration dropdown tabs and update the last selected
    if (CONFIGURATION_DROPDOWN_TABS.some((tab) => tab.value === value)) {
      setLastConfigurationDropdownTab(value as ConfigurationTabType)
    }
    // Check if this is one of the data dropdown tabs and update the last selected
    if (DATA_DROPDOWN_TABS.some((tab) => tab.value === value)) {
      setLastDataDropdownTab(value as DataTabType)
    }
  }

  return (
    <ExtractionTabs
      value={currentActiveTab}
      onValueChange={handleTabChange}
      className='flex h-full flex-col bg-[#0A0A0B]'
    >
      {/* Combined Toolbar with Tabs */}
      <div
        className='flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#151517]
          px-1'
      >
        {/* Left side - Tabs */}
        <ExtractionTabsList className='h-9 gap-x-1 bg-transparent p-0'>
          {/* Dropdown for HTML/Markdown related tabs (including Preview) */}
          <SplitButtonDropdown
            tabs={CONTENT_DROPDOWN_TABS}
            activeTab={currentActiveTab}
            lastDropdownTab={currentLastContentDropdownTab}
            onTabChange={handleTabChange}
          />

          {/* Dropdown for Configuration tabs (Schema/Script/Log) */}
          <SplitButtonDropdown
            tabs={CONFIGURATION_DROPDOWN_TABS}
            activeTab={currentActiveTab}
            lastDropdownTab={currentLastConfigurationDropdownTab}
            onTabChange={handleTabChange}
          />

          {/* Dropdown for Data tabs (Data Table/JSON) */}
          <SplitButtonDropdown
            tabs={DATA_DROPDOWN_TABS}
            activeTab={currentActiveTab}
            lastDropdownTab={currentLastDataDropdownTab}
            onTabChange={handleTabChange}
          />
        </ExtractionTabsList>
        {/* Right side - Status and Panel toggles */}
        <div className='flex items-center gap-2'>
          <PipelineStatus />

          {/* Panel toggles */}
          <div className='flex items-center gap-1'>
            {/* Schema panel toggle - commented out for now */}
            {/* <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                // TODO: implement schema panel toggle
              }}
              className='h-8 px-2 text-white/60 hover:bg-white/10 hover:text-white'
            >
              <PanelLeftOpen className='h-4 w-4' />
            </Button> */}
            {/* Data panel toggle - commented out for now */}
            {/* <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                // TODO: implement data panel toggle
              }}
              className='h-8 px-2 text-white/60 hover:bg-white/10 hover:text-white'
            >
              <PanelBottomOpen className='h-4 w-4' />
            </Button> */}
            {/* AI Panel toggle - using editor slice */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                toggleRightPanelOpen()
              }}
              className='h-8 px-2 text-white/60 hover:bg-white/10 hover:text-white'
            >
              {rightPanelOpen ? (
                <PanelRightClose className='h-4 w-4' />
              ) : (
                <PanelRightOpen className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className='flex min-h-0 flex-1'>
        <ExtractionTabsContent
          value='preview'
          className='flex min-h-0 flex-col'
        >
          <TabPreview />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='raw-html'
          className='flex min-h-0 flex-col'
        >
          <TabRawHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='formatted-html'
          className='flex min-h-0 flex-col'
        >
          <TabFormattedHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='cleaned-html'
          className='flex min-h-0 flex-col'
        >
          <TabCleanedHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='plaintext'
          className='flex min-h-0 flex-col'
        >
          <TabPlaintext />
        </ExtractionTabsContent>

        {/* <ExtractionTabsContent
          value='filtered-html'
          className='m-0 h-full'
        >
          <TabFilteredHtml />
        </ExtractionTabsContent> */}

        <ExtractionTabsContent
          value='readability-html'
          className='flex min-h-0 flex-col'
        >
          <TabReadabilityHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='markdown'
          className='flex min-h-0 flex-col'
        >
          <TabMarkdown />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='data-table'
          className='flex min-h-0 min-w-0 flex-col'
        >
          <TabData />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='data-json'
          className='flex min-h-0 flex-col'
        >
          <TabDataJson />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='data-schema'
          className='flex min-h-0 flex-col'
        >
          <TabDataSchema />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='schema-json'
          className='flex min-h-0 flex-col'
        >
          <TabSchemaJson />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='extraction-script'
          className='flex min-h-0 flex-col'
        >
          <TabExtractionScript />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='log'
          className='flex min-h-0 flex-col'
        >
          <TabLog />
        </ExtractionTabsContent>
      </div>
    </ExtractionTabs>
  )
}
