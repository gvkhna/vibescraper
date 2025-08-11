'use client'

import * as React from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {TopBar} from './top-bar'
import {WorkspaceLayout} from './workspace-layout'
import {NewSiteModal} from './new-site-modal'
// import {ActivationModal} from '../dialogs/crawler-activation-dialog'
import {ProjectHeader} from './project-header'
import {CrawlerConfig} from './crawler-config'
import {DataSchemaEditor} from './data-schema-editor'
import {DataExplorer} from './data-explorer'
import {Monitoring} from './monitoring'
import {APIAccess} from './api-access'
import {useProjectStore} from '@/store/use-project-store'
import {nowait} from '@/lib/async-utils'

interface ExtractorPageProps {
  projectPublicId: string
  chatId?: string
}

export function ExtractorPage({projectPublicId, chatId}: ExtractorPageProps) {
  const [showNewSiteModal, setShowNewSiteModal] = React.useState(false)
  // const [showActivationModal, setShowActivationModal] = React.useState(false)
  const [currentUrl, setCurrentUrl] = React.useState('')
  const [siteName, setSiteName] = React.useState('Example Store')
  const [isLoading, setIsLoading] = React.useState(false)
  const [dataSource, setDataSource] = React.useState<'fetch' | 'cached'>('cached')

  const currentEditorUrl = useProjectStore((state) => state.projectSlice.projectCommit?.currentEditorUrl)
  const updateCurrentEditorUrl = useProjectStore((state) => state.projectSlice.updateCurrentEditorUrl)

  const setCurrentProjectDialog = useProjectStore((state) => state.projectSlice.setCurrentProjectDialog)

  // Sync currentUrl with currentEditorUrl when it changes
  React.useEffect(() => {
    if (currentEditorUrl && currentEditorUrl !== currentUrl) {
      setCurrentUrl(currentEditorUrl)
    }
  }, [currentEditorUrl, currentUrl])

  // TODO: Use projectPublicId to load project data
  // TODO: Use chatId to load specific chat if provided
  React.useEffect(() => {
    // Load project data using projectPublicId
    // If chatId is provided, load that specific chat
  }, [projectPublicId, chatId])

  const handleScrape = async () => {
    setIsLoading(true)
    // Simulate scraping - total pipeline duration is about 6.3 seconds
    // This matches the sum of all pipeline step durations
    await new Promise((resolve) => setTimeout(resolve, 6300))
    setIsLoading(false)
  }

  const handleActivate = (config: any) => {
    // Handle activation with the provided configuration
    // This would typically send the config to your backend
  }

  const handleUrlFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUrl.trim() || isLoading) {
      return false
    }
    
    // Update the currentEditorUrl in the project state
    nowait(updateCurrentEditorUrl(currentUrl))
    
    return false
  }

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-[#0A0A0B] text-white'>
      {/* Top Bar */}
      <TopBar
        siteName={siteName}
        onNewSite={() => {
          setShowNewSiteModal(true)
        }}
        currentUrl={currentUrl}
        onUrlChange={setCurrentUrl}
        saveUrl={handleUrlFormSubmit}
        onScrape={handleScrape}
        isLoading={isLoading}
        dataSource={dataSource}
        onDataSourceChange={setDataSource}
        onActivate={() => {
          setCurrentProjectDialog('crawler-activation-dialog', null)
          // setShowActivationModal(true)
        }}
      />

      {/* Main Content */}
      <WorkspaceLayout isProcessing={isLoading} />

      {/* Modals */}
      {/* <NewSiteModal
        isOpen={showNewSiteModal}
        onClose={() => {
          setShowNewSiteModal(false)
        }}
        onSiteCreated={(url, name) => {
          setCurrentUrl(url)
          setSiteName(name)
          setShowNewSiteModal(false)
        }}
      /> */}
      {/*
      <ActivationModal
        open={showActivationModal}
        onOpenChange={setShowActivationModal}
        onActivate={handleActivate}
        projectName={siteName}
      /> */}

      {/* <Toaster /> */}
    </div>
  )
}
