'use client'

import * as React from 'react'
import {TopBar} from './top-bar'
import {WorkspaceLayout} from './workspace-layout'
import {useStore} from '@/store/use-store'
import {nowait} from '@/lib/async-utils'
import {sqlTimestampToDate} from '@/lib/format-dates'

interface ExtractorPageProps {
  projectPublicId: string
  chatId?: string
}

export function ExtractorPage(_props: ExtractorPageProps) {
  const [currentUrl, setCurrentUrl] = React.useState('')
  const [isUserEditing, setIsUserEditing] = React.useState(false)

  const currentEditorUrl = useStore((state) => state.extractorSlice.projectCommit?.currentEditorUrl)
  const updateScrapingUrl = useStore((state) => state.extractorSlice.updateScrapingUrl)
  const clearScrapedCache = useStore((state) => state.extractorSlice.clearScrapedCache)
  const fetchPageContent = useStore((state) => state.extractorSlice.fetchPageContent)
  const projectPublicId = useStore((state) => state.projectSlice.project?.project.publicId)
  const projectScrapingState = useStore((state) => state.extractorSlice.projectScrapingState)

  // Derive isLoading from the state values
  const isLoading = (projectPublicId && projectScrapingState[projectPublicId]?.isScrapingActive) ?? false

  // Get cache data directly from projectCommit state - single selector
  const cachedData = useStore((state) => state.extractorSlice.projectCommit?.cachedData)
  const cachedAt = useStore((state) => state.extractorSlice.projectCommit?.cachedAt)

  const setCurrentProjectDialog = useStore((state) => state.projectSlice.setCurrentProjectDialog)

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

  // Sync currentUrl with currentEditorUrl when it changes (but not when user is editing)
  React.useEffect(() => {
    if (currentEditorUrl && currentEditorUrl !== currentUrl && !isUserEditing) {
      setCurrentUrl(currentEditorUrl)
    }
  }, [currentEditorUrl, currentUrl, isUserEditing])

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

    if (isLoading) {
      return false
    }

    // If URL is empty or just whitespace, reset to current editor URL
    if (!currentUrl.trim()) {
      setIsUserEditing(false)
      // Reset to the current editor URL from the store
      if (currentEditorUrl) {
        setCurrentUrl(currentEditorUrl)
      }
      return false
    }

    // Clear user editing state
    setIsUserEditing(false)

    // Update the currentEditorUrl in the project state
    nowait(
      updateScrapingUrl(currentUrl).then(() => {
        // After URL is updated, trigger scrape with force refresh to invalidate cache
        nowait(handleScrape(true))
      })
    )

    return false
  }

  const handleUrlChange = (newUrl: string) => {
    setIsUserEditing(true)
    setCurrentUrl(newUrl)
  }

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-[#0A0A0B] text-white'>
      {/* Top Bar */}
      <TopBar
        onNewSite={() => {
          setCurrentProjectDialog('new-project', null)
        }}
        currentUrl={currentUrl}
        onUrlChange={handleUrlChange}
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
