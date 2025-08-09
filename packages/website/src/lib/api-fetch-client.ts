// import {PUBLIC_HOSTNAME_WEB} from '@/strings'
export const apiFetchClient = {
  fetch: (input: RequestInfo, init?: RequestInit) => {
    return globalThis.fetch(input, {
      ...init,
      credentials: 'include'
    })
  }
}

// Base URL configuration
// const baseURL = PUBLIC_HOSTNAME_WEB || 'http://localhost:4321'

// Function to create full URLs
// const createUrl = (path: string) => {
//   return new URL(path, baseURL).toString()
// }
