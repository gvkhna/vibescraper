'use client'

import { type ReactNode, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import type { SQLUTCTimestamp } from '@/db/schema/common'
import type { ProjectPublicId } from '@/db/schema/project'
import api from '@/lib/api-client'
import { nowait } from '@/lib/async-utils'
import { sqlFormatTimestamp } from '@/lib/format-dates'

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: ProjectPublicId
  projectName: string
  createdAt: SQLUTCTimestamp
  deleteProject: () => Promise<void>
  trigger?: ReactNode
}

export function DeleteProjectConfirmDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  createdAt,
  deleteProject,
  trigger
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const formattedDate = sqlFormatTimestamp(createdAt)

  const handleSubmit = async () => {
    setIsDeleting(true)
    try {
      await deleteProject()
      setIsDeleting(false)
    } catch (e) {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* <DialogTrigger asChild>
        {trigger || (
          <Button
            variant='destructive'
            size='sm'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Delete Project
          </Button>
        )}
      </DialogTrigger> */}
      <DialogContent className='border-white/10 bg-[#151517] text-white sm:max-w-md'>
        <DialogHeader className='gap-1'>
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10'>
            <Trash2 className='h-10 w-10 text-red-400' />
          </div>
          <DialogTitle className='pt-4 text-center text-xl text-white'>Delete Project</DialogTitle>
          <DialogDescription className='text-center text-white/60'>
            Are you sure you want to delete this project? This action is
            <span className='font-semibold text-white/80'> irreversible</span> and will permanently delete all
            associated data.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col space-y-3 rounded-lg border border-white/10 bg-[#0A0A0B] p-4'>
          <div className='space-y-1'>
            <p className='text-sm text-white/60'>Project Name</p>
            <p className='font-medium text-white'>{projectName}</p>
          </div>
          <div className='space-y-1'>
            <p className='text-sm text-white/60'>Created On</p>
            <p className='font-medium text-white'>{formattedDate}</p>
          </div>
        </div>
        <DialogFooter className='flex flex-col sm:flex-row sm:justify-between sm:space-x-2'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false)
            }}
            className='mb-2 border-white/20 text-white hover:bg-white/10 sm:mb-0'
          >
            Cancel
          </Button>

          <Button
            variant='destructive'
            onClick={() => {
              nowait(handleSubmit())
            }}
            disabled={isDeleting}
            className='relative bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-700'
          >
            {isDeleting ? (
              <span className='absolute inset-0 flex items-center justify-center'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin text-white' />
              </span>
            ) : (
              <span>
                <Trash2 className='mr-2 inline h-4 w-4' />
                Confirm Delete
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
