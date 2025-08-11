'use client'

import {type ReactNode, useState} from 'react'
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Plus, Loader2} from 'lucide-react'
import {nowait} from '@/lib/async-utils'

export interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  createProject: (projectName: string) => Promise<void>
  defaultProjectName: string
  trigger?: ReactNode
}

export function NewProjectDialog({
  open,
  onOpenChange,
  createProject,
  defaultProjectName,
  trigger
}: NewProjectDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [projectName, setProjectName] = useState(defaultProjectName || '')

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      return
    }
    
    setIsCreating(true)
    try {
      await createProject(projectName)
      // Don't clear projectName here - the key change will reset the component
      onOpenChange(false)
    } catch (e) {
      setIsCreating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isCreating) {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent className='border-white/10 bg-[#151517] text-white sm:max-w-md'>
        <DialogHeader>
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10'>
            <Plus className='h-10 w-10 text-blue-400' />
          </div>
          <DialogTitle className='pt-4 text-center text-xl text-white'>New Project</DialogTitle>
          <DialogDescription className='text-center text-white/60'>
            Create a new web scraping project to get started
          </DialogDescription>
        </DialogHeader>
        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            nowait(handleSubmit())
            return false
          }}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Input
              placeholder='Project Name'
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value)
              }}
              disabled={isCreating}
              className='border-white/20 bg-[#0A0A0B] text-white placeholder:text-white/40'
              autoFocus
            />
          </div>

          <DialogFooter className='flex flex-col sm:flex-row sm:justify-between sm:space-x-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onOpenChange(false)
              }}
              disabled={isCreating}
              className='mb-2 border-white/20 text-white hover:bg-white/10 sm:mb-0'
            >
              Cancel
            </Button>

            <Button
              type='submit'
              disabled={isCreating || !projectName.trim()}
              className='bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-700'
            >
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className='mr-2 h-4 w-4' />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}