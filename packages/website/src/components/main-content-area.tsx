'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {ScrollArea} from '@/components/ui/scroll-area'
import {
  Play,
  RefreshCw,
  Settings,
  Copy,
  Globe,
  Code,
  FileText,
  BookOpen,
  Zap,
  Database,
  ChevronDown,
  PanelLeftOpen,
  PanelRightOpen,
  PanelRightClose,
  PanelBottomOpen
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {nowait} from '@/lib/async-utils'

interface MainContentAreaProps {
  currentUrl: string
  onUrlChange: (url: string) => void
  onToggleSchemaPanel: () => void
  onToggleAIPanel: () => void
  onToggleDataPanel: () => void
  showSchemaPanel: boolean
  showAIPanel: boolean
  showDataPanel: boolean
}

export function MainContentArea({
  currentUrl,
  onUrlChange,
  onToggleSchemaPanel,
  onToggleAIPanel,
  onToggleDataPanel,
  showSchemaPanel,
  showAIPanel,
  showDataPanel
}: MainContentAreaProps) {
  const [activeTab, setActiveTab] = React.useState('rendered')
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasData, setHasData] = React.useState(true)

  const handleScrape = async () => {
    setIsLoading(true)
    // Simulate scraping
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setHasData(true)
  }

  return (
    <div className='flex h-full flex-col bg-[#0A0A0B]'>
      {/* Toolbar */}
      <div className='flex h-12 flex-shrink-0 items-center gap-3 border-b border-white/10 bg-[#151517] px-4'>
        {/* Panel toggles */}
        <div className='flex items-center gap-1'>
          {!showSchemaPanel && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onToggleSchemaPanel}
              className='text-white/60 hover:bg-white/10 hover:text-white'
            >
              <PanelLeftOpen className='h-4 w-4' />
            </Button>
          )}
          {!showDataPanel && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onToggleDataPanel}
              className='text-white/60 hover:bg-white/10 hover:text-white'
            >
              <PanelBottomOpen className='h-4 w-4' />
            </Button>
          )}
          {/* AI Panel toggle moved to the right side of toolbar */}
        </div>

        {/* URL and controls */}
        <div className='flex flex-1 items-center gap-3'>
          <Input
            value={currentUrl}
            onChange={(e) => {
              onUrlChange(e.target.value)
            }}
            className='max-w-md border-white/20 bg-[#0A0A0B] font-mono text-sm'
            placeholder='Enter URL to scrape...'
          />

          <Button
            onClick={() => {
              nowait(handleScrape())
            }}
            disabled={isLoading}
            size='sm'
            className='bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
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
                Options
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='border-white/10 bg-[#1a1a1b]'>
              <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Simple Fetch</DropdownMenuItem>
              <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Headless Browser</DropdownMenuItem>
              <DropdownMenuItem className='text-white/90 hover:bg-white/10 focus:bg-white/10'>Stealth Mode</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status and AI Assistant toggle */}
        <div className='ml-auto flex items-center gap-2'>
          <Badge className='border-[#10B981]/30 bg-[#10B981]/20 text-[#10B981]'>Ready</Badge>
          <Button
            variant='ghost'
            size='sm'
            onClick={onToggleAIPanel}
            className='text-white/60 hover:bg-white/10 hover:text-white'
          >
            {showAIPanel ? (
              <PanelRightClose className='h-4 w-4' />
            ) : (
              <PanelRightOpen className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='flex flex-1 flex-col'
      >
        <div className='border-b border-white/10 bg-[#151517] px-4'>
          <TabsList className='h-10 bg-transparent'>
            <TabsTrigger
              value='rendered'
              className='gap-2 text-sm'
            >
              <Globe className='h-4 w-4' />
              Rendered
            </TabsTrigger>
            <TabsTrigger
              value='raw-html'
              className='gap-2 text-sm'
            >
              <Code className='h-4 w-4' />
              HTML
            </TabsTrigger>
            <TabsTrigger
              value='markdown'
              className='gap-2 text-sm'
            >
              <FileText className='h-4 w-4' />
              Markdown
            </TabsTrigger>
            <TabsTrigger
              value='readability'
              className='gap-2 text-sm'
            >
              <BookOpen className='h-4 w-4' />
              Clean
            </TabsTrigger>
            <TabsTrigger
              value='json'
              className='gap-2 text-sm'
            >
              <Database className='h-4 w-4' />
              JSON
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className='flex-1 overflow-hidden'>
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
    <div class="features">
      <ul>
        <li>Durable construction</li>
        <li>Easy to use</li>
        <li>1-year warranty</li>
      </ul>
    </div>
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
            value='json'
            className='m-0 h-full'
          >
            <CodePreview
              content={`{
  "product_name": "ACME Widget",
  "price": 19.99,
  "availability": true,
  "features": [
    "Durable construction",
    "Easy to use",
    "1-year warranty"
  ],
  "description": "High-quality widget for all your needs."
}`}
              language='json'
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function RenderedPreview({url}: {url: string}) {
  return (
    <div className='h-full p-4'>
      <div className='h-full overflow-hidden rounded-lg bg-white shadow-lg'>
        <div className='flex h-full items-center justify-center bg-gray-50'>
          <div className='space-y-4 p-8 text-center'>
            <Globe className='mx-auto h-16 w-16 text-gray-400' />
            <div className='text-lg font-medium text-gray-700'>Rendered Preview</div>
            <div className='max-w-md text-sm text-gray-500'>{url}</div>
            <div className='text-xs text-gray-400'>
              This would show the actual webpage content as it appears in a browser
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodePreview({content, language}: {content: string; language: string}) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    nowait(globalThis.navigator.clipboard.writeText(content))
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className='relative h-full bg-[#0D1117]'>
      <div className='absolute right-4 top-4 z-10'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCopy}
          className='bg-white/10 text-white hover:bg-white/20'
        >
          <Copy className='h-4 w-4' />
          {copied && <span className='ml-2 text-xs'>Copied!</span>}
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
