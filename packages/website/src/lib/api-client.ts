import { hc } from 'hono/client'

import type { AppType } from '@/server'

export const { api } = hc<AppType>(
  `${globalThis.window.location.protocol}//${globalThis.window.location.host}`,
  {
    fetch: (input: string | URL | globalThis.Request, init?: globalThis.RequestInit) => {
      return globalThis.fetch(input, {
        ...init,
        credentials: 'include'
      })
    }
  }
)
export default api
