export const apiFetchClient = {
  fetch: (input: RequestInfo, init?: RequestInit) => {
    return globalThis.fetch(input, {
      ...init,
      credentials: 'include'
    })
  }
}
