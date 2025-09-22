'use client'

import { cn } from '@/lib/utils'

export function StatusBadge({
  status = 'ready'
}: {
  status?: 'ready' | 'active' | 'paused' | 'error' | 'processing'
}) {
  const map = {
    ready: { dot: 'bg-[#10B981]', text: 'Ready', ring: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]' },
    active: { dot: 'bg-[#10B981]', text: 'Active', ring: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]' },
    paused: { dot: 'bg-[#F59E0B]', text: 'Paused', ring: '' },
    error: { dot: 'bg-red-500', text: 'Error', ring: '' },
    processing: { dot: 'bg-[#3B82F6] animate-pulse', text: 'Processing', ring: '' }
  } as const
  const m = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs',
        m.ring
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', m.dot)} />
      {m.text}
    </span>
  )
}
