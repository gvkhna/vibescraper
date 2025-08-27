'use client'

import * as React from 'react'
import {Dialog, DialogContent, DialogTitle, DialogDescription} from '@/components/ui/dialog'
import type {ProjectPublicId} from '@/db/schema'
import type {ProjectCommitSettings, ExtractorSettings} from '@/db/schema/project'
import {ScraperSettingsContent} from '@/partials/extractor/scraper-settings-content'

interface ScraperSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: ProjectPublicId
  projectName: string
  initialSettings?: {
    commit?: ProjectCommitSettings
    extractor?: ExtractorSettings | null
  }
  onSave: (settings: {commit: ProjectCommitSettings; extractor: ExtractorSettings}) => Promise<void>
  openConfirmDeleteProjectDialog?: () => void
}

export function ScraperSettingsDialog({
  open,
  onOpenChange,
  projectName,
  initialSettings,
  onSave,
  openConfirmDeleteProjectDialog
}: ScraperSettingsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className='border-white/10 bg-[#151517] p-0 text-white sm:!max-w-2xl'
        showCloseButton={false}
      >
        <DialogTitle className='sr-only'>Scraper Settings</DialogTitle>
        <DialogDescription className='sr-only'>
          Configure extraction settings for your project
        </DialogDescription>

        <ScraperSettingsContent
          projectName={projectName}
          initialSettings={initialSettings}
          onSave={onSave}
          onClose={() => {
            onOpenChange(false)
          }}
          openConfirmDeleteProjectDialog={openConfirmDeleteProjectDialog}
        />
      </DialogContent>
    </Dialog>
  )
}
