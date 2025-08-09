// import type { Metadata } from "next"
// import { Inter } from 'next/font/google'
import {ThemeProvider} from '@/components/theme-provider'
import './globals.css'

// const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "WebCrawler Studio",
//   description: "AI-powered web scraping platform",
//     generator: 'v0.dev'
// }

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang='en'
      className='dark'
    >
      <body className={'bg-[#0A0A0B] text-white antialiased'}>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
