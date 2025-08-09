'use client'

import * as React from 'react'
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable'
import {MainContentArea} from '@/components/main-content-area'
import {SchemaPanel} from '@/components/schema-panel'
import {AIAssistantPanel} from '@/components/ai-assistant-panel'
import {DataPanel} from '@/components/data-panel'
import {Button} from '@/components/ui/button'
import {PanelLeftClose, PanelRightClose, PanelBottomClose} from 'lucide-react'

interface WorkspaceLayoutProps {
  currentUrl: string
  onUrlChange: (url: string) => void
}

export function WorkspaceLayout({currentUrl, onUrlChange}: WorkspaceLayoutProps) {
  const [showSchemaPanel, setShowSchemaPanel] = React.useState(true)
  const [showAIPanel, setShowAIPanel] = React.useState(true)
  const [showDataPanel, setShowDataPanel] = React.useState(true)

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
          // defaultSize={showSchemaPanel && showAIPanel ? 50 : 60}
          minSize={30}
        >
          {/* <ResizablePanelGroup direction="vertical"> */}
          {/* Main content area */}
          {/* <ResizablePanel
            defaultSize={showDataPanel ? 70 : 100}
            minSize={40}
          > */}
          <MainContentArea
            currentUrl={currentUrl}
            onUrlChange={onUrlChange}
            onToggleSchemaPanel={() => {
              setShowSchemaPanel(!showSchemaPanel)
            }}
            onToggleAIPanel={() => {
              setShowAIPanel(!showAIPanel)
            }}
            onToggleDataPanel={() => {
              setShowDataPanel(!showDataPanel)
            }}
            showSchemaPanel={showSchemaPanel}
            showAIPanel={showAIPanel}
            showDataPanel={showDataPanel}
          />
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
        {showAIPanel && (
          <>
            <ResizableHandle />
            <ResizablePanel
              defaultSize={25}
              minSize={20}
              maxSize={40}
            >
              <AIAssistantPanel
                currentUrl={currentUrl}
                onClose={() => {
                  setShowAIPanel(false)
                }}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
