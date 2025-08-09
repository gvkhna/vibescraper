'use client'

import * as React from 'react'
import {Button} from '@/components/ui/button'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Checkbox} from '@/components/ui/checkbox'
import {Slider} from '@/components/ui/slider'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import {MoreHorizontal, Play, Settings, Globe, Code2, Database, LineChart, KeyRound} from 'lucide-react'
import {StatusBadge} from '@/components/status-badge'
import {QuickStats, GlassCard} from '@/components/quick-stats'
// import { useToast } from "@/hooks/use-toast"
import {cn} from '@/lib/utils'
import {TopBar} from '@/components/top-bar'
import {WorkspaceLayout} from '@/components/workspace-layout'
import {NewSiteModal} from '@/components/new-site-modal'
// import { Toaster } from "@/components/ui/toaster"

export default function WebCrawlerStudio() {
  const [showNewSiteModal, setShowNewSiteModal] = React.useState(false)
  const [currentUrl, setCurrentUrl] = React.useState('https://example.com/products')
  const [siteName, setSiteName] = React.useState('Example Store')

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-[#0A0A0B] text-white'>
      {/* Top Bar */}
      <TopBar
        siteName={siteName}
        onNewSite={() => {
          setShowNewSiteModal(true)
        }}
      />

      {/* Main Content */}
      <WorkspaceLayout
        currentUrl={currentUrl}
        onUrlChange={setCurrentUrl}
      />

      {/* Modals */}
      <NewSiteModal
        isOpen={showNewSiteModal}
        onClose={() => {
          setShowNewSiteModal(false)
        }}
        onSiteCreated={(url, name) => {
          setCurrentUrl(url)
          setSiteName(name)
          setShowNewSiteModal(false)
        }}
      />

      {/* <Toaster /> */}
    </div>
  )
}

function ProjectHeader({
  name,
  onNameChange,
  onRun
}: {
  name: string
  onNameChange: (v: string) => void
  onRun: () => void
}) {
  return (
    <GlassCard className='p-5'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='min-w-0'>
          <input
            value={name}
            onChange={(e) => {
              onNameChange(e.target.value)
            }}
            className={cn(
              'w-full border-none bg-transparent text-2xl font-semibold outline-none md:text-3xl',
              'focus-visible:ring-0'
            )}
            aria-label='Project Name'
          />
          <div className='mt-2 flex items-center gap-2'>
            <StatusBadge status='ready' />
            <Badge className='bg-white/10'>v3 Schema</Badge>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            className='bg-[#3B82F6] shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:bg-[#3B82F6]/80'
            onClick={onRun}
          >
            <Play className='mr-2 h-4 w-4' />
            Run Now
          </Button>
          <Button
            variant='secondary'
            className='border-white/10 bg-white/10 hover:bg-white/20'
          >
            <Settings className='mr-2 h-4 w-4' />
            Configure
          </Button>
          <Button
            variant='secondary'
            className='border-white/10 bg-white/10 hover:bg-white/20'
          >
            <KeyRound className='mr-2 h-4 w-4' />
            View API
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='hover:bg-white/10'
                aria-label='More actions'
              >
                <MoreHorizontal className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem className='cursor-pointer'>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer'>Archive</DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-red-400'>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </GlassCard>
  )
}

