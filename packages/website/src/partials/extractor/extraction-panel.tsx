'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {
  ExtractionTabs,
  ExtractionTabsContent,
  ExtractionTabsList,
  ExtractionTabsTrigger
} from './extraction-tabs'
import {
  Globe,
  Database,
  Filter,
  Code,
  FileText,
  Sparkles,
  BookOpen,
  PanelLeftOpen,
  PanelRightOpen,
  PanelRightClose,
  PanelBottomOpen,
  FileJson2,
  BrushCleaning,
  FileType2,
  FileCode2,
  Braces
} from 'lucide-react'
import {PipelineStatus} from './pipeline-status'
import {useProjectStore} from '@/store/use-project-store'
import {SplitButtonDropdown, type SplitButtonDropdownTab} from '@/components/split-button-dropdown'
import type {ExtractionPanelTabType, ConfigurationTabType} from '@/store/editor-slice'
import {TabPreview} from './tab-preview'
import {TabRawHtml} from './tab-raw-html'
import {TabFormattedHtml} from './tab-formatted-html'
import {TabCleanedHtml} from './tab-cleaned-html'
// import {TabFilteredHtml} from './tab-filtered-html'
import {TabReadabilityHtml} from './tab-readability-html'
import {TabMarkdown} from './tab-markdown'
import {TabPlaintext} from './tab-plaintext'
import {TabData} from './tab-data'
import {TabDataSchema} from './tab-data-schema'
import {TabScript} from './tab-script'
import {TabLog} from './tab-log'
import debug from 'debug'

const log = debug('app:extraction-panel')

// Define which tabs belong in the HTML/content dropdown
const CONTENT_DROPDOWN_TABS: SplitButtonDropdownTab<ExtractionPanelTabType>[] = [
  {value: 'preview', label: 'Preview', icon: Globe},
  // {value: 'filtered-html', label: 'Filtered', icon: Filter},
  {value: 'raw-html', label: 'Raw HTML', icon: Code},
  {value: 'formatted-html', label: 'Formatted HTML', icon: FileCode2},
  {value: 'cleaned-html', label: 'Cleaned HTML', icon: BrushCleaning},
  {value: 'plaintext', label: 'Plaintext', icon: FileText},
  {value: 'readability-html', label: 'Readability HTML', icon: BookOpen},
  {value: 'markdown', label: 'Markdown', icon: FileType2}
]

// Define which tabs belong in the configuration dropdown (schema/script/log)
const CONFIGURATION_DROPDOWN_TABS: SplitButtonDropdownTab<ExtractionPanelTabType>[] = [
  {value: 'data-schema', label: 'Schema', icon: FileJson2},
  {value: 'script', label: 'Script', icon: Braces},
  {value: 'log', label: 'Log', icon: FileText}
]

export function ExtractionPanel() {
  // Get active project ID
  const projectPublicId = useProjectStore((state) => state.projectSlice.project?.project.publicId)

  // Get scraping state from the parent extractor page context
  // Note: This could be improved by moving isLoading to the store if needed

  // Get activeTab from store, with fallback to 'preview'
  const activeTab = useProjectStore((state) => state.editorSlice.activeTab)
  const setActiveTab = useProjectStore((state) => state.editorSlice.setActiveTab)

  // Subscribe to schema changes for version display
  // const schemas = useProjectStore((state) =>
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
  const lastExtractionDropdownTab = useProjectStore((state) => state.editorSlice.lastExtractionDropdownTab)
  const setLastExtractionDropdownTab = useProjectStore(
    (state) => state.editorSlice.setLastExtractionDropdownTab
  )

  // Get last selected configuration dropdown tab from store
  const lastConfigurationDropdownTab = useProjectStore(
    (state) => state.editorSlice.lastConfigurationDropdownTab
  )
  const setLastConfigurationDropdownTab = useProjectStore(
    (state) => state.editorSlice.setLastConfigurationDropdownTab
  )

  // Get panel state from editor slice
  const rightPanelOpen = useProjectStore((state) => state.editorSlice.rightPanelOpen)
  const toggleRightPanelOpen = useProjectStore((state) => state.editorSlice.toggleRightPanelOpen)

  if (!projectPublicId) {
    log('expected project public id not found!')
    return null
  }

  const currentActiveTab = activeTab[projectPublicId] ?? 'cleaned-html'
  const currentLastContentDropdownTab = lastExtractionDropdownTab[projectPublicId] ?? 'cleaned-html'
  const currentLastConfigurationDropdownTab = lastConfigurationDropdownTab[projectPublicId] ?? 'data-schema'

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

          <ExtractionTabsTrigger
            value='data'
            className='gap-1.5 px-3 py-1.5 text-sm hover:bg-white/5 data-[state=active]:bg-white/10'
          >
            <Database className='h-3.5 w-3.5' />
            Data
          </ExtractionTabsTrigger>
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
      <div className='flex-1'>
        <ExtractionTabsContent
          value='preview'
          className='m-0 h-full'
        >
          <TabPreview />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='raw-html'
          className='m-0 h-full'
        >
          <TabRawHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='formatted-html'
          className='m-0 h-full'
        >
          <TabFormattedHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='cleaned-html'
          className='m-0 h-full'
        >
          <TabCleanedHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='plaintext'
          className='m-0 h-full'
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
          className='m-0 h-full'
        >
          <TabReadabilityHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='markdown'
          className='m-0 h-full'
        >
          <TabMarkdown />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='data'
          className='m-0 h-full'
        >
          <TabData />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='data-schema'
          className='m-0 h-full'
        >
          <TabDataSchema />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='script'
          className='m-0 h-full'
        >
          <TabScript />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='log'
          className='m-0 h-full'
        >
          <TabLog />
        </ExtractionTabsContent>
      </div>
    </ExtractionTabs>
  )
}
