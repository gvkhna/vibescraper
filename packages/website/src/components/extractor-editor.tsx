'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Card} from '@/components/ui/card'
import {
  Play,
  RefreshCw,
  Settings,
  Copy,
  Globe,
  Code,
  FileText,
  BookOpen,
  Database,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Clock,
  Zap,
  Download,
  Upload,
  Plus,
  History,
  Calendar,
  Link2,
  FileJson,
  Terminal,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react'
import {cn} from '@/lib/utils'
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable'

// Types
interface PipelineStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped'
  duration?: number
  error?: string
  output?: any
}

interface RunRecord {
  id: string
  timestamp: Date
  status: 'success' | 'error' | 'partial'
  steps: PipelineStep[]
  extractedData?: any
  sourceType: 'fetch' | 'cached'
  url: string
}

interface ProjectUrl {
  id: string
  url: string
  lastFetched?: Date
  status: 'active' | 'error' | 'pending'
  extractionCount: number
}

interface Schema {
  id: string
  version: number
  name: string
  fields: any
  createdAt: Date
  status: 'draft' | 'active' | 'archived'
}

interface Transform {
  id: string
  version: number
  code: string
  createdAt: Date
  status: 'draft' | 'active' | 'archived'
}

export function ExtractorEditor() {
  // State management
  const [currentUrl, setCurrentUrl] = React.useState('https://example.com/products/widget-123')
  const [projectUrls, setProjectUrls] = React.useState<ProjectUrl[]>([
    {
      id: '1',
      url: 'https://example.com/products/widget-123',
      lastFetched: new Date('2025-01-09T10:30:00'),
      status: 'active',
      extractionCount: 15
    },
    {
      id: '2',
      url: 'https://example.com/products/gadget-456',
      lastFetched: new Date('2025-01-09T09:15:00'),
      status: 'active',
      extractionCount: 12
    },
    {
      id: '3',
      url: 'https://example.com/products/tool-789',
      status: 'pending',
      extractionCount: 0
    }
  ])
  
  const [activeTab, setActiveTab] = React.useState('preview')
  const [isRunning, setIsRunning] = React.useState(false)
  const [dataSource, setDataSource] = React.useState<'fetch' | 'cached'>('cached')
  const [showActivationModal, setShowActivationModal] = React.useState(false)
  const [showUrlManager, setShowUrlManager] = React.useState(false)
  
  const [currentPipeline, setCurrentPipeline] = React.useState<PipelineStep[]>([])
  const [runHistory, setRunHistory] = React.useState<RunRecord[]>([])
  const [selectedRun, setSelectedRun] = React.useState<RunRecord | null>(null)
  
  const [cachedHtml, setCachedHtml] = React.useState<string | null>(null)
  const [cleanedHtml, setCleanedHtml] = React.useState<string | null>(null)
  const [markdown, setMarkdown] = React.useState<string | null>(null)
  const [extractedJson, setExtractedJson] = React.useState<any>(null)
  
  const [currentSchema, setCurrentSchema] = React.useState<Schema>({
    id: '1',
    version: 1,
    name: 'product_schema',
    fields: {
      title: {type: 'string', required: true},
      price: {type: 'number', required: true},
      availability: {type: 'boolean', required: true},
      features: {type: 'array', items: {type: 'string'}}
    },
    createdAt: new Date(),
    status: 'draft'
  })
  
  const [currentTransform, setCurrentTransform] = React.useState<Transform>({
    id: '1',
    version: 1,
    code: `export default function extract(html, $) {
  const product = {
    title: $('.product-title').text().trim(),
    price: parseFloat($('.price').text().replace('$', '')),
    availability: $('.in-stock').length > 0,
    features: $('.features li').map((i, el) => $(el).text()).get()
  };
  return product;
}`,
    createdAt: new Date(),
    status: 'draft'
  })

  // Pipeline execution
  const runPipeline = async () => {
    setIsRunning(true)
    const steps: PipelineStep[] = [
      {id: 'fetch', name: 'Fetch HTML', status: 'pending'},
      {id: 'clean', name: 'Clean & Process', status: 'pending'},
      {id: 'extract', name: 'Extract Data', status: 'pending'},
      {id: 'validate', name: 'Validate Schema', status: 'pending'}
    ]
    
    setCurrentPipeline(steps)
    
    // Simulate pipeline execution
    for (let i = 0; i < steps.length; i++) {
      steps[i].status = 'running'
      setCurrentPipeline([...steps])
      
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
      
      // Simulate occasional errors
      if (Math.random() > 0.85 && i === 2) {
        steps[i].status = 'error'
        steps[i].error = 'Failed to extract: Selector not found'
        steps[i].duration = 1200
        // Skip remaining steps
        for (let j = i + 1; j < steps.length; j++) {
          steps[j].status = 'skipped'
        }
        break
      } else {
        steps[i].status = 'success'
        steps[i].duration = 800 + Math.random() * 400
        
        // Set outputs based on step
        if (steps[i].id === 'fetch') {
          const html = `<div class="product">
  <h1 class="product-title">ACME Widget Pro</h1>
  <span class="price">$29.99</span>
  <span class="in-stock">In Stock</span>
  <ul class="features">
    <li>Durable construction</li>
    <li>Easy to use</li>
    <li>1-year warranty</li>
  </ul>
</div>`
          setCachedHtml(html)
          steps[i].output = {size: '2.3 KB', time: '423ms'}
        } else if (steps[i].id === 'clean') {
          const cleaned = `<h1>ACME Widget Pro</h1>
<p>Price: $29.99</p>
<p>In Stock</p>
<ul>
  <li>Durable construction</li>
  <li>Easy to use</li>
  <li>1-year warranty</li>
</ul>`
          setCleanedHtml(cleaned)
          setMarkdown(`# ACME Widget Pro

**Price:** $29.99  
**Availability:** In Stock

## Features
- Durable construction
- Easy to use
- 1-year warranty`)
          steps[i].output = {reduction: '65%', format: 'clean HTML'}
        } else if (steps[i].id === 'extract') {
          const data = {
            title: 'ACME Widget Pro',
            price: 29.99,
            availability: true,
            features: ['Durable construction', 'Easy to use', '1-year warranty']
          }
          setExtractedJson(data)
          steps[i].output = data
        } else if (steps[i].id === 'validate') {
          steps[i].output = {valid: true, errors: []}
        }
      }
      
      setCurrentPipeline([...steps])
    }
    
    // Add to run history
    const run: RunRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      status: steps.some(s => s.status === 'error') ? 'error' : 'success',
      steps: [...steps],
      extractedData: extractedJson,
      sourceType: dataSource,
      url: currentUrl
    }
    
    setRunHistory([run, ...runHistory])
    setIsRunning(false)
  }

  return (
    <div className="flex h-screen flex-col bg-[#0A0A0B]">
      {/* Header Bar */}
      <div className="flex h-14 items-center gap-3 border-b border-white/10 bg-[#151517] px-4">
        <div className="flex flex-1 items-center gap-3">
          <Input
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            className="max-w-md border-white/20 bg-[#0A0A0B] font-mono text-sm"
            placeholder="Enter URL to extract from..."
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUrlManager(true)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Link2 className="mr-2 h-4 w-4" />
            URLs ({projectUrls.length})
          </Button>

          <Select value={dataSource} onValueChange={(v: 'fetch' | 'cached') => setDataSource(v)}>
            <SelectTrigger className="w-40 border-white/20 bg-[#0A0A0B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fetch">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Re-fetch</span>
                </div>
              </SelectItem>
              <SelectItem value="cached">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Use cached</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={runPipeline}
            disabled={isRunning}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            {isRunning ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Pipeline
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowActivationModal(true)}
            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
          >
            <Zap className="mr-2 h-4 w-4" />
            Activate
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/20">
            Schema v{currentSchema.version}
          </Badge>
          <Badge variant="outline" className="border-white/20">
            Transform v{currentTransform.version}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Preview & Pipeline */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col">
            {/* Pipeline Status */}
            {currentPipeline.length > 0 && (
              <div className="border-b border-white/10 bg-[#151517] p-4">
                <div className="space-y-2">
                  {currentPipeline.map((step) => (
                    <PipelineStepComponent key={step.id} step={step} />
                  ))}
                </div>
              </div>
            )}

            {/* Preview Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
              <TabsList className="h-10 rounded-none border-b border-white/10 bg-[#151517]">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="html" className="gap-2">
                  <Code className="h-4 w-4" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="clean" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Clean
                </TabsTrigger>
                <TabsTrigger value="markdown" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Markdown
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-2">
                  <Database className="h-4 w-4" />
                  JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="m-0 flex-1">
                <PreviewPane url={currentUrl} />
              </TabsContent>
              
              <TabsContent value="html" className="m-0 flex-1">
                <CodePane content={cachedHtml || 'No HTML fetched yet. Run the pipeline to fetch.'} language="html" />
              </TabsContent>
              
              <TabsContent value="clean" className="m-0 flex-1">
                <CodePane content={cleanedHtml || 'No cleaned HTML yet. Run the pipeline to process.'} language="html" />
              </TabsContent>
              
              <TabsContent value="markdown" className="m-0 flex-1">
                <CodePane content={markdown || 'No markdown yet. Run the pipeline to convert.'} language="markdown" />
              </TabsContent>
              
              <TabsContent value="json" className="m-0 flex-1">
                <CodePane 
                  content={extractedJson ? JSON.stringify(extractedJson, null, 2) : 'No data extracted yet. Run the pipeline to extract.'} 
                  language="json" 
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - Schema, Transform & History */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Tabs defaultValue="schema" className="flex h-full flex-col">
            <TabsList className="h-10 rounded-none border-b border-white/10 bg-[#151517]">
              <TabsTrigger value="schema" className="gap-2">
                <FileJson className="h-4 w-4" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="transform" className="gap-2">
                <Terminal className="h-4 w-4" />
                Transform
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="assistant" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schema" className="m-0 flex-1 overflow-hidden">
              <SchemaEditor schema={currentSchema} onChange={setCurrentSchema} />
            </TabsContent>

            <TabsContent value="transform" className="m-0 flex-1 overflow-hidden">
              <TransformEditor transform={currentTransform} onChange={setCurrentTransform} />
            </TabsContent>

            <TabsContent value="history" className="m-0 flex-1 overflow-hidden">
              <RunHistory 
                runs={runHistory} 
                selectedRun={selectedRun}
                onSelectRun={setSelectedRun}
              />
            </TabsContent>

            <TabsContent value="assistant" className="m-0 flex-1 overflow-hidden">
              <AIAssistant 
                schema={currentSchema}
                transform={currentTransform}
                onUpdateSchema={setCurrentSchema}
                onUpdateTransform={setCurrentTransform}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Activation Modal */}
      <ActivationModal 
        open={showActivationModal}
        onOpenChange={setShowActivationModal}
        onActivate={(config) => {
          console.log('Activating with config:', config)
          setShowActivationModal(false)
        }}
      />

      {/* URL Manager Modal */}
      <UrlManagerModal
        open={showUrlManager}
        onOpenChange={setShowUrlManager}
        urls={projectUrls}
        onUpdateUrls={setProjectUrls}
        currentUrl={currentUrl}
        onSelectUrl={setCurrentUrl}
      />
    </div>
  )
}

