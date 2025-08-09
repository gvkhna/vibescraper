import {type PropsWithChildren, useState} from 'react'
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {useProjectStore} from '@/store/use-project-store'
import {toast} from 'sonner'
import {nowait} from '@/lib/async-utils'

export interface RenameProjectDialogProps {
  open: boolean
  onOpenChange: (state: boolean) => void
}

export function RenameProjectDialog(props: PropsWithChildren<RenameProjectDialogProps>) {
  const currentProject = useProjectStore((state) => state.projectSlice.project)
  const renameProject = useProjectStore((state) => state.projectSlice.renameProject)
  const [projectName, setProjectName] = useState(currentProject?.project.name ?? '')
  const {children, open, onOpenChange} = props

  const handleSubmit = async () => {
    try {
      const result = await renameProject(projectName)
      if (result.success) {
        toast.success('Your project was successfully renamed.', {
          duration: 1000
        })
      } else {
        toast.error('Uh oh! Something went wrong renaming the project.', {
          duration: 0
        })
      }
    } finally {
      setProjectName('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent>
        <DialogDescription>{''}</DialogDescription>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
        </DialogHeader>
        <form
          method='post'
          className='flex flex-col gap-4'
          onSubmit={(e) => {
            e.preventDefault()
            nowait(handleSubmit())
            return false
          }}
        >
          <Input
            placeholder='Project Name'
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value)
            }}
          />
          <Button type='submit'>Rename</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
