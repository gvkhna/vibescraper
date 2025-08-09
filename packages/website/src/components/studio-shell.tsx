"use client"

import * as React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"

export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-[#0A0A0B] text-white">
        <SidebarProvider defaultOpen>
          <AppSidebar />
          <SidebarInset className="bg-transparent">
            <TopNav />
            <div className="px-4 md:px-6 pb-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ThemeProvider>
  )
}