// Pipeline Step Component
function PipelineStepComponent({step}: {step: PipelineStep}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">
        {step.status === 'pending' && <div className="h-2 w-2 rounded-full bg-gray-400" />}
        {step.status === 'running' && <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />}
        {step.status === 'success' && <Check className="h-4 w-4 text-green-400" />}
        {step.status === 'error' && <X className="h-4 w-4 text-red-400" />}
        {step.status === 'skipped' && <ChevronRight className="h-4 w-4 text-gray-500" />}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            step.status === 'error' && "text-red-400",
            step.status === 'success' && "text-green-400",
            step.status === 'running' && "text-blue-400",
            step.status === 'skipped' && "text-gray-500"
          )}>
            {step.name}
          </span>
          {step.duration && (
            <span className="text-xs text-gray-500">{step.duration}ms</span>
          )}
        </div>
        {step.error && (
          <div className="mt-1 text-xs text-red-400">{step.error}</div>
        )}
        {step.output && step.id === 'validate' && (
          <div className="mt-1 text-xs text-gray-400">
            {step.output.valid ? '✓ Schema valid' : `${step.output.errors.length} validation errors`}
          </div>
        )}
      </div>
    </div>
  )
}

// Preview Pane
function PreviewPane({url}: {url: string}) {
  return (
    <div className="h-full bg-white p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-3xl font-bold">ACME Widget Pro</h1>
          <div className="mb-4 text-2xl font-semibold text-green-600">$29.99</div>
          <div className="mb-4">
            <Badge className="bg-green-100 text-green-800">In Stock</Badge>
          </div>
          <div className="mb-6 text-gray-600">
            High-quality widget for all your professional needs. Built to last with premium materials.
          </div>
          <div className="border-t pt-4">
            <h3 className="mb-2 font-semibold">Features:</h3>
            <ul className="list-disc space-y-1 pl-5 text-gray-600">
              <li>Durable construction</li>
              <li>Easy to use</li>
              <li>1-year warranty</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          Preview of: {url}
        </div>
      </div>
    </div>
  )
}

