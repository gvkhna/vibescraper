import {createFileRoute, redirect, Outlet} from '@tanstack/react-router'
import {authReactClient} from '@/lib/auth-react-client'

export const Route = createFileRoute('/app')({
  beforeLoad: async ({location}) => {
    const session = await authReactClient.getSession()
    if (!session.data?.user) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/signin',
        search: {
          redirect: location.href
        }
      })
    }
  },
  component: () => <Outlet />
})
