'use client'

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
  FileType2
} from 'lucide-react'
import {PipelineStatus} from './pipeline-status'
import {useProjectStore} from '@/store/use-project-store'
import {ExtractionTabsDropdown, type DropdownTab} from './extraction-tabs-dropdown'
import type {ExtractionPanelTabType} from '@/store/editor-slice'
import {TabPreview} from './tab-preview'
import {TabRawHtml} from './tab-raw-html'
import {TabCleanedHtml} from './tab-cleaned-html'
import {TabFilteredHtml} from './tab-filtered-html'
import {TabReadabilityHtml} from './tab-readability-html'
import {TabMarkdown} from './tab-markdown'
import {TabData} from './tab-data'
import {TabDataSchema} from './tab-data-schema'
import debug from 'debug'

const log = debug('app:extraction-panel')

// Define which tabs belong in the dropdown (moved Filtered out)
const DROPDOWN_TABS: DropdownTab[] = [
  {value: 'raw-html', label: 'Raw HTML', icon: Code},
  {value: 'cleaned-html', label: 'Cleaned', icon: BrushCleaning},
  {value: 'readability-html', label: 'Readability', icon: BookOpen},
  {value: 'markdown', label: 'Markdown', icon: FileType2}
]

interface ExtractionPanelProps {
  isProcessing?: boolean
}

export function ExtractionPanel({isProcessing = false}: ExtractionPanelProps) {
  // Get active project ID
  const projectPublicId = useProjectStore((state) => state.projectSlice.project?.project.publicId)

  // Get activeTab from store, with fallback to 'preview'
  const activeTab = useProjectStore((state) => state.editorSlice.activeTab)
  const setActiveTab = useProjectStore((state) => state.editorSlice.setActiveTab)

  // Get last selected dropdown tab from store
  const lastExtractionDropdownTab = useProjectStore((state) => state.editorSlice.lastExtractionDropdownTab)
  const setLastExtractionDropdownTab = useProjectStore(
    (state) => state.editorSlice.setLastExtractionDropdownTab
  )

  // Get panel state from editor slice
  const rightPanelOpen = useProjectStore((state) => state.editorSlice.rightPanelOpen)
  const toggleRightPanelOpen = useProjectStore((state) => state.editorSlice.toggleRightPanelOpen)

  if (!projectPublicId) {
    log('expected project public id not found!')
    return null
  }

  const currentActiveTab = activeTab[projectPublicId] ?? 'preview'
  const currentLastDropdownTab = lastExtractionDropdownTab[projectPublicId] ?? 'raw-html'

  // Handler for dropdown tab changes that also updates the last selected dropdown tab
  const handleDropdownTabChange = (value: ExtractionPanelTabType) => {
    setActiveTab(value)
    // Check if this is one of the dropdown tabs and update the last selected
    if (DROPDOWN_TABS.some((tab) => tab.value === value)) {
      setLastExtractionDropdownTab(value)
    }
  }

  return (
    <ExtractionTabs
      value={currentActiveTab}
      onValueChange={(value) => {
        setActiveTab(value)
      }}
      className='flex h-full flex-col bg-[#0A0A0B]'
    >
      {/* Combined Toolbar with Tabs */}
      <div
        className='flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#151517]
          px-1'
      >
        {/* Left side - Tabs */}
        <ExtractionTabsList className='h-9 gap-x-1 bg-transparent p-0'>
          <ExtractionTabsTrigger
            value='preview'
            className='gap-1.5 px-3 py-1.5 text-sm hover:bg-white/5 data-[state=active]:bg-white/10'
          >
            <Globe className='h-3.5 w-3.5' />
            Preview
          </ExtractionTabsTrigger>

          <ExtractionTabsTrigger
            value='filtered-html'
            className='gap-1.5 px-3 py-1.5 text-sm hover:bg-white/5 data-[state=active]:bg-white/10'
          >
            <Filter className='h-3.5 w-3.5' />
            Filtered
          </ExtractionTabsTrigger>

          {/* Dropdown for HTML/Markdown related tabs */}
          <ExtractionTabsDropdown
            tabs={DROPDOWN_TABS}
            activeTab={currentActiveTab}
            lastDropdownTab={currentLastDropdownTab}
            onTabChange={handleDropdownTabChange}
          />

          <ExtractionTabsTrigger
            value='data'
            className='gap-1.5 px-3 py-1.5 text-sm hover:bg-white/5 data-[state=active]:bg-white/10'
          >
            <Database className='h-3.5 w-3.5' />
            Data
          </ExtractionTabsTrigger>
          
          <ExtractionTabsTrigger
            value='data-schema'
            className='gap-1.5 px-3 py-1.5 text-sm hover:bg-white/5 data-[state=active]:bg-white/10'
          >
            <FileJson2 className='h-3.5 w-3.5' />
            Schema
          </ExtractionTabsTrigger>
        </ExtractionTabsList>

        {/* Right side - Status and Panel toggles */}
        <div className='flex items-center gap-2'>
          <PipelineStatus isActive={isProcessing} />

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
      <div className='flex-1 overflow-hidden'>
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
          value='cleaned-html'
          className='m-0 h-full'
        >
          <TabCleanedHtml />
        </ExtractionTabsContent>

        <ExtractionTabsContent
          value='filtered-html'
          className='m-0 h-full'
        >
          <TabFilteredHtml />
        </ExtractionTabsContent>

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
      </div>
    </ExtractionTabs>
  )
}
