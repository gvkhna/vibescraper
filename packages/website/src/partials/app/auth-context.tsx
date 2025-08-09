import type {authReactClient} from '@/lib/auth-react-client'
import {createContext, type PropsWithChildren, useContext, type FC} from 'react'

// Define the shape of the environment variables your context will contain
export interface AuthContextValue {
  session: typeof authReactClient.$Infer.Session | null
}

// Create the context with a default undefined value to force checks
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Provide the context value to the subtree
export const AuthProvider: FC<PropsWithChildren<AuthContextValue>> = ({session, children}) => {
  const value: AuthContextValue = {session}
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// A custom hook for consuming the EnvContext
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an EnvProvider')
  }
  return context
}
