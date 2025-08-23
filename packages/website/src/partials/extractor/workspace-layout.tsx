'use client'

import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable'
import {ExtractionPanel} from './extraction-panel'
// import {SchemaPanel} from './schema-panel'
// import {DataPanel} from './data-panel'
// import {Button} from '@/components/ui/button'
// import {PanelLeftClose, PanelRightClose, PanelBottomClose} from 'lucide-react'
import {AssistantPanel} from '../assistant-ui/assistant-panel'
import {useStore} from '@/store/use-store'

interface WorkspaceLayoutProps {
  // Removed isProcessing - now handled by pipeline status component internally
}

export function WorkspaceLayout() {
  // const [showSchemaPanel, setShowSchemaPanel] = React.useState(true)
  // const [showDataPanel, setShowDataPanel] = React.useState(true)

  // Use editor slice for AI panel state
  const rightPanelOpen = useStore((state) => state.editorSlice.rightPanelOpen)
  const rightPanelSize = useStore((state) => state.editorSlice.rightPanelSize)
  const setRightPanelSize = useStore((state) => state.editorSlice.setRightPanelSize)

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      {/* Main workspace with resizable panels */}
      <ResizablePanelGroup
        direction='horizontal'
        className='flex-1'
      >
        {/* Left Panel - Schema/Extraction Tools */}
        {/* {showSchemaPanel && (
          <>
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <SchemaPanel
                currentUrl={currentUrl}
                onClose={() => setShowSchemaPanel(false)}
              />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )} */}

        {/* Center Panel - Main Content */}
        <ResizablePanel
          id='main-content'
          order={1}
          // defaultSize={showSchemaPanel && showAIPanel ? 50 : 60}
          minSize={30}
        >
          {/* <ResizablePanelGroup direction="vertical"> */}
          {/* Main content area */}
          {/* <ResizablePanel
            defaultSize={showDataPanel ? 70 : 100}
            minSize={40}
          > */}
          <ExtractionPanel />
          {/* </ResizablePanel> */}

          {/* Bottom Panel - Extracted Data */}
          {/* {showDataPanel && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <DataPanel onClose={() => setShowDataPanel(false)} />
                </ResizablePanel>
              </>
            )} */}
          {/* </ResizablePanelGroup> */}
        </ResizablePanel>

        {/* Right Panel - AI Assistant */}
        {rightPanelOpen && (
          <>
            <ResizableHandle />
            <ResizablePanel
              id='ai-assistant'
              order={2}
              defaultSize={rightPanelSize}
              minSize={20}
              maxSize={40}
              onResize={(size) => {
                setRightPanelSize(size)
              }}
            >
              <AssistantPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
