'use client'

import * as React from 'react'
import {cn} from '@/lib/utils'

export function RadioCard({label, desc, defaultChecked}: {label: string; desc: string; defaultChecked?: boolean}) {
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