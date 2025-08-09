import {type ReactNode} from 'react'
import {DashboardShell} from '@/components/dashboard-shell'

// export const metadata: Metadata = {
//   title: "WebCrawler Studio",
//   description: "AI-powered web scraping platform",
//     generator: 'v0.dev'
// }

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html
      lang='en'
      className='dark'
    >
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  )
}

// import './globals.css'
