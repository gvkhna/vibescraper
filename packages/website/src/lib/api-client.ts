import type {AppType} from '@/server'
import {hc} from 'hono/client'
import {PUBLIC_VARS} from '@/vars.public'
export const {api} = hc<AppType>(PUBLIC_VARS.PUBLIC_HOSTNAME, {
  fetch: (input: string | URL | globalThis.Request, init?: globalThis.RequestInit) => {
    return globalThis.fetch(input, {
      ...init,
      credentials: 'include'
    })
  }
})
export default api
