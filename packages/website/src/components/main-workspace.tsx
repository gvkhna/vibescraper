"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, RefreshCw, Settings, Copy, Globe, Code, FileText, BookOpen, Zap, Database, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table"

interface MainWorkspaceProps {
  currentUrl: string
  onUrlChange: (url: string) => void
  sidebarCollapsed: boolean
}

export function MainWorkspace({ currentUrl, onUrlChange, sidebarCollapsed }: MainWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState("rendered")
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasData, setHasData] = React.useState(true)

  const handleScrape = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasData(true)
  }

  return (
    <div className={`flex-1 flex flex-col bg-[#0A0A0B] transition-all duration-300 ${sidebarCollapsed ? 'mr-12' : 'mr-96'}`}>
      {/* Action Bar */}
      <div className="h-14 bg-[#151517] border-b border-white/10 flex items-center px-6 gap-4 flex-shrink-0">
        <div className="flex-1 flex items-center gap-3">
          <Input
            value={currentUrl}
            onChange={(e) => { onUrlChange(e.target.value); }}
            className="bg-[#0A0A0B] border-white/20 font-mono text-sm flex-1 max-w-md"
            placeholder="Enter URL to scrape..."
          />
          
          <Button
            onClick={handleScrape}
            disabled={isLoading}
            className="bg-[#3B82F6] hover:bg-[#3B82F6]/80"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Scrape
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Settings className="w-4 h-4 mr-2" />
                Settings
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Simple Fetch</DropdownMenuItem>
              <DropdownMenuItem>Headless Browser</DropdownMenuItem>
              <DropdownMenuItem>Stealth Mode</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30">
            Success
          </Badge>
          <span className="text-sm text-white/60">Last: 2m ago</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-[#151517] border-b border-white/10 px-6">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="rendered" className="gap-2">
                <Globe className="w-4 h-4" />
                Rendered
              </TabsTrigger>
              <TabsTrigger value="raw-html" className="gap-2">
                <Code className="w-4 h-4" />
                Raw HTML
              </TabsTrigger>
              <TabsTrigger value="markdown" className="gap-2">
                <FileText className="w-4 h-4" />
                Markdown
              </TabsTrigger>
              <TabsTrigger value="readability" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Readability
              </TabsTrigger>
              <TabsTrigger value="clean" className="gap-2">
                <Zap className="w-4 h-4" />
                Clean
              </TabsTrigger>
              {hasData && (
                <TabsTrigger value="structured" className="gap-2">
                  <Database className="w-4 h-4" />
                  Data
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="rendered" className="h-full m-0">
              <RenderedPreview url={currentUrl} />
            </TabsContent>
            
            <TabsContent value="raw-html" className="h-full m-0">
              <CodePreview 
                content={`<!DOCTYPE html>
<html>
<head>
  <title>Example Product Page</title>
</head>
<body>
  <div class="product">
    <h1>ACME Widget</h1>
    <span class="price">$19.99</span>
    <p class="description">High-quality widget for all your needs.</p>
  </div>
</body>
</html>`}
                language="html"
              />
            </TabsContent>

            <TabsContent value="markdown" className="h-full m-0">
              <CodePreview 
                content={`# ACME Widget

**Price:** $19.99

High-quality widget for all your needs.

## Features
- Durable construction
- Easy to use
- 1-year warranty`}
                language="markdown"
              />
            </TabsContent>

            <TabsContent value="readability" className="h-full m-0">
              <ReadabilityPreview />
            </TabsContent>

            <TabsContent value="clean" className="h-full m-0">
              <CodePreview 
                content={`ACME Widget
$19.99
High-quality widget for all your needs.
Features
Durable construction
Easy to use
1-year warranty`}
                language="text"
              />
            </TabsContent>

            {hasData && (
              <TabsContent value="structured" className="h-full m-0">
                <StructuredDataPreview />
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Data Table - Only show when we have structured data */}
        {hasData && activeTab !== "structured" && (
          <div className="border-t border-white/10 bg-[#151517]">
            <DataTable />
          </div>
        )}
      </div>
    </div>
  )
}

function RenderedPreview({ url }: { url: string }) {
  return (
    <div className="h-full bg-[#151517] p-6">
      <div className="h-full bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <Globe className="w-16 h-16 text-gray-400 mx-auto" />
            <div className="text-gray-600 text-lg font-medium">
              Rendered preview of {url}
            </div>
            <div className="text-sm text-gray-500 max-w-md">
              This would show the actual webpage content as it appears in a browser
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodePreview({ content, language }: { content: string; language: string }) {
  return (
    <div className="h-full relative bg-[#0D1117]">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="h-full">
        <pre className="p-6 text-sm font-mono text-gray-300 leading-relaxed">
          <code>{content}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

function ReadabilityPreview() {
  return (
    <ScrollArea className="h-full bg-[#151517]">
      <div className="max-w-4xl mx-auto p-8">
        <article className="prose prose-invert prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-6 text-white">ACME Widget</h1>
          <div className="text-3xl font-semibold text-[#3B82F6] mb-8">$19.99</div>
          <p className="text-xl leading-relaxed mb-8 text-gray-300">
            High-quality widget for all your needs. This premium product combines 
            durability with ease of use, making it perfect for both professionals 
            and hobbyists.
          </p>
          <h2 className="text-2xl font-semibold mb-6 text-white">Features</h2>
          <ul className="space-y-3 text-lg text-gray-300">
            <li>Durable construction that lasts for years</li>
            <li>Easy to use interface</li>
            <li>1-year warranty included</li>
          </ul>
        </article>
      </div>
    </ScrollArea>
  )
}

function StructuredDataPreview() {
  const data = {
    product_name: "ACME Widget",
    price: 19.99,
    availability: true,
    images: [
      "https://example.com/widget1.jpg",
      "https://example.com/widget2.jpg"
    ],
    description: "High-quality widget for all your needs."
  }

  return (
    <div className="h-full bg-[#0D1117] p-6">
      <div className="bg-[#151517] rounded-lg p-6 font-mono text-sm border border-white/10">
        <pre className="text-gray-300 leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
