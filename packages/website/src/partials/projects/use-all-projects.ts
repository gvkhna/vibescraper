import type { InferRequestType } from 'hono'
import useSWR from 'swr'

import api from '@/lib/api-client'

const call = api.projects.userProjects
export function useAllProjects(param: InferRequestType<typeof call.$get>) {
  const fetcher = async () => {
    const res = await call.$get(param)
    if (res.ok) {
      const json = await res.json()
      return json
    } else {
      throw new Error('An unknown error occurred while fetching the data.')
    }
  }
  return useSWR([call, param], fetcher)
}
