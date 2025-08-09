"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Play, Settings, Copy, ZoomIn, ZoomOut, RefreshCw, ChevronDown, Globe, Code, FileText, BookOpen, Zap, Database } from 'lucide-react'
import { DataTable } from "@/components/data-table"

interface MainContentProps {
  currentUrl: string
  onUrlChange: (url: string) => void
  sidebarWidth: number
  showCrawlPanel: boolean
  onCloseCrawlPanel: () => void
}

export function MainContent({ 
  currentUrl, 
  onUrlChange, 
  sidebarWidth,
  showCrawlPanel,
  onCloseCrawlPanel 
}: MainContentProps) {
  const [activeTab, setActiveTab] = React.useState("rendered")
  const [hasStructuredData, setHasStructuredData] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleScrape = async () => {
    setIsLoading(true)
    // Simulate scraping
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasStructuredData(true)
  }

  return (
    <div 
      className="flex-1 flex flex-col overflow-hidden"
      style={{ marginRight: sidebarWidth }}
    >
      {/* Action Bar */}
      <div className="h-14 bg-[rgba(21,21,23,0.5)] backdrop-blur-sm border-b border-white/10 flex items-center px-4 gap-3">
        <div className="flex-1 flex items-center gap-3">
          <Input
            value={currentUrl}
            onChange={(e) => { onUrlChange(e.target.value); }}
            className="bg-white/5 border-white/10 font-mono text-sm"
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

          <CrawlSettingsDropdown />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30">
            Last: 2m ago
          </Badge>
          <StatusBadge status="success" />
        </div>
      </div>

      {/* Preview Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-[rgba(21,21,23,0.3)] border-b border-white/10">
            <TabsList className="bg-transparent h-12 px-4">
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
              <TabsTrigger value="deep-clean" className="gap-2">
                <Zap className="w-4 h-4" />
                Deep Clean
              </TabsTrigger>
              {hasStructuredData && (
                <TabsTrigger value="structured" className="gap-2">
                  <Database className="w-4 h-4" />
                  Structured Data
                </TabsTrigger>
              )}
            </TabsList>
          </div>

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

            <TabsContent value="deep-clean" className="h-full m-0">
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

            {hasStructuredData && (
              <TabsContent value="structured" className="h-full m-0">
                <StructuredDataPreview />
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Data Table */}
        {hasStructuredData && (
          <div className="border-t border-white/10">
            <DataTable />
          </div>
        )}
      </div>
    </div>
  )
}

function CrawlSettingsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
          <Settings className="w-4 h-4 mr-2" />
          Settings
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <div className="p-3 space-y-3">
          <div>
            <div className="text-sm font-medium mb-2">Browser Type</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="browser" defaultChecked />
                Fetch (fastest)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="browser" />
                Headless Browser
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="browser" />
                Stealth Browser
              </label>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Wait for selector</div>
            <Input 
              placeholder=".product-list" 
              className="bg-white/5 border-white/10 font-mono text-sm h-8"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StatusBadge({ status }: { status: "success" | "error" | "loading" }) {
  const variants = {
    success: { color: "text-[#10B981]", bg: "bg-[#10B981]/20", border: "border-[#10B981]/30" },
    error: { color: "text-red-400", bg: "bg-red-400/20", border: "border-red-400/30" },
    loading: { color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/20", border: "border-[#F59E0B]/30" },
  }
  
  const variant = variants[status]
  
  return (
    <Badge className={`${variant.bg} ${variant.color} ${variant.border}`}>
      {status === "success" && "Success"}
      {status === "error" && "Error"}
      {status === "loading" && "Loading"}
    </Badge>
  )
}

function RenderedPreview({ url }: { url: string }) {
  return (
    <div className="h-full bg-white/5 border border-white/10 rounded-lg m-4 overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Globe className="w-12 h-12 text-white/40 mx-auto" />
          <div className="text-white/60">
            Rendered preview of {url}
          </div>
          <div className="text-sm text-white/40">
            This would show the actual webpage content
          </div>
        </div>
      </div>
    </div>
  )
}

function CodePreview({ content, language }: { content: string; language: string }) {
  return (
    <div className="h-full relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="bg-white/10 hover:bg-white/20"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <pre className="h-full overflow-auto p-4 bg-[#0D1117] text-sm font-mono">
        <code className="text-white/90">{content}</code>
      </pre>
    </div>
  )
}

function ReadabilityPreview() {
  return (
    <div className="h-full overflow-auto p-6 bg-white/5">
      <article className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold mb-4">ACME Widget</h1>
        <div className="text-2xl font-semibold text-[#3B82F6] mb-6">$19.99</div>
        <p className="text-lg leading-relaxed mb-6">
          High-quality widget for all your needs. This premium product combines 
          durability with ease of use, making it perfect for both professionals 
          and hobbyists.
        </p>
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2">
          <li>Durable construction that lasts for years</li>
          <li>Easy to use interface</li>
          <li>1-year warranty included</li>
        </ul>
      </article>
    </div>
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
    <div className="h-full overflow-auto p-4">
      <div className="bg-[#0D1117] rounded-lg p-4 font-mono text-sm">
        <pre className="text-white/90">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
