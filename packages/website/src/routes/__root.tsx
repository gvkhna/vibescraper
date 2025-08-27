import {BetterAuthUIProvider} from '@/partials/webapp/better-auth-ui-provider'
import {NotFoundPage} from '@/partials/webapp/not-found-page'
import {createRootRoute, Link, Outlet, redirect} from '@tanstack/react-router'
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools'
import {ErrorPage} from '@/partials/webapp/error-page'
import {PUBLIC_VARS} from '@/vars.public'

export const Route = createRootRoute({
  notFoundComponent: () => <NotFoundPage />,
  errorComponent: () => <ErrorPage />,
  component: () => (
    <>
      <BetterAuthUIProvider>
        <Outlet />
      </BetterAuthUIProvider>
      {/* {PUBLIC_VARS.DEV && <TanStackRouterDevtools />} */}
    </>
  )
})
