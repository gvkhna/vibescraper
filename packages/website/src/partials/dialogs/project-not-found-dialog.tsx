'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ProjectNotFoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectNotFoundDialog({ open, onOpenChange }: ProjectNotFoundDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='gap-1'>
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-10 w-10 text-destructive' />
          </div>
          <DialogTitle className='pt-4 text-center text-xl'>Error: Project Not Found</DialogTitle>
          <DialogDescription className='text-center'>
            The project you tried to access does not exist or has been removed.
          </DialogDescription>
        </DialogHeader>
        <div className='flex justify-center'>
          <Button
            onClick={() => {
              onOpenChange(false)
            }}
            className='w-full sm:w-auto'
          >
            Go Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