function CrawlerConfig() {
  return (
    <div className='space-y-4'>
      {/* Target URLs */}
      <GlassCard className='p-5'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='font-medium'>Target URLs</div>
        </div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
          <div className='md:col-span-3'>
            <Input
              placeholder='https://example.com/products'
              className='border-white/10 bg-white/5'
            />
          </div>
          <div className='md:col-span-1'>
            <Button className='w-full bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Add URL</Button>
          </div>
        </div>
        <div className='mt-4 overflow-auto'>
          <Table>
            <TableHeader className='sticky top-0 border-white/10 bg-white/5 backdrop-blur'>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox aria-label='Select all' />
                </TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Crawled</TableHead>
                <TableHead className='w-24'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {url: 'https://example.com/products', status: 'OK', last: 'Today 11:20'},
                {url: 'https://example.com/blog', status: '429', last: 'Today 10:10'}
              ].map((r, idx) => (
                <TableRow
                  key={idx}
                  className='hover:bg-[#3B82F6]/10'
                >
                  <TableCell>
                    <Checkbox aria-label={`Select ${r.url}`} />
                  </TableCell>
                  <TableCell className='font-mono'>{r.url}</TableCell>
                  <TableCell>
                    {r.status === 'OK' ? (
                      <span className='text-[#10B981]'>Success</span>
                    ) : (
                      <span className='text-red-400'>Error {r.status}</span>
                    )}
                  </TableCell>
                  <TableCell>{r.last}</TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
                      >
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
                      >
                        Test
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='h-8'
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <details className='mt-4'>
          <summary className='cursor-pointer text-white/80'>Crawling Rules</summary>
          <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='flex items-center gap-2'>
              <Switch id='follow-links' />
              <Label htmlFor='follow-links'>Follow links</Label>
            </div>
            <div className='grid grid-cols-3 items-center gap-2'>
              <Label>Max depth</Label>
              <Select defaultValue='3'>
                <SelectTrigger className='border-white/10 bg-white/5'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 10}, (_, i) => String(i + 1)).map((d) => (
                    <SelectItem
                      key={d}
                      value={d}
                    >
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='md:col-span-1'>
              <Label>Include (regex)</Label>
              <Input
                className='border-white/10 bg-white/5 font-mono'
                placeholder='^/products/.*'
              />
            </div>
            <div className='md:col-span-1'>
              <Label>Exclude (regex)</Label>
              <Input
                className='border-white/10 bg-white/5 font-mono'
                placeholder='\\?sort=|\\?page='
              />
            </div>
            <div className='flex items-center gap-2'>
              <Switch id='robots' />
              <Label htmlFor='robots'>Respect robots.txt</Label>
            </div>
          </div>
        </details>
      </GlassCard>

      {/* Browser Settings */}
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Browser Settings</div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <RadioCard
            label='Simple Fetch'
            desc='Fastest, no JS'
            defaultChecked
          />
          <RadioCard
            label='Headless Browser'
            desc='Renders JS'
          />
          <RadioCard
            label='Stealth Browser'
            desc='Anti-detection'
          />
        </div>
        <details className='mt-4'>
          <summary className='cursor-pointer text-white/80'>Advanced Settings</summary>
          <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <Label>User Agent</Label>
              <Select defaultValue='auto'>
                <SelectTrigger className='border-white/10 bg-white/5'>
                  <SelectValue placeholder='Auto' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='auto'>Auto</SelectItem>
                  <SelectItem value='chrome'>Chrome</SelectItem>
                  <SelectItem value='firefox'>Firefox</SelectItem>
                  <SelectItem value='custom'>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Viewport (WxH)</Label>
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  placeholder='1366'
                  className='border-white/10 bg-white/5'
                />
                <Input
                  placeholder='768'
                  className='border-white/10 bg-white/5'
                />
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='js-enabled'
                defaultChecked
              />
              <Label htmlFor='js-enabled'>JavaScript enabled</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch id='cookies' />
              <Label htmlFor='cookies'>Cookies enabled</Label>
            </div>
            <div>
              <Label>Wait for selector</Label>
              <Input
                placeholder='.product-list'
                className='border-white/10 bg-white/5 font-mono'
              />
            </div>
            <div>
              <Label>Page load timeout (s)</Label>
              <Input
                placeholder='30'
                className='border-white/10 bg-white/5'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Switch id='screenshot' />
              <Label htmlFor='screenshot'>Screenshot on crawl</Label>
            </div>
          </div>
        </details>
      </GlassCard>

      {/* Proxy Settings */}
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Proxy Settings</div>
        <div className='mb-3 flex items-center gap-2'>
          <Switch id='use-proxies' />
          <Label htmlFor='use-proxies'>Use Proxies</Label>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div>
            <Label>Proxy Type</Label>
            <Select defaultValue='http'>
              <SelectTrigger className='border-white/10 bg-white/5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='http'>HTTP</SelectItem>
                <SelectItem value='socks5'>SOCKS5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='md:col-span-2'>
            <Label>Proxy List (host:port or user:pass@host:port)</Label>
            <Textarea
              className='border-white/10 bg-white/5 font-mono'
              rows={4}
              placeholder='proxy1:8080&#10;user:pass@proxy2:1080'
            />
          </div>
          <div>
            <Label>Rotation Strategy</Label>
            <Select defaultValue='per-request'>
              <SelectTrigger className='border-white/10 bg-white/5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='per-request'>Per request</SelectItem>
                <SelectItem value='sticky'>Sticky session</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-end'>
            <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Test Proxies</Button>
          </div>
        </div>
      </GlassCard>

      {/* Performance */}
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Performance</div>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <div>
            <Label>Concurrent Workers</Label>
            <Slider
              defaultValue={[8]}
              min={1}
              max={20}
              step={1}
              className='mt-3'
            />
          </div>
          <div>
            <Label>Request Delay (ms)</Label>
            <Input
              className='mt-2 border-white/10 bg-white/5'
              placeholder='250'
            />
          </div>
          <div>
            <Label>Rate Limit (req/min)</Label>
            <Input
              className='mt-2 border-white/10 bg-white/5'
              placeholder='120'
            />
          </div>
          <div className='flex items-center gap-2'>
            <Switch
              id='retry'
              defaultChecked
            />
            <Label htmlFor='retry'>Retry Failed Requests</Label>
          </div>
          <div>
            <Label>Max retries</Label>
            <Input
              className='mt-2 border-white/10 bg-white/5'
              placeholder='3'
            />
          </div>
          <div>
            <Label>Retry delay</Label>
            <Select defaultValue='exponential'>
              <SelectTrigger className='mt-2 border-white/10 bg-white/5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='fixed'>Fixed</SelectItem>
                <SelectItem value='exponential'>Exponential backoff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Schedule */}
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Schedule</div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div>
            <Label>Run Type</Label>
            <div className='mt-2 grid grid-cols-3 gap-2'>
              <Button
                className='border-white/10 bg-white/10 hover:bg-white/20'
                variant='secondary'
              >
                Manual
              </Button>
              <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Scheduled</Button>
              <Button
                className='border-white/10 bg-white/10 hover:bg-white/20'
                variant='secondary'
              >
                Real-time
              </Button>
            </div>
          </div>
          <div>
            <Label>Frequency</Label>
            <Select defaultValue='daily'>
              <SelectTrigger className='mt-2 border-white/10 bg-white/5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='hourly'>Hourly</SelectItem>
                <SelectItem value='daily'>Daily</SelectItem>
                <SelectItem value='weekly'>Weekly</SelectItem>
                <SelectItem value='monthly'>Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time</Label>
            <Input
              type='time'
              className='mt-2 border-white/10 bg-white/5'
              defaultValue='09:00'
            />
          </div>
          <div>
            <Label>Timezone</Label>
            <Select defaultValue='UTC'>
              <SelectTrigger className='mt-2 border-white/10 bg-white/5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='UTC'>UTC</SelectItem>
                <SelectItem value='PST'>PST</SelectItem>
                <SelectItem value='EST'>EST</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='md:col-span-2'>
            <Label>Active Days</Label>
            <div className='mt-2 grid grid-cols-7 gap-2'>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Button
                  key={i}
                  variant='secondary'
                  className='border-white/10 bg-white/10 hover:bg-white/20'
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function RadioCard({label, desc, defaultChecked}: {label: string; desc: string; defaultChecked?: boolean}) {
  const [checked, setChecked] = React.useState(!!defaultChecked)
  return (
    <button
      type='button'
      onClick={() => {
        setChecked(true)
      }}
      className={cn(
        'rounded-lg border p-3 text-left transition',
        checked ? 'border-[#3B82F6] bg-[#3B82F6]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
      )}
    >
      <div className='font-medium'>{label}</div>
      <div className='text-sm text-white/60'>{desc}</div>
    </button>
  )
}

function DataSchemaEditor() {
  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      {/* Left: Schema Definition */}
      <GlassCard className='p-5'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div className='md:col-span-2'>
            <Label>Schema Name</Label>
            <Input
              className='border-white/10 bg-white/5'
              defaultValue='product_schema'
            />
          </div>
          <div>
            <Label>Version</Label>
            <Input
              className='border-white/10 bg-white/5'
              defaultValue='3'
              readOnly
            />
          </div>
        </div>

        <div className='mt-5 space-y-4'>
          {[
            {name: 'title', type: 'string', required: true},
            {name: 'price', type: 'number', required: true}
          ].map((f, i) => (
            <div
              key={i}
              className='rounded-lg border border-white/10 bg-white/5 p-4'
            >
              <div className='grid grid-cols-1 gap-3 md:grid-cols-5'>
                <div className='md:col-span-2'>
                  <Label>Field name</Label>
                  <Input
                    className='border-white/10 bg-white/5 font-mono'
                    defaultValue={f.name}
                  />
                </div>
                <div className='md:col-span-2'>
                  <Label>Field type</Label>
                  <Select defaultValue={f.type}>
                    <SelectTrigger className='border-white/10 bg-white/5'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['string', 'number', 'boolean', 'date', 'array', 'object'].map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex items-end gap-2'>
                  <Switch
                    id={`req-${i}`}
                    defaultChecked={f.required}
                  />
                  <Label htmlFor={`req-${i}`}>Required</Label>
                </div>
              </div>
              <div className='mt-3'>
                <details>
                  <summary className='cursor-pointer text-white/80'>Validation rules</summary>
                  <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
                    <div>
                      <Label>Min length/value</Label>
                      <Input
                        className='border-white/10 bg-white/5'
                        placeholder='0'
                      />
                    </div>
                    <div>
                      <Label>Max length/value</Label>
                      <Input
                        className='border-white/10 bg-white/5'
                        placeholder='255'
                      />
                    </div>
                    <div>
                      <Label>Regex</Label>
                      <Input
                        className='border-white/10 bg-white/5 font-mono'
                        placeholder='^\\d+(\\.\\d{2})?$'
                      />
                    </div>
                    <div className='md:col-span-3'>
                      <Label>Custom validation function</Label>
                      <Textarea
                        className='border-white/10 bg-white/5 font-mono'
                        rows={4}
                        placeholder='function validate(value) { return true }'
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ))}
          <Button
            className='border-white/10 bg-white/10 hover:bg-white/20'
            variant='secondary'
          >
            Add Field
          </Button>
        </div>

        <div className='mt-5'>
          <div className='font-medium'>Data Processing</div>
          <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
            {[
              'Convert to Markdown',
              'Clean HTML (readability)',
              'Deep clean (content only)',
              'Extract text only',
              'Preserve images'
            ].map((label, i) => (
              <div
                key={i}
                className='flex items-center gap-2'
              >
                <Checkbox id={`proc-${i}`} />
                <Label htmlFor={`proc-${i}`}>{label}</Label>
              </div>
            ))}
          </div>
          <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-3'>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='trim'
                defaultChecked
              />
              <Label htmlFor='trim'>Trim whitespace</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='iso'
                defaultChecked
              />
              <Label htmlFor='iso'>Convert dates to ISO</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='normalize'
                defaultChecked
              />
              <Label htmlFor='normalize'>Normalize URLs</Label>
            </div>
            <div className='md:col-span-3'>
              <Label>Custom transformation functions</Label>
              <Textarea
                className='border-white/10 bg-white/5 font-mono'
                rows={6}
                placeholder='// JavaScript code&#10;export default (record) => record'
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Right: Live Preview */}
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Live Preview</div>
        <div className='mb-3'>
          <Label>Test Against URL</Label>
          <div className='mt-2 flex gap-2'>
            <Input
              className='border-white/10 bg-white/5 font-mono'
              placeholder='https://example.com/products/123'
            />
            <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Test</Button>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-3'>
          <div>
            <div className='mb-2 text-sm text-white/70'>Sample Data</div>
            <pre className='overflow-auto rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-sm'>
              {`{
  "title": "ACME Widget",
  "price": 19.99,
  "in_stock": true
}`}
            </pre>
          </div>
          <div>
            <div className='mb-2 text-sm text-white/70'>Validation Results</div>
            <ul className='space-y-1 text-sm'>
              <li className='text-[#10B981]'>✓ All fields valid</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function AIAssistant() {
  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
      {/* Chat Panel */}
      <GlassCard className='overflow-hidden p-0 xl:col-span-2'>
        <div className='flex h-[560px] flex-col'>
          <div className='flex-1 space-y-4 overflow-auto p-4'>
            <SystemMessage text='Welcome! Describe what you want to extract, or attach an HTML sample.' />
            <UserMessage text='Help me extract product data from example.com/products' />
            <AIMessage text="I can start by targeting '.product-card' and extracting title, price, availability. Would you like me to propose a schema and config?" />
            <AIActionButtons />
          </div>
          <div className='border-t border-white/10 p-3'>
            <div className='mb-2 flex flex-wrap gap-2'>
              {[
                'Help me extract product data',
                'Find data anomalies',
                'Update extraction rules',
                'Debug failed crawls'
              ].map((s) => (
                <Button
                  key={s}
                  variant='secondary'
                  className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
                >
                  {s}
                </Button>
              ))}
            </div>
            <div className='flex gap-2'>
              <Textarea
                className='flex-1 border-white/10 bg-white/5'
                rows={3}
                placeholder='Write a message. Markdown supported. Ctrl+Enter to send.'
              />
              <Button className='self-end bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Send</Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Context Panel */}
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Current Context</div>
        <div className='space-y-2 text-sm'>
          <div>
            <span className='text-white/60'>Active URL:</span> <code className='font-mono'>/products</code>
          </div>
          <div>
            <span className='text-white/60'>Schema:</span> v3
          </div>
          <div>
            <span className='text-white/60'>Recent crawl:</span> 11:24 AM
          </div>
        </div>
        <div className='mt-4 grid grid-cols-2 gap-2'>
          {['Load sample page', 'Test extraction', 'Apply changes', 'Rollback'].map((a) => (
            <Button
              key={a}
              variant='secondary'
              className='border-white/10 bg-white/10 hover:bg-white/20'
            >
              {a}
            </Button>
          ))}
        </div>
        <div className='mt-6'>
          <div className='mb-2 font-medium'>AI Capabilities</div>
          <ul className='list-disc space-y-1 pl-5 text-sm text-white/70'>
            <li>Propose selectors and extraction code</li>
            <li>Suggest schema updates</li>
            <li>Identify anomalies and fixes</li>
          </ul>
        </div>
      </GlassCard>
    </div>
  )
}

function SystemMessage({text}: {text: string}) {
  return <div className='text-center text-sm text-white/60'>{text}</div>
}
function UserMessage({text}: {text: string}) {
  return (
    <div className='ml-auto max-w-[80%] rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/20 p-3'>
      {text}
    </div>
  )
}
function AIMessage({text}: {text: string}) {
  return <div className='max-w-[80%] rounded-lg border border-white/10 bg-white/5 p-3'>{text}</div>
}
function AIActionButtons() {
  return (
    <div className='flex flex-wrap gap-2'>
      {['Apply This Code', 'Test on Sample', 'Update Schema', 'Fix Issues', 'Schedule Quality Check'].map(
        (a) => (
          <Button
            key={a}
            className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            variant='secondary'
          >
            {a}
          </Button>
        )
      )}
    </div>
  )
}

function DataExplorer() {
  const [mode, setMode] = React.useState<'sql' | 'visual'>('sql')

  return (
    <div className='space-y-4'>
      <GlassCard className='p-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant={mode === 'sql' ? 'default' : 'secondary'}
              className={
                mode === 'sql'
                  ? 'bg-[#3B82F6] hover:bg-[#3B82F6]/80'
                  : 'border-white/10 bg-white/10 hover:bg-white/20'
              }
              onClick={() => {
                setMode('sql')
              }}
            >
              <Code2 className='mr-2 h-4 w-4' /> SQL
            </Button>
            <Button
              variant={mode === 'visual' ? 'default' : 'secondary'}
              className={
                mode === 'visual'
                  ? 'bg-[#3B82F6] hover:bg-[#3B82F6]/80'
                  : 'border-white/10 bg-white/10 hover:bg-white/20'
              }
              onClick={() => {
                setMode('visual')
              }}
            >
              <Globe className='mr-2 h-4 w-4' /> Visual
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <Select defaultValue='recent'>
              <SelectTrigger className='min-w-48 border-white/10 bg-white/5'>
                <SelectValue placeholder='Saved Queries' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='recent'>Recent Products</SelectItem>
                <SelectItem value='errors'>Records With Errors</SelectItem>
              </SelectContent>
            </Select>
            <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Run Query</Button>
            <Button
              variant='secondary'
              className='border-white/10 bg-white/10 hover:bg-white/20'
            >
              Export
            </Button>
          </div>
        </div>
        <div className='mt-3'>
          {mode === 'sql' ? (
            <Textarea
              className='h-40 border-white/10 bg-white/5 font-mono'
              defaultValue={
                'SELECT title, price, in_stock FROM products WHERE price > 0 ORDER BY updated_at DESC LIMIT 100;'
              }
            />
          ) : (
            <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
              <div>
                <Label>Fields</Label>
                <Select defaultValue='title,price,in_stock'>
                  <SelectTrigger className='border-white/10 bg-white/5'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='title,price,in_stock'>title, price, in_stock</SelectItem>
                    <SelectItem value='title,price'>title, price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='md:col-span-2'>
                <Label>Condition</Label>
                <Input
                  className='border-white/10 bg-white/5'
                  placeholder='price > 0 AND in_stock = TRUE'
                />
              </div>
              <div>
                <Label>Sort</Label>
                <Input
                  className='border-white/10 bg-white/5'
                  placeholder='updated_at DESC'
                />
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className='overflow-hidden p-0'>
        <div className='flex items-center justify-between p-3'>
          <div className='text-sm text-white/70'>234 records</div>
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Columns
            </Button>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Filters
            </Button>
          </div>
        </div>
        <div className='overflow-auto'>
          <Table>
            <TableHeader className='sticky top-0 border-white/10 bg-white/5 backdrop-blur'>
              <TableRow>
                <TableHead className='w-10'></TableHead>
                <TableHead>title</TableHead>
                <TableHead>price</TableHead>
                <TableHead>in_stock</TableHead>
                <TableHead>json</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({length: 10}).map((_, i) => (
                <TableRow
                  key={i}
                  className='hover:bg-[#3B82F6]/10'
                >
                  <TableCell>
                    <Checkbox aria-label={`Select row ${i + 1}`} />
                  </TableCell>
                  <TableCell className='truncate'>ACME Widget {i + 1}</TableCell>
                  <TableCell>$19.{(90 + i) % 100}</TableCell>
                  <TableCell>{i % 3 === 0 ? 'false' : 'true'}</TableCell>
                  <TableCell>
                    <pre
                      className='max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap font-mono
                        text-xs'
                    >
                      {'{ "colors": ["red","blue"], "sku": "ACME-' + String(1000 + i) + '" }'}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-between border-t border-white/10 p-3'>
          <div className='text-sm text-white/70'>Completeness: 97% • Anomalies: 3 • Updated: just now</div>
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Export selected
            </Button>
            <Button
              variant='secondary'
              className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
            >
              Delete selected
            </Button>
            <Button className='h-8 bg-[#10B981] hover:bg-[#10B981]/80'>Re-process selected</Button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function Monitoring() {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6'>
        {[
          {label: 'Success Rate', value: '98.4%', color: '#10B981'},
          {label: 'Pages Crawled (today)', value: '12,430', color: '#3B82F6'},
          {label: 'Data Extracted', value: '4,220', color: '#8B5CF6'},
          {label: 'Avg Response (ms)', value: '420', color: '#F59E0B'},
          {label: 'Error Rate', value: '1.6%', color: '#EF4444'},
          {label: 'Queue Pending', value: '32', color: '#22D3EE'}
        ].map((m, i) => (
          <GlassCard
            key={i}
            className='p-4'
          >
            <div className='text-sm text-white/60'>{m.label}</div>
            <div className='text-2xl font-semibold'>{m.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Crawl History</div>
        <div className='overflow-auto'>
          <Table>
            <TableHeader className='sticky top-0 border-white/10 bg-white/5 backdrop-blur'>
              <TableRow>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({length: 6}).map((_, i) => (
                <TableRow
                  key={i}
                  className='hover:bg-[#3B82F6]/10'
                >
                  <TableCell>2025-08-07 11:{10 + i}</TableCell>
                  <TableCell>{5 + i}m</TableCell>
                  <TableCell>{1500 + i * 100}</TableCell>
                  <TableCell>{600 + i * 50}</TableCell>
                  <TableCell>
                    {i % 4 === 0 ? (
                      <span className='text-red-400'>Failed</span>
                    ) : (
                      <span className='text-[#10B981]'>Success</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='secondary'
                      className='h-8 border-white/10 bg-white/10 hover:bg-white/20'
                    >
                      Re-run
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Alerts & Notifications</div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <div className='mb-2 text-white/70'>Active Alerts</div>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-red-500' /> Crawl failures detected (2)
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-yellow-500' /> Rate limit hits increased
              </li>
            </ul>
          </div>
          <div>
            <div className='mb-2 text-white/70'>Alert Configuration</div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <div className='flex items-center gap-2'>
                <Checkbox defaultChecked /> <Label>Schema validation failures</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox defaultChecked /> <Label>Crawl failures</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox /> <Label>Rate limit hits</Label>
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox /> <Label>Data anomalies</Label>
              </div>
              <div className='md:col-span-2'>
                <Label>Notification channel</Label>
                <Select defaultValue='email'>
                  <SelectTrigger className='mt-1 border-white/10 bg-white/5'>
                    <SelectValue placeholder='Select' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='email'>Email</SelectItem>
                    <SelectItem value='webhook'>Webhook</SelectItem>
                    <SelectItem value='slack'>Slack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity threshold</Label>
                <Input
                  className='mt-1 border-white/10 bg-white/5'
                  placeholder='High'
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function APIAccess() {
  return (
    <div className='space-y-4'>
      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Endpoint Information</div>
        <div className='space-y-3 text-sm'>
          <div>
            <span className='text-white/60'>Base URL:</span> https://api.webcrawlerstudio.com/v1/
          </div>
          <div>
            <span className='text-white/60'>Authentication:</span> API key header{' '}
            <code className='font-mono'>Authorization: Bearer sk_***</code>
          </div>
          <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              GET /projects/123/data
            </code>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              POST /projects/123/crawl
            </code>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              GET /projects/123/status
            </code>
            <code className='rounded-lg border border-white/10 bg-white/5 p-2 font-mono'>
              PATCH /projects/123/schema
            </code>
          </div>
        </div>
      </GlassCard>

      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Interactive API Tester</div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div>
            <Label>Method</Label>
            <Select defaultValue='GET'>
              <SelectTrigger className='border-white/10 bg-white/5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['GET', 'POST', 'PATCH', 'DELETE'].map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='md:col-span-2'>
            <Label>Endpoint</Label>
            <Input
              className='border-white/10 bg-white/5 font-mono'
              defaultValue='/projects/123/data'
            />
          </div>
          <div className='md:col-span-3'>
            <Label>Parameters / Body (JSON)</Label>
            <Textarea
              className='h-32 border-white/10 bg-white/5 font-mono'
              defaultValue={`{}`}
            />
          </div>
          <div className='flex items-center gap-2 md:col-span-3'>
            <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Send</Button>
            <Button
              variant='secondary'
              className='border-white/10 bg-white/10 hover:bg-white/20'
            >
              Test Webhook
            </Button>
          </div>
        </div>
        <div className='mt-4'>
          <Label>Response</Label>
          <pre
            className='mt-2 overflow-auto rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-sm'
          >
            {`{
  "status": "ok",
  "data": []
}`}
          </pre>
        </div>
      </GlassCard>

      <GlassCard className='p-5'>
        <div className='mb-3 font-medium'>Webhooks</div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div className='md:col-span-2'>
            <Label>Webhook URL</Label>
            <Input
              className='border-white/10 bg-white/5 font-mono'
              placeholder='https://example.com/webhook'
            />
          </div>
          <div className='flex items-end'>
            <Button className='bg-[#3B82F6] hover:bg-[#3B82F6]/80'>Save</Button>
          </div>
          <div className='md:col-span-3'>
            <div className='mb-2 text-white/70'>Events</div>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-4'>
              {['Crawl completed', 'Data updated', 'Errors detected', 'Schema changed'].map((e, i) => (
                <div
                  key={i}
                  className='flex items-center gap-2'
                >
                  <Checkbox id={`wh-${i}`} />
                  <Label htmlFor={`wh-${i}`}>{e}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className='md:col-span-3'>
            <Label>Payload Preview</Label>
            <pre
              className='mt-2 overflow-auto rounded-lg border border-white/10 bg-white/5 p-3 font-mono
                text-sm'
            >
              {`{ "event": "crawl.completed", "projectId": "123", "timestamp": 1690000000 }`}
            </pre>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
