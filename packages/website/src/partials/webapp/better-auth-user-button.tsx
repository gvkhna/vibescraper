'use client'

import { UserButton } from '@daveyplate/better-auth-ui'

import { cn } from '@/lib/utils'

interface BetterAuthUserButtonProps {
  size?: 'icon' | 'default'
  className?: string
  align?: 'center' | 'start' | 'end'
}

export function BetterAuthUserButton({ size = 'icon', align = 'end' }: BetterAuthUserButtonProps) {
  return (
    <UserButton
      size={size}
      align={align}
      classNames={{
        content: {
          base: 'border-none flex flex-col hover:no-underline',
          menuItem: 'flex flex-1 hover:no-underline'
        }
      }}
    />
  )
}
