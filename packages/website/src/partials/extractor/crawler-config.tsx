'use client'

import { GlassCard } from '@/components/quick-stats'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

import { RadioCard } from './radio-card'

export function CrawlerConfig() {
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
                { url: 'https://example.com/products', status: 'OK', last: 'Today 11:20' },
                { url: 'https://example.com/blog', status: '429', last: 'Today 10:10' }
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
                  {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((d) => (
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
