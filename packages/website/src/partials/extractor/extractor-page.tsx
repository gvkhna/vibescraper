'use client'

import * as React from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {TopBar, type TopBarProps} from './top-bar'
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

  // Cache info state - this would typically come from your backend/store
  const [cacheInfo, setCacheInfo] = React.useState<TopBarProps['cacheInfo']>({
    isCached: true,
    // 30 minutes ago
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    size: '245 KB'
  })

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

    // Update cache info after successful scrape
    setCacheInfo({
      isCached: true,
      timestamp: new Date(),
      size: '245 KB'
    })
  }

  const handleClearCache = () => {
    // Clear cache for the current URL
    setCacheInfo({
      isCached: false,
      timestamp: null,
      size: null
    })
    // TODO: Call backend API to clear cache
  }

  const handleForceRefetch = () => {
    // Force refetch bypassing cache
    setDataSource('fetch')
    nowait(handleScrape())
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
        onClearCache={handleClearCache}
        onForceRefetch={handleForceRefetch}
        cacheInfo={cacheInfo}
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
