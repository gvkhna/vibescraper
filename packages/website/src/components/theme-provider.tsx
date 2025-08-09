'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Prevent hydration issues by only rendering after mount
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same structure to prevent layout shift
    return <div className="min-h-screen bg-[#0A0A0B] text-white antialiased">{children}</div>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
