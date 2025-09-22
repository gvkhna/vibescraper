'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function QuickStats({
  stats = [
    { label: 'Pages Crawled', value: '128,540', delta: '+1.2%', color: '#3B82F6' },
    { label: 'Records Extracted', value: '54,903', delta: '+0.8%', color: '#10B981' },
    { label: 'Last Successful Crawl', value: 'Today, 11:24 AM', delta: '', color: '#8B5CF6' },
    { label: 'Success Rate', value: '98.4%', delta: '+0.3%', color: '#10B981' }
  ]
}: {
  stats?: { label: string; value: string; delta?: string; color?: string }[]
}) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {stats.map((s, idx) => (
        <GlassCard
          key={idx}
          className='p-4'
        >
          <div className='flex items-center justify-between'>
            <div className='text-sm text-white/60'>{s.label}</div>
            {s.delta ? <div className='text-xs text-white/50'>{s.delta}</div> : <div />}
          </div>
          <div className='mt-2 flex items-end justify-between'>
            <div className='text-2xl font-semibold'>{s.value}</div>
            <Sparkline color={s.color} />
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

function Sparkline({ color = '#3B82F6' }: { color?: string }) {
  return (
    <svg
      width='100'
      height='32'
      viewBox='0 0 100 32'
      className='opacity-80'
    >
      <polyline
        fill='none'
        stroke={color}
        strokeWidth='2'
        points='0,24 12,18 24,20 36,12 48,14 60,8 72,10 84,6 96,10'
      />
    </svg>
  )
}

export function GlassCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <Card
      className={cn(
        `border border-white/10 bg-[rgba(26,26,27,0.5)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)]
        backdrop-blur-md`,
        'rounded-xl',
        className
      )}
    >
      {children}
    </Card>
  )
}
