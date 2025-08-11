import {type PropsWithChildren, useEffect, useState} from 'react'
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
import {useNavigate} from '@tanstack/react-router'
import {useShowResponseError} from '@/hooks/use-show-response-error'
import api from '@/lib/api-client'
import {useProjectStore} from '@/store/use-project-store'
import {nowait} from '@/lib/async-utils'
import debug from 'debug'

const log = debug('app:new-project-dialog')

export interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (state: boolean) => void
}

export function NewProjectDialog(props: PropsWithChildren<NewProjectDialogProps>) {
  const showResponseError = useShowResponseError()
  const navigate = useNavigate()

  // const addRecentProject = useProjectStore((state) => state.recentProjectsSlice.addRecentProject)
  const [projectName, setProjectName] = useState('')
  const {children, open, onOpenChange} = props

  const handleSubmit = async () => {
    try {
      const resp = await api.projects.new.$post({
        json: {
          projectName: projectName
        }
      })
      if (resp.ok) {
        const json = await resp.json()
        if (json.project.publicId) {
          // TODO: Re-enable when recentProjectsSlice is available
          // addRecentProject({publicId: json.project.publicId, name: json.project.name})
          nowait(
            navigate({
              to: '/project/$project-public-id',
              params: {'project-public-id': json.project.publicId}
            })
          )
        }
      } else {
        nowait(showResponseError(resp))
      }
    } finally {
      setProjectName('')
      onOpenChange(false)
    }
  }

  // set a default project name like Project #1
  useEffect(() => {
    if (open && !projectName) {
      api.projects.newDefaultProjectName
        .$get({})
        .then((resp) => {
          if (resp.ok) {
            return resp.json()
          } else {
            throw new Error('default project name not found')
          }
        })
        .then((res) => {
          if (res.name && !projectName) {
            setProjectName(res.name)
          }
        })
        .catch((e: unknown) => {
          log('ignoring error', e)
        })
    }
  }, [open, projectName])

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent>
        <DialogDescription>{''}</DialogDescription>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
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
          <Button type='submit'>Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
