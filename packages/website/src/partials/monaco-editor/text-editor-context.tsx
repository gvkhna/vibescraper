import type {ProjectPublicId} from '@/db/schema'
import {createContext, type PropsWithChildren, useContext, type FC} from 'react'

// Define the shape of the environment variables your context will contain
export interface TextEditorContextValue {
  publicId: ProjectPublicId | undefined
}

// Create the context with a default value to force checks
export const TextEditorContext = createContext<TextEditorContextValue | null>(null)

// Provide the context value to the subtree
export const TextEditorContextProvider: FC<PropsWithChildren<TextEditorContextValue>> = ({
  publicId,
  children
}) => {
  const value: TextEditorContextValue = {publicId}
  return <TextEditorContext.Provider value={value}>{children}</TextEditorContext.Provider>
}

// A custom hook for consuming the EnvContext
export function useTextEditorContext(): TextEditorContextValue {
  const context = useContext(TextEditorContext)
  if (context === null) {
    throw new Error('useEditorFileContext must be used within an EnvProvider')
  }
  return context
}
