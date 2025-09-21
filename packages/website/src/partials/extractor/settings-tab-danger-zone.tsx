'use client'

import * as React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface DangerZoneTabContentProps {
  projectName: string
  openConfirmDeleteProjectDialog?: () => void
  onClose: () => void
}

export function DangerZoneTabContent({
  projectName,
  openConfirmDeleteProjectDialog,
  onClose
}: DangerZoneTabContentProps) {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div className='rounded-lg border border-red-500/30 bg-red-500/5 p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='mt-0.5 h-5 w-5 text-red-400' />
            <div className='flex-1'>
              <h3 className='font-medium text-red-400'>Danger Zone</h3>
              <p className='mt-1 text-sm text-white/70'>These actions are irreversible. Please be certain.</p>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border border-white/10 bg-[#0A0A0B] p-4'>
            <div className='flex items-center justify-between gap-6'>
              <div className='flex-1 space-y-1'>
                <h4 className='font-medium text-white'>Delete Project</h4>
                <p className='text-sm text-white/60'>
                  Permanently delete <span className='font-medium text-white'>{projectName}</span> and all of
                  its data
                </p>
                <p className='text-xs text-red-400/80'>
                  This action cannot be undone. All crawl data, extraction results, and settings will be
                  permanently removed.
                </p>
              </div>
              {openConfirmDeleteProjectDialog && (
                <Button
                  variant='ghost'
                  className='border border-red-600/30 bg-red-600/10 text-red-400
                    shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-600/20 hover:text-red-300'
                  onClick={() => {
                    onClose()
                    openConfirmDeleteProjectDialog()
                  }}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Project
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
