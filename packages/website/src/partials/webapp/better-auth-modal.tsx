'use client'

import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {AuthView} from '@daveyplate/better-auth-ui'
import {Sparkles} from 'lucide-react'

interface BetterAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  view?: 'SIGN_IN' | 'SIGN_UP'
  redirectTo?: string
}

export function BetterAuthModal({
  open,
  onOpenChange,
  view = 'SIGN_UP',
  redirectTo = '/'
}: BetterAuthModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-sm border-white/10 bg-[#151517] p-0'>
        {/* <DialogHeader className='p-6 pb-4'>
          <div className='flex items-center justify-center gap-3'>
            <Sparkles className='h-6 w-6 text-blue-500' />
            <DialogTitle className='text-xl font-bold text-white'>
              {view === 'SIGN_UP' ? 'Get Started' : 'Sign In'}
            </DialogTitle>
          </div>
        </DialogHeader> */}

        <div className='p-6'>
          <AuthView
            view={view}
            redirectTo={redirectTo}
            cardHeader={null}
            classNames={{
              base: 'bg-transparent border-none shadow-none p-0 max-w-full'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
