import { useCallback } from 'react'
import debug from 'debug'
import { toast } from 'sonner'

const log = debug('app:use-show-response-error')

export function useShowResponseError() {
  return useCallback(async (response: Response) => {
    if (response.ok) {
      return
    } // No need to handle successful responses

    const defaultErrorMessage = 'An unexpected error occurred.'
    let errorMessage: string | null = null

    log(`Error handling triggered: ${response.status} ${response.statusText}`)

    // Clone the response since we can only read the body once
    const clonedResponse = response.clone()

    try {
      response
        .json() // Attempt to parse JSON error message
        .then((res) => {
          if (res.message) {
            errorMessage = res.message
          } else if (res.error) {
            errorMessage = res.error
          }

          // Log for debugging
          log(`HTTP Error ${response.status}:`, errorMessage)

          // Display error toast
          toast.error(errorMessage ?? 'Uh oh! Something went wrong.', {
            duration: 0
          })
        })
        .catch((err: unknown) => {
          return clonedResponse.text()
        })
        .then((res) => {
          if (res) {
            errorMessage = res
          } else {
            errorMessage = `Response Error: ${response.status}`
          }
          toast.error(errorMessage, {
            duration: 0
          })
        })
        .catch((err: unknown) => {
          errorMessage = `Response Error: ${response.status}`
          toast.error(errorMessage, {
            duration: 0
          })
        })
    } catch (parseError) {
      log('Error parsing response:', parseError)

      try {
        // Fallback to text if JSON parsing failed
        const text = await clonedResponse.text()
        errorMessage = text || response.statusText
        log(`Fallback text error ${response.status}:`, text)
      } catch (textError) {
        log('Error reading response as text:', textError)
        errorMessage = response.statusText || defaultErrorMessage
      }
    } finally {
      // If response is not JSON, fallback to status text
      errorMessage = response.statusText || errorMessage

      // Log for debugging
      log(`HTTP Error ${response.status}:`, errorMessage)

      // Display error toast
      toast.error(errorMessage ?? 'Uh oh! Something went wrong.', {
        duration: 0
      })
    }
  }, [])
}
