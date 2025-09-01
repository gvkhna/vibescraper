import {createContext, type PropsWithChildren, useContext, type FC, useMemo} from 'react'

// Define the shape of the environment variables your context will contain
export interface EnvContextValue {
  publicAppHostname: string | null | undefined
}

// Create the context with a default undefined value to force checks
export const EnvContext = createContext<EnvContextValue | null>(null)

// Provide the context value to the subtree
export const EnvProvider: FC<PropsWithChildren<EnvContextValue>> = ({publicAppHostname, children}) => {
  const value = useMemo<EnvContextValue>(() => ({publicAppHostname}), [publicAppHostname])
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
