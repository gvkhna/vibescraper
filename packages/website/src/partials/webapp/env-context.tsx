import { createContext, type FC, type PropsWithChildren, useContext, useMemo } from 'react'

import type { PUBLIC_VARS } from '@/vars.public'

// Define the shape of the environment variables your context will contain
export type EnvContextValue = {
  publicEnv: typeof PUBLIC_VARS
}

// Create the context with a default undefined value to force checks
export const EnvContext = createContext<EnvContextValue | null>(null)

// Provide the context value to the subtree
export const EnvProvider: FC<PropsWithChildren<EnvContextValue>> = ({ publicEnv, children }) => {
  const value = useMemo<EnvContextValue>(() => ({ publicEnv }), [publicEnv])
  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>
}

// A custom hook for consuming the EnvContext
export function useEnvContext(): EnvContextValue {
  const context = useContext(EnvContext)
  if (context === null) {
    throw new Error('useEnvContext must be used within an EnvProvider')
  }
  return context
}
