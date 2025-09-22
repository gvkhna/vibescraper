'use client'

import * as React from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { APIAccessTab } from './api-access-tab'
import { DashboardShell } from './dashboard-shell'
import { MonitoringTab } from './monitoring-tab'
import { OverviewTab } from './overview-tab'
import { ProjectHeader } from './project-header'

export function DashboardPage() {
  const [projectName, setProjectName] = React.useState('Acme Product Crawler')

  return (
    <DashboardShell>
      <div className='space-y-4'>
        <ProjectHeader
          name={projectName}
          onNameChange={setProjectName}
          onRun={() => {
            // Run triggered
          }}
        />

        <div className='rounded-lg border border-white/10 bg-[#0f0f10] p-4'>
          <Tabs
            defaultValue='overview'
            className='w-full'
          >
            <TabsList className='grid h-auto w-full grid-cols-3 bg-transparent p-0'>
              <TabsTrigger
                value='overview'
                className='rounded-md py-2 data-[state=active]:bg-white/10 data-[state=active]:text-white'
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value='monitoring'
                className='rounded-md py-2 data-[state=active]:bg-white/10 data-[state=active]:text-white'
              >
                Monitoring
              </TabsTrigger>
              <TabsTrigger
                value='api-access'
                className='rounded-md py-2 data-[state=active]:bg-white/10 data-[state=active]:text-white'
              >
                API Access
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value='overview'
              className='mt-4'
            >
              <OverviewTab />
            </TabsContent>

            <TabsContent
              value='monitoring'
              className='mt-4'
            >
              <MonitoringTab />
            </TabsContent>

            <TabsContent
              value='api-access'
              className='mt-4'
            >
              <APIAccessTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}

{
  /* 
  Commented out components for potential future use:
  
  - CrawlerConfig: Full crawler configuration with URLs, browser settings, proxy, etc.
  - DataSchemaEditor: Schema definition and live preview
  - AIAssistant: AI chat interface for extraction help
  - DataExplorer: SQL/visual data exploration with export
  
  These components are preserved below but not imported/used.
*/
}

{
  /* 
// Preserved component definitions (commented out)

function CrawlerConfig() {
  // ... original CrawlerConfig implementation ...
}

function DataSchemaEditor() {
  // ... original DataSchemaEditor implementation ...
}

function AIAssistant() {
  // ... original AIAssistant implementation ...
}

function DataExplorer() {
  // ... original DataExplorer implementation ...
}

function RadioCard({label, desc, defaultChecked}: {label: string; desc: string; defaultChecked?: boolean}) {
  // ... original RadioCard implementation ...
}

// AI Assistant helper components
function SystemMessage({text}: {text: string}) {
  return <div className='text-center text-sm text-white/60'>{text}</div>
}

function UserMessage({text}: {text: string}) {
  return (
    <div className='ml-auto max-w-[80%] rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/20 p-3'>
      {text}
    </div>
  )
}

function AIMessage({text}: {text: string}) {
  return <div className='max-w-[80%] rounded-lg border border-white/10 bg-white/5 p-3'>{text}</div>
}

function AIActionButtons() {
  return (
    <div className='flex flex-wrap gap-2'>
      {['Apply This Code', 'Test on Sample', 'Update Schema', 'Fix Issues', 'Schedule Quality Check'].map(
        (a) => (
          <Button
            key={a}
            className='h-8 border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
            variant='secondary'
          >
            {a}
          </Button>
        )
      )}
    </div>
  )
}
*/
}
