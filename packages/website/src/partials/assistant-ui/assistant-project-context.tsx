// components/markdown/markdown-renderer-context.tsx
import { createContext, useContext } from 'react'

import { AssistantProjectComponentDefault } from './assistant-project-component-default'

const defaultComponent = AssistantProjectComponentDefault

const AssistantProjectContext = createContext<typeof AssistantProjectComponentDefault>(defaultComponent)

export const AssistantProjectContextProvider = AssistantProjectContext.Provider

export const useAssistantProjectComponent = () => useContext(AssistantProjectContext)
