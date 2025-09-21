import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { Activity, Clock, FolderOpen, Globe, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useShowResponseError } from '@/hooks/use-show-response-error'
import { nowait } from '@/lib/async-utils'
import { sqlFormatRelativeTimeFromUTC } from '@/lib/format-dates'
import { useAllProjects } from '@/partials/projects/use-all-projects'
import { useStore } from '@/store/use-store'

function AllScrapersPage() {
  const navigate = useNavigate()
  const showResponseError = useShowResponseError()

  // Configure SWR for simple reload-on-mount behavior
  const { data, error, isLoading, mutate } = useAllProjects({})

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      nowait(showResponseError(error))
    }
  }, [error, showResponseError])

  const projects = data?.projects ?? []

  return (
    <div className='bg-background min-h-screen'>
      {/* Header */}
      <div className='bg-card/50 border-b backdrop-blur-sm'>
        <div className='mx-auto max-w-6xl px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-foreground text-2xl font-bold'>Your Scrapers</h1>
              <p className='text-muted-foreground text-sm'>Manage and monitor your web scraping projects</p>
            </div>
            <Button
              onClick={() => {
                nowait(navigate({ to: '/' }))
              }}
              className='bg-primary hover:bg-primary/90'
            >
              <Plus className='mr-2 h-4 w-4' />
              New Scraper
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto max-w-6xl p-6'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-muted-foreground'>Loading your scrapers...</div>
          </div>
        ) : (
          <>
            <div className='grid gap-4'>
              {projects.map((project) => (
                <div
                  key={project.publicId}
                  className='border-border bg-card hover:border-primary/50 hover:bg-card/80 group
                    cursor-pointer rounded-lg border p-6 transition-all hover:shadow-md'
                  onClick={() => {
                    nowait(
                      navigate({
                        to: '/app/scraper/$project-public-id/edit',
                        params: { 'project-public-id': project.publicId }
                      })
                    )
                  }}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center space-x-4'>
                      <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                        <FolderOpen className='text-primary h-6 w-6' />
                      </div>
                      <div className='space-y-1'>
                        <h3
                          className='text-foreground group-hover:text-primary font-semibold transition-colors'
                        >
                          {project.name}
                        </h3>
                        <div className='text-muted-foreground flex items-center space-x-4 text-sm'>
                          {/* TODO: Add URL when available from API */}
                          {/* <div className='flex items-center space-x-1'>
                            <Globe className='h-4 w-4' />
                            <span>{project.url}</span>
                          </div> */}
                          <div className='flex items-center space-x-1'>
                            <Clock className='h-4 w-4' />
                            <span>Updated {sqlFormatRelativeTimeFromUTC(project.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-4'>
                      <div className='text-right text-sm'>
                        {/* TODO: Add active status when available from API */}
                        {/* <div className='flex items-center space-x-2'>
                          <div
                            className={`h-2 w-2 rounded-full ${
                              project.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          <span className={project.isActive ? 'text-green-600' : 'text-muted-foreground'}>
                            {project.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div> */}
                        {/* TODO: Add last run when available from API */}
                        {/* <div className='mt-1 flex items-center space-x-1 text-muted-foreground'>
                          <Activity className='h-3 w-3' />
                          <span>Last run {project.lastRun}</span>
                        </div> */}
                        <div className='text-muted-foreground'>
                          Created {sqlFormatRelativeTimeFromUTC(project.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state for when no scrapers */}
            {projects.length === 0 && (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <FolderOpen className='text-muted-foreground mb-4 h-12 w-12' />
                <h3 className='text-primary mb-2 text-lg font-semibold'>No scrapers yet</h3>
                <p className='text-muted-foreground mb-6'>Get started by creating your first web scraper</p>
                <Button
                  onClick={() => {
                    nowait(navigate({ to: '/' }))
                  }}
                  className='bg-primary hover:bg-primary/90'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Create Your First Scraper
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/app/scrapers/')({
  component: AllScrapersPage
})
