"use client"

import { Activity, Database, FileSearch, FolderTree, Plus, Settings } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const items = [
    { title: "Projects", icon: FolderTree, href: "#", isActive: true },
    { title: "Active Crawls", icon: Activity, href: "#" },
    { title: "Data Explorer", icon: Database, href: "#data-explorer" },
    { title: "Logs & Monitoring", icon: FileSearch, href: "#monitoring" },
    { title: "Settings", icon: Settings, href: "#settings" },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon" className="bg-[#0E0E0F]">
      <SidebarHeader className="px-2 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="bg-white/5 hover:bg-white/10 transition">
              <Plus className="text-[#3B82F6]" />
              <span>New Project</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((i) => (
                <SidebarMenuItem key={i.title}>
                  <SidebarMenuButton asChild isActive={i.isActive}>
                    <a href={i.href}>
                      <i.icon />
                      <span>{i.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">Shortcuts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Go to Data Explorer">
                  <a href="#data-explorer">
                    <Database />
                    <span>Explore Data</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Go to Monitoring">
                  <a href="#monitoring">
                    <Activity />
                    <span>Monitoring</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="text-xs text-white/40 px-2">v1.0</div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
