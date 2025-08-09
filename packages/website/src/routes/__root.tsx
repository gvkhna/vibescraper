import {BetterAuthProvider} from '@/partials/app/better-auth-provider'
import {NotFoundPage} from '@/partials/app/not-found-page'
import {createRootRoute, Link, Outlet, redirect} from '@tanstack/react-router'
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools'
import {ErrorPage} from '@/partials/app/error-page'
import {PUBLIC_VARS} from '@/vars.public'

export const Route = createRootRoute({
  notFoundComponent: () => <NotFoundPage />,
  errorComponent: () => <ErrorPage />,
  component: () => (
    <>
      <BetterAuthProvider>
        <Outlet />
      </BetterAuthProvider>
      {/* <TanStackRouterDevtools /> */}
      {/* {PUBLIC_VARS.DEV && <TanStackRouterDevtools />} */}
    </>
  )
})