// Code Pane
function CodePane({content, language}: {content: string; language: string}) {
  return (
    <ScrollArea className="h-full bg-[#0D1117]">
      <pre className="p-4 font-mono text-sm text-gray-300">
        <code>{content}</code>
      </pre>
    </ScrollArea>
  )
}

// Schema Editor
function SchemaEditor({schema, onChange}: {schema: Schema; onChange: (s: Schema) => void}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 bg-[#151517] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              value={schema.name}
              onChange={(e) => onChange({...schema, name: e.target.value})}
              className="h-8 w-40 border-white/20 bg-[#0A0A0B]"
            />
            <Badge variant="outline" className="border-white/20">
              v{schema.version}
            </Badge>
          </div>
          <Button size="sm" variant="outline" className="border-white/20">
            <Upload className="mr-2 h-3 w-3" />
            Import
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <Textarea
          value={JSON.stringify(schema.fields, null, 2)}
          onChange={(e) => {
            try {
              const fields = JSON.parse(e.target.value)
              onChange({...schema, fields})
            } catch {}
          }}
          className="min-h-[400px] border-white/20 bg-[#0D1117] font-mono text-sm"
          placeholder="Define your JSON schema..."
        />
      </ScrollArea>
      
      <div className="border-t border-white/10 bg-[#151517] p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {Object.keys(schema.fields).length} fields defined
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-white/20">
              Test
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Save Version
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Transform Editor
function TransformEditor({transform, onChange}: {transform: Transform; onChange: (t: Transform) => void}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 bg-[#151517] p-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-white/20">
            Transform v{transform.version}
          </Badge>
          <Button size="sm" variant="outline" className="border-white/20">
            <Terminal className="mr-2 h-3 w-3" />
            Test Runner
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <Textarea
          value={transform.code}
          onChange={(e) => onChange({...transform, code: e.target.value})}
          className="min-h-[400px] border-white/20 bg-[#0D1117] font-mono text-sm"
          placeholder="Write your extraction function..."
        />
      </ScrollArea>
      
      <div className="border-t border-white/10 bg-[#151517] p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            JavaScript extraction function
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-white/20">
              Debug
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Save Version
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Run History
function RunHistory({
  runs,
  selectedRun,
  onSelectRun
}: {
  runs: RunRecord[]
  selectedRun: RunRecord | null
  onSelectRun: (run: RunRecord | null) => void
}) {
  return (
    <div className="flex h-full">
      {/* Run List */}
      <div className="w-64 border-r border-white/10">
        <ScrollArea className="h-full">
          <div className="p-2">
            {runs.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No runs yet. Click "Run Pipeline" to start.
              </div>
            ) : (
              runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => onSelectRun(run)}
                  className={cn(
                    "mb-2 w-full rounded-lg border p-3 text-left transition-colors",
                    selectedRun?.id === run.id
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/10 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {run.status === 'success' && <Check className="h-4 w-4 text-green-400" />}
                      {run.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                      {run.status === 'partial' && <AlertCircle className="h-4 w-4 text-yellow-400" />}
                      <span className="text-sm font-medium">
                        {run.sourceType === 'fetch' ? 'Fresh' : 'Cached'}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-white/20 text-xs">
                      {run.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(run.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Run Details */}
      <div className="flex-1">
        {selectedRun ? (
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">Pipeline Steps</h3>
                <div className="space-y-2">
                  {selectedRun.steps.map((step) => (
                    <PipelineStepComponent key={step.id} step={step} />
                  ))}
                </div>
              </div>

              {selectedRun.extractedData && (
                <div>
                  <h3 className="mb-2 font-medium">Extracted Data</h3>
                  <pre className="rounded-lg border border-white/10 bg-[#0D1117] p-3 text-sm">
                    <code>{JSON.stringify(selectedRun.extractedData, null, 2)}</code>
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-white/20">
                  <Copy className="mr-2 h-3 w-3" />
                  Copy Data
                </Button>
                <Button size="sm" variant="outline" className="border-white/20">
                  <Download className="mr-2 h-3 w-3" />
                  Export
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Select a run to view details
          </div>
        )}
      </div>
    </div>
  )
}

// AI Assistant
function AIAssistant({
  schema,
  transform,
  onUpdateSchema,
  onUpdateTransform
}: {
  schema: Schema
  transform: Transform
  onUpdateSchema: (s: Schema) => void
  onUpdateTransform: (t: Transform) => void
}) {
  const [messages, setMessages] = React.useState([
    {
      role: 'assistant',
      content: 'I can help you build extraction schemas and transform functions. What data would you like to extract?'
    }
  ])
  const [input, setInput] = React.useState('')

  const sendMessage = () => {
    if (!input.trim()) return
    
    setMessages([...messages, {role: 'user', content: input}])
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've analyzed your request. Here's a suggested schema update for extracting "${input}". Would you like me to update the transform function as well?`
      }])
    }, 1000)
    
    setInput('')
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg p-3",
                msg.role === 'user'
                  ? "ml-auto max-w-[80%] bg-blue-600/20 text-blue-100"
                  : "mr-auto max-w-[80%] bg-white/5"
              )}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Describe what data you want to extract..."
            className="min-h-[60px] border-white/20 bg-[#0D1117]"
          />
          <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
            Send
          </Button>
        </div>
        
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline" className="border-white/20 text-xs">
            Suggest schema from HTML
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 text-xs">
            Fix validation errors
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 text-xs">
            Optimize transform
          </Button>
        </div>
      </div>
    </div>
  )
}

// Activation Modal
function ActivationModal({
  open,
  onOpenChange,
  onActivate
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onActivate: (config: any) => void
}) {
  const [schedule, setSchedule] = React.useState('daily')
  const [followLinks, setFollowLinks] = React.useState(false)
  const [maxDepth, setMaxDepth] = React.useState('3')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-[#151517]">
        <DialogHeader>
          <DialogTitle className="text-white">Activate Extraction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Schedule</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="mt-2 border-white/20 bg-[#0A0A0B]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual only</SelectItem>
                <SelectItem value="hourly">Every hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="follow-links">Follow links</Label>
            <Switch
              id="follow-links"
              checked={followLinks}
              onCheckedChange={setFollowLinks}
            />
          </div>

          {followLinks && (
            <>
              <div>
                <Label>Max depth</Label>
                <Select value={maxDepth} onValueChange={setMaxDepth}>
                  <SelectTrigger className="mt-2 border-white/20 bg-[#0A0A0B]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Path pattern (optional)</Label>
                <Input
                  className="mt-2 border-white/20 bg-[#0A0A0B] font-mono"
                  placeholder="/products/*"
                />
              </div>
            </>
          )}

          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <div className="text-sm text-green-400">
              ✓ Your extractor will be activated and start collecting data
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/20">
            Cancel
          </Button>
          <Button
            onClick={() => onActivate({schedule, followLinks, maxDepth})}
            className="bg-green-600 hover:bg-green-700"
          >
            <Zap className="mr-2 h-4 w-4" />
            Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// URL Manager Modal
function UrlManagerModal({
  open,
  onOpenChange,
  urls,
  onUpdateUrls,
  currentUrl,
  onSelectUrl
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  urls: ProjectUrl[]
  onUpdateUrls: (urls: ProjectUrl[]) => void
  currentUrl: string
  onSelectUrl: (url: string) => void
}) {
  const [newUrl, setNewUrl] = React.useState('')

  const addUrl = () => {
    if (!newUrl.trim()) return
    
    const url: ProjectUrl = {
      id: Date.now().toString(),
      url: newUrl,
      status: 'pending',
      extractionCount: 0
    }
    
    onUpdateUrls([...urls, url])
    setNewUrl('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/10 bg-[#151517]">
        <DialogHeader>
          <DialogTitle className="text-white">Manage URLs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="border-white/20 bg-[#0A0A0B]"
              placeholder="https://example.com/page"
            />
            <Button onClick={addUrl} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add URL
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-lg border border-white/10">
            <div className="p-2">
              {urls.map((url) => (
                <div
                  key={url.id}
                  className={cn(
                    "mb-2 flex items-center justify-between rounded-lg border p-3",
                    currentUrl === url.url
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/10 hover:bg-white/5"
                  )}
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm">{url.url}</div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      {url.lastFetched && (
                        <span>Last: {new Date(url.lastFetched).toLocaleString()}</span>
                      )}
                      <span>{url.extractionCount} extractions</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-white/20",
                        url.status === 'active' && "border-green-500/50 text-green-400",
                        url.status === 'error' && "border-red-500/50 text-red-400"
                      )}
                    >
                      {url.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectUrl(url.url)}
                      className="text-white hover:bg-white/10"
                    >
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/20">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}