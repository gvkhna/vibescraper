'use client'

import * as React from 'react'
import {
  BookOpen,
  ChevronDown,
  Code,
  Copy,
  Database,
  FileText,
  Globe,
  Play,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { nowait } from '@/lib/async-utils'

interface MainWorkspaceProps {
  currentUrl: string
  onUrlChange: (url: string) => void
  sidebarCollapsed: boolean
}

export function MainWorkspace({ currentUrl, onUrlChange, sidebarCollapsed }: MainWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState('rendered')
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasData, setHasData] = React.useState(true)

  const handleScrape = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasData(true)
  }

  return (
    <div
      className={`flex flex-1 flex-col bg-[#0A0A0B] transition-all duration-300
        ${sidebarCollapsed ? 'mr-12' : 'mr-96'}`}
    >
      {/* Action Bar */}
      <div className='flex h-14 flex-shrink-0 items-center gap-4 border-b border-white/10 bg-[#151517] px-6'>
        <div className='flex flex-1 items-center gap-3'>
          <Input
            value={currentUrl}
            onChange={(e) => {
              onUrlChange(e.target.value)
            }}
            className='max-w-md flex-1 border-white/20 bg-[#0A0A0B] font-mono text-sm'
            placeholder='Enter URL to scrape...'
          />

          <Button
            onClick={() => {
              nowait(handleScrape())
            }}
            disabled={isLoading}
            className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'
          >
            {isLoading ? (
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Play className='mr-2 h-4 w-4' />
            )}
            Scrape
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='border-white/20 text-white hover:bg-white/10'
              >
                <Settings className='mr-2 h-4 w-4' />
                Settings
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Simple Fetch</DropdownMenuItem>
              <DropdownMenuItem>Headless Browser</DropdownMenuItem>
              <DropdownMenuItem>Stealth Mode</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='flex items-center gap-3'>
          <Badge className='border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]'>Success</Badge>
          <span className='text-sm text-white/60'>Last: 2m ago</span>
        </div>
      </div>

      {/* Content Area */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='flex flex-1 flex-col'
        >
          {/* Tab Navigation */}
          <div className='border-b border-white/10 bg-[#151517] px-6'>
            <TabsList className='h-12 bg-transparent'>
              <TabsTrigger
                value='rendered'
                className='gap-2'
              >
                <Globe className='h-4 w-4' />
                Rendered
              </TabsTrigger>
              <TabsTrigger
                value='raw-html'
                className='gap-2'
              >
                <Code className='h-4 w-4' />
                Raw HTML
              </TabsTrigger>
              <TabsTrigger
                value='markdown'
                className='gap-2'
              >
                <FileText className='h-4 w-4' />
                Markdown
              </TabsTrigger>
              <TabsTrigger
                value='readability'
                className='gap-2'
              >
                <BookOpen className='h-4 w-4' />
                Readability
              </TabsTrigger>
              <TabsTrigger
                value='clean'
                className='gap-2'
              >
                <Zap className='h-4 w-4' />
                Clean
              </TabsTrigger>
              {hasData && (
                <TabsTrigger
                  value='structured'
                  className='gap-2'
                >
                  <Database className='h-4 w-4' />
                  Data
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className='flex-1'>
            <TabsContent
              value='rendered'
              className='m-0 h-full'
            >
              <RenderedPreview url={currentUrl} />
            </TabsContent>

            <TabsContent
              value='raw-html'
              className='m-0 h-full'
            >
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
                language='html'
              />
            </TabsContent>

            <TabsContent
              value='markdown'
              className='m-0 h-full'
            >
              <CodePreview
                content={`# ACME Widget

**Price:** $19.99

High-quality widget for all your needs.

## Features
- Durable construction
- Easy to use
- 1-year warranty`}
                language='markdown'
              />
            </TabsContent>

            <TabsContent
              value='readability'
              className='m-0 h-full'
            >
              <ReadabilityPreview />
            </TabsContent>

            <TabsContent
              value='clean'
              className='m-0 h-full'
            >
              <CodePreview
                content={`ACME Widget
$19.99
High-quality widget for all your needs.
Features
Durable construction
Easy to use
1-year warranty`}
                language='text'
              />
            </TabsContent>

            {hasData && (
              <TabsContent
                value='structured'
                className='m-0 h-full'
              >
                <StructuredDataPreview />
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Data Table - Only show when we have structured data */}
        {hasData && activeTab !== 'structured' && (
          <div className='border-t border-white/10 bg-[#151517]'>
            <DataTable />
          </div>
        )}
      </div>
    </div>
  )
}

function RenderedPreview({ url }: { url: string }) {
  return (
    <div className='h-full bg-[#151517] p-6'>
      <div className='h-full overflow-hidden rounded-lg bg-white shadow-2xl'>
        <div className='flex h-full items-center justify-center bg-gray-50'>
          <div className='space-y-4 text-center'>
            <Globe className='mx-auto h-16 w-16 text-gray-400' />
            <div className='text-lg font-medium text-gray-600'>Rendered preview of {url}</div>
            <div className='max-w-md text-sm text-gray-500'>
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
    <div className='relative h-full bg-[#0D1117]'>
      <div className='absolute top-4 right-4 z-10'>
        <Button
          variant='ghost'
          size='sm'
          className='bg-white/10 text-white hover:bg-white/20'
        >
          <Copy className='h-4 w-4' />
        </Button>
      </div>
      <ScrollArea className='h-full'>
        <pre className='p-6 font-mono text-sm leading-relaxed text-gray-300'>
          <code>{content}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

function ReadabilityPreview() {
  return (
    <ScrollArea className='h-full bg-[#151517]'>
      <div className='mx-auto max-w-4xl p-8'>
        <article className='prose prose-invert prose-lg max-w-none'>
          <h1 className='mb-6 text-4xl font-bold text-white'>ACME Widget</h1>
          <div className='mb-8 text-3xl font-semibold text-[#3B82F6]'>$19.99</div>
          <p className='mb-8 text-xl leading-relaxed text-gray-300'>
            High-quality widget for all your needs. This premium product combines durability with ease of use,
            making it perfect for both professionals and hobbyists.
          </p>
          <h2 className='mb-6 text-2xl font-semibold text-white'>Features</h2>
          <ul className='space-y-3 text-lg text-gray-300'>
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
    product_name: 'ACME Widget',
    price: 19.99,
    availability: true,
    images: ['https://example.com/widget1.jpg', 'https://example.com/widget2.jpg'],
    description: 'High-quality widget for all your needs.'
  }

  return (
    <div className='h-full bg-[#0D1117] p-6'>
      <div className='rounded-lg border border-white/10 bg-[#151517] p-6 font-mono text-sm'>
        <pre className='leading-relaxed text-gray-300'>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )
}
