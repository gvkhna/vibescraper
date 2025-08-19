'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {Badge} from '@/components/ui/badge'
import {
  Play,
  Settings,
  Copy,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ChevronDown,
  Globe,
  Code,
  FileText,
  BookOpen,
  Zap,
  Database
} from 'lucide-react'
import {DataTable} from '@/components/data-table'
import {nowait} from '@/lib/async-utils'

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
  const [activeTab, setActiveTab] = React.useState('rendered')
  const [hasStructuredData, setHasStructuredData] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleScrape = async () => {
    setIsLoading(true)
    // Simulate scraping
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasStructuredData(true)
  }

  return (
    <div
      className='flex flex-1 flex-col overflow-hidden'
      style={{marginRight: sidebarWidth}}
    >
      {/* Action Bar */}
      <div
        className='flex h-14 items-center gap-3 border-b border-white/10 bg-[rgba(21,21,23,0.5)] px-4
          backdrop-blur-sm'
      >
        <div className='flex flex-1 items-center gap-3'>
          <Input
            value={currentUrl}
            onChange={(e) => {
              onUrlChange(e.target.value)
            }}
            className='border-white/10 bg-white/5 font-mono text-sm'
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

          <CrawlSettingsDropdown />
        </div>

        <div className='flex items-center gap-2'>
          <Badge
            variant='secondary'
            className='border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]'
          >
            Last: 2m ago
          </Badge>
          <StatusBadge status='success' />
        </div>
      </div>

      {/* Preview Tabs */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='flex flex-1 flex-col'
        >
          <div className='border-b border-white/10 bg-[rgba(21,21,23,0.3)]'>
            <TabsList className='h-12 bg-transparent px-4'>
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
                value='deep-clean'
                className='gap-2'
              >
                <Zap className='h-4 w-4' />
                Deep Clean
              </TabsTrigger>
              {hasStructuredData && (
                <TabsTrigger
                  value='structured'
                  className='gap-2'
                >
                  <Database className='h-4 w-4' />
                  Structured Data
                </TabsTrigger>
              )}
            </TabsList>
          </div>

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
              value='deep-clean'
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

            {hasStructuredData && (
              <TabsContent
                value='structured'
                className='m-0 h-full'
              >
                <StructuredDataPreview />
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Data Table */}
        {hasStructuredData && (
          <div className='border-t border-white/10'>
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
        <Button
          variant='ghost'
          size='sm'
          className='text-white hover:bg-white/10'
        >
          <Settings className='mr-2 h-4 w-4' />
          Settings
          <ChevronDown className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64'>
        <div className='space-y-3 p-3'>
          <div>
            <div className='mb-2 text-sm font-medium'>Browser Type</div>
            <div className='space-y-1'>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='radio'
                  name='browser'
                  defaultChecked
                />
                Fetch (fastest)
              </label>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='radio'
                  name='browser'
                />
                Headless Browser
              </label>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='radio'
                  name='browser'
                />
                Stealth Browser
              </label>
            </div>
          </div>

          <div>
            <div className='mb-2 text-sm font-medium'>Wait for selector</div>
            <Input
              placeholder='.product-list'
              className='h-8 border-white/10 bg-white/5 font-mono text-sm'
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StatusBadge({status}: {status: 'success' | 'error' | 'loading'}) {
  const variants = {
    success: {color: 'text-[#10B981]', bg: 'bg-[#10B981]/20', border: 'border-[#10B981]/30'},
    error: {color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400/30'},
    loading: {color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/20', border: 'border-[#F59E0B]/30'}
  }

  const variant = variants[status]

  return (
    <Badge className={`${variant.bg} ${variant.color} ${variant.border}`}>
      {status === 'success' && 'Success'}
      {status === 'error' && 'Error'}
      {status === 'loading' && 'Loading'}
    </Badge>
  )
}

function RenderedPreview({url}: {url: string}) {
  return (
    <div className='m-4 h-full overflow-hidden rounded-lg border border-white/10 bg-white/5'>
      <div className='flex h-full items-center justify-center'>
        <div className='space-y-4 text-center'>
          <Globe className='mx-auto h-12 w-12 text-white/40' />
          <div className='text-white/60'>Rendered preview of {url}</div>
          <div className='text-sm text-white/40'>This would show the actual webpage content</div>
        </div>
      </div>
    </div>
  )
}

function CodePreview({content, language}: {content: string; language: string}) {
  return (
    <div className='relative h-full'>
      <div className='absolute right-4 top-4 z-10'>
        <Button
          variant='ghost'
          size='sm'
          className='bg-white/10 hover:bg-white/20'
        >
          <Copy className='h-4 w-4' />
        </Button>
      </div>
      <pre className='h-full overflow-auto bg-[#0D1117] p-4 font-mono text-sm'>
        <code className='text-white/90'>{content}</code>
      </pre>
    </div>
  )
}

function ReadabilityPreview() {
  return (
    <div className='h-full overflow-auto bg-white/5 p-6'>
      <article className='prose prose-invert mx-auto max-w-3xl'>
        <h1 className='mb-4 text-3xl font-bold'>ACME Widget</h1>
        <div className='mb-6 text-2xl font-semibold text-[#3B82F6]'>$19.99</div>
        <p className='mb-6 text-lg leading-relaxed'>
          High-quality widget for all your needs. This premium product combines durability with ease of use,
          making it perfect for both professionals and hobbyists.
        </p>
        <h2 className='mb-4 text-xl font-semibold'>Features</h2>
        <ul className='space-y-2'>
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
    product_name: 'ACME Widget',
    price: 19.99,
    availability: true,
    images: ['https://example.com/widget1.jpg', 'https://example.com/widget2.jpg'],
    description: 'High-quality widget for all your needs.'
  }

  return (
    <div className='h-full overflow-auto p-4'>
      <div className='rounded-lg bg-[#0D1117] p-4 font-mono text-sm'>
        <pre className='text-white/90'>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )
}
