'use client'

import {type ReactNode, useState} from 'react'
import {Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {toast} from 'sonner'
import {useNavigate} from '@tanstack/react-router'
import {sqlFormatTimestamp} from '@/lib/format-dates'
import api from '@/lib/api-client'
import {nowait} from '@/lib/async-utils'
import type {ProjectPublicId} from '@/db/schema/project'
import type {SQLUTCTimestamp} from '@/db/schema/common'

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: ProjectPublicId
  projectName: string
  createdAt: SQLUTCTimestamp
  trigger?: ReactNode
}

export function DeleteProjectConfirmDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  createdAt,
  trigger
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const formattedDate = sqlFormatTimestamp(createdAt)

  async function deleteProject() {
    setIsDeleting(true)
    try {
      const response = await api.projects.delete.$post({
        json: {
          projectPublicId: projectId
        }
      })

      if (!response.ok) {
        toast.error('Failed to delete project. Please try again.', {
          duration: 0
        })
        return
      }

      toast.success(`${projectName} has been successfully deleted.`)
      onOpenChange(false)

      await navigate({to: '/'})
    } catch (error) {
      toast.error('Failed to delete project. Please try again.', {
        duration: 0
      })
    } finally {
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
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='gap-1'>
          <div className='bg-destructive/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full'>
            <Trash2 className='text-destructive h-10 w-10' />
          </div>
          <DialogTitle className='pt-4 text-center text-xl'>Delete Project</DialogTitle>
          <DialogDescription className='text-center'>
            Are you sure you want to delete this project? This action is
            <span className='font-semibold'> irreversible</span> and will permanently delete all associated
            data.
          </DialogDescription>
        </DialogHeader>
        <div className='bg-muted/50 flex flex-col space-y-3 rounded-lg p-4'>
          <div className='space-y-1'>
            <p className='text-muted-foreground text-sm'>Project Name</p>
            <p className='font-medium'>{projectName}</p>
          </div>
          <div className='space-y-1'>
            <p className='text-muted-foreground text-sm'>Created On</p>
            <p className='font-medium'>{formattedDate}</p>
          </div>
        </div>
        <DialogFooter className='flex flex-col sm:flex-row sm:justify-between sm:space-x-2'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false)
            }}
            className='mb-2 sm:mb-0'
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              nowait(deleteProject())
            }}
            disabled={isDeleting}
            className='relative'
          >
            {isDeleting && (
              <span className='absolute inset-0 flex items-center justify-center'>
                <svg
                  className='h-5 w-5 animate-spin text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
              </span>
            )}
            <span className={isDeleting ? 'invisible' : ''}>Confirm I want to delete this project</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
