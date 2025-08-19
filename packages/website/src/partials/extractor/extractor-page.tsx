'use client'

import * as React from 'react'
import {TopBar} from './top-bar'
import {WorkspaceLayout} from './workspace-layout'
import {useProjectStore} from '@/store/use-project-store'
import {nowait} from '@/lib/async-utils'
import {sqlTimestampToDate} from '@/lib/format-dates'

interface ExtractorPageProps {
  projectPublicId: string
  chatId?: string
}

export function ExtractorPage(_props: ExtractorPageProps) {
  const [currentUrl, setCurrentUrl] = React.useState('')

  const currentEditorUrl = useProjectStore((state) => state.extractorSlice.projectCommit?.currentEditorUrl)
  const updateScrapingUrl = useProjectStore((state) => state.extractorSlice.updateScrapingUrl)
  const clearScrapedCache = useProjectStore((state) => state.extractorSlice.clearScrapedCache)
  const fetchPageContent = useProjectStore((state) => state.extractorSlice.fetchPageContent)
  const isLoading = useProjectStore((state) => state.extractorSlice.getScrapingState())

  // Get cache data directly from projectCommit state - single selector
  const cachedData = useProjectStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const cachedAt = useProjectStore((state) => state.extractorSlice.projectCommit?.cachedAt)

  const setCurrentProjectDialog = useProjectStore((state) => state.projectSlice.setCurrentProjectDialog)

  // Derive cache info from the cached data
  const cacheInfo = React.useMemo(() => {
    const isCached = !!(
      cachedData?.url &&
      currentEditorUrl &&
      cachedData.url === currentEditorUrl &&
      cachedAt
    )
    let size: string | null = null
    if (isCached && cachedData.html) {
      const sizeKB = Math.round(cachedData.html.length / 1024)
      size = `${sizeKB} KB`
    }
    return {
      isCached,
      timestamp: isCached && cachedAt ? sqlTimestampToDate(cachedAt) : null,
      size
    }
  }, [cachedData, currentEditorUrl, cachedAt])

  // Sync currentUrl with currentEditorUrl when it changes
  React.useEffect(() => {
    if (currentEditorUrl && currentEditorUrl !== currentUrl) {
      setCurrentUrl(currentEditorUrl)
    }
  }, [currentEditorUrl, currentUrl])

  const handleScrape = async (forceRefresh = false) => {
    const result = await fetchPageContent(forceRefresh)

    if (result.success && result.html) {
      // HTML content is stored in the project commit cache
    } else if (result.error) {
      // Scraping error occurred
    }
  }

  const handleClearCache = async () => {
    // Clear cache via API
    await clearScrapedCache()
  }

  const handleForceRefetch = () => {
    // Force refetch bypassing cache
    nowait(handleScrape(true))
  }

  const handleUrlFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUrl.trim() || isLoading) {
      return false
    }

    // Update the currentEditorUrl in the project state
    nowait(updateScrapingUrl(currentUrl))

    return false
  }

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-[#0A0A0B] text-white'>
      {/* Top Bar */}
      <TopBar
          onNewSite={() => {
            setCurrentProjectDialog('new-project', null)
          }}
          currentUrl={currentUrl}
          onUrlChange={setCurrentUrl}
          saveUrl={handleUrlFormSubmit}
          onScrape={handleScrape}
          isLoading={isLoading}
          onActivate={() => {
            setCurrentProjectDialog('crawler-activation-dialog', null)
          }}
          onSettings={() => {
            setCurrentProjectDialog('scraper-settings', null)
          }}
          onClearCache={() => {
            nowait(handleClearCache())
          }}
          onForceRefetch={handleForceRefetch}
          cacheInfo={cacheInfo}
      />

      {/* Main Content */}
      <WorkspaceLayout />
    </div>
  )
}
