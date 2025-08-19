/* eslint-disable no-console */
import type {Meta, StoryObj} from '@storybook/react'
import {type FC, type PropsWithChildren, useEffect, useState} from 'react'
import {ChatFileProjectVersionBlock} from './chat-file-version-block'
import type {ChatFileVersionBlockFileChange} from './chat-message-schema'

const meta = {
  title: 'Assistant/ExtractorVersion',
  component: ChatFileProjectVersionBlock,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    versionBlock: {
      type: 'extractor',
      version: '',
      changes: [],
      overallStatus: 'in-progress'
    }
  }
} satisfies Meta<typeof ChatFileProjectVersionBlock>

export default meta
type Story = StoryObj<typeof meta>

export const ProjectVersionMessageDefault: Story = {
  render: function Page() {
    const [changes, setChanges] = useState<ChatFileVersionBlockFileChange[]>([])
    const [overallStatus, setOverallStatus] = useState<'loading' | 'in-progress' | 'complete' | 'error'>(
      'loading'
    )
    const [isLoading, setIsLoading] = useState(true)

    // Simulate the progression of states
    useEffect(() => {
      // Initial loading state
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false)
        setOverallStatus('in-progress')

        // Start generating the first file
        setChanges([
          {
            path: 'components/oauth-connection-provider.tsx',
            status: 'generating',
            isLoading: true
          }
        ])
      }, 2000)

      // First file generated
      const firstFileTimeout = setTimeout(() => {
        setChanges([
          {
            path: 'components/oauth-connection-provider.tsx',
            status: 'generated',
            isLoading: false
          }
        ])

        // Start editing the second file
        setTimeout(() => {
          setChanges((prev) => [
            ...prev,
            {
              path: 'app/page.tsx',
              status: 'editing',
              isLoading: true
            }
          ])
        }, 500)
      }, 4000)

      // Second file edited
      const secondFileTimeout = setTimeout(() => {
        setChanges((prev) => [
          prev[0],
          {
            path: 'app/page.tsx',
            status: 'edited',
            isLoading: false
          }
        ])

        // Start generating a new file
        setTimeout(() => {
          setChanges((prev) => [
            ...prev,
            {
              path: 'components/with-very-long-filename-that-needs-truncation.tsx',
              status: 'generating',
              isLoading: true
            }
          ])
        }, 500)
      }, 7000)

      // Third file generated
      const thirdFileTimeout = setTimeout(() => {
        setChanges((prev) => [
          prev[0],
          prev[1],
          {
            path: 'components/with-very-long-filename-that-needs-truncation.tsx',
            status: 'generated',
            isLoading: false
          }
        ])

        // Complete
        setTimeout(() => {
          setOverallStatus('complete')
        }, 1000)
      }, 10000)

      return () => {
        clearTimeout(loadingTimeout)
        clearTimeout(firstFileTimeout)
        clearTimeout(secondFileTimeout)
        clearTimeout(thirdFileTimeout)
      }
    }, [])

    return (
      <div className='grid gap-8 p-4'>
        <div className='mx-auto w-full max-w-[600px]'>
          <h2 className='mb-2 text-lg font-medium'>Progress Demo</h2>
          <p className='text-muted-foreground mb-4'>
            This demo shows the component going through various loading states.
          </p>
          <ChatFileProjectVersionBlock
            versionBlock={{
              type: 'extractor',
              version: 'Version 2',
              changes: changes,
              overallStatus: overallStatus
            }}
            onRestore={() => {
              console.log('Restore clicked')
            }}
            isViewing={true}
            isLoading={isLoading}
          />
        </div>

        {/* Error state example */}
        <div className='mx-auto w-full max-w-[600px]'>
          <h2 className='mb-2 text-lg font-medium'>Error State</h2>
          <ChatFileProjectVersionBlock
            versionBlock={{
              type: 'extractor',
              version: 'Version with Error',
              changes: [
                {
                  path: 'components/oauth-connection-provider.tsx',
                  status: 'generated',
                  isLoading: false
                },
                {
                  path: 'app/page.tsx',
                  status: 'error',
                  isLoading: false
                }
              ],
              overallStatus: 'error'
            }}
            onRestore={() => {
              console.log('Restore clicked')
            }}
            isViewing={true}
          />
        </div>

        {/* Completed state example */}
        <div className='mx-auto w-full max-w-[600px]'>
          <h2 className='mb-2 text-lg font-medium'>Completed State</h2>
          <ChatFileProjectVersionBlock
            versionBlock={{
              type: 'extractor',
              version: 'Completed Version',
              changes: [
                {
                  path: 'components/oauth-connection-provider.tsx',
                  status: 'generated',
                  isLoading: false
                },
                {
                  path: 'app/page.tsx',
                  status: 'edited',
                  isLoading: false
                },
                {
                  path: 'components/ui/button.tsx',
                  status: 'edited',
                  isLoading: false
                }
              ],
              overallStatus: 'complete'
            }}
            onRestore={() => {
              console.log('Restore clicked')
            }}
            isViewing={true}
          />
        </div>
      </div>
    )
  },
  args: {
    versionBlock: {
      type: 'extractor',
      version: '',
      changes: [],
      overallStatus: 'in-progress'
    }
  }
}
