import {type ReactNode} from 'react'
import {ThemeProvider} from '@/components/theme-provider'

export default function DetailLayout({children}: {children: ReactNode}) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='dark'
      enableSystem={false}
    >
      <div className='min-h-screen bg-[#0A0A0B] text-white antialiased'>{children}</div>
    </ThemeProvider>
  )
}
