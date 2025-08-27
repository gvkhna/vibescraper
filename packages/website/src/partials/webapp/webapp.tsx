import {StrictMode, type PropsWithChildren} from 'react'
import {SWRConfig} from 'swr'
import {ThemeProvider} from 'next-themes'
import {Toaster} from '@/components/ui/sonner'
import {ErrorBoundary} from 'react-error-boundary'
import {EnvProvider, type EnvContextValue} from './env-context'
import {RouterProvider, createRouter} from '@tanstack/react-router'

// Import the generated route tree
import {routeTree} from '@/routeTree.gen.ts'
import {ErrorPage} from './error-page'
import {NotFoundPage} from './not-found-page'

// Create a new router instance
const router = createRouter({
  routeTree: routeTree,
  defaultPreload: 'intent',
  basepath: '/',
  defaultErrorComponent: (props) => <ErrorPage {...props} />,
  defaultNotFoundComponent: (props) => <NotFoundPage {...props} />,
  defaultOnCatch(error, errorInfo) {
    // Log errors caught by the router so they aren't silently swallowed.
    // eslint-disable-next-line no-console
    console.error('Router caught an error:', error, errorInfo)
  }
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export interface WebappProps extends EnvContextValue {}

export function Webapp(props: PropsWithChildren<WebappProps>) {
  return (
    <StrictMode>
      <EnvProvider publicAppHostname={props.publicAppHostname}>
        <SWRConfig
          value={{
            // Do not revalidate when window gains focus
            revalidateOnFocus: false,
            // Do not revalidate when the browser regains a network connection
            revalidateOnReconnect: false,
            // Do not poll at intervals
            refreshInterval: 0,
            // Do not revalidate automatically even if the data is considered stale
            revalidateIfStale: false,
            // Only revalidate when components mount
            revalidateOnMount: true,
            // 10 minutes
            dedupingInterval: 60 * 10 * 1000
          }}
        >
          <ThemeProvider
            enableSystem
            attribute='class'
            defaultTheme='dark'
            disableTransitionOnChange
          >
            <ErrorBoundary
              FallbackComponent={ErrorPage}
              onError={(error, info) => {
                // Additional logging or reporting can go here
                // eslint-disable-next-line no-console
                console.error('Error logged via onError:', error, info)
              }}
            >
              <RouterProvider router={router} />
              <Toaster />
            </ErrorBoundary>
          </ThemeProvider>
        </SWRConfig>
      </EnvProvider>
    </StrictMode>
  )
  return <StrictMode></StrictMode>
}
