'use client'

import { useEffect, useState } from 'react'
import {
  ChangeEmailCard,
  ChangePasswordCard,
  DeleteAccountCard,
  ProvidersCard,
  SessionsCard,
  UpdateAvatarCard,
  UpdateNameCard,
  UpdateUsernameCard } from '@daveyplate/better-auth-ui'
import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { nowait } from '@/lib/async-utils'

export const Route = createFileRoute('/app/settings/')({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen bg-[#0A0A0B] text-white'>
      {/* Top Navigation */}
      <div className='border-b border-white/10 bg-[#0A0A0B] px-6 py-4'>
        <div className='mx-auto flex max-w-4xl items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              nowait(navigate({ to: '/' }))
            }}
            className='text-white/70 hover:bg-white/10 hover:text-white'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
          <div className='text-lg font-semibold text-white'>Vibescraper</div>
        </div>
      </div>

      {/* Header */}
      <div className='border-b border-white/10 bg-[#151517] px-6 py-8'>
        <div className='mx-auto max-w-4xl'>
          <h1 className='text-3xl font-bold text-white'>Account Settings</h1>
          <p className='mt-2 text-white/70'>Manage your account preferences and security settings</p>
        </div>
      </div>

      {/* Main Content */}
      <div className='mx-auto max-w-4xl px-6 py-8'>
        <div className='space-y-8'>
          {/* Profile Section */}
          <div className='space-y-4'>
            <div>
              <h2 className='text-xl font-semibold text-white'>Profile Information</h2>
              <p className='text-sm text-white/60'>Update your personal information and profile settings</p>
            </div>
            <div className='space-y-4'>
              <UpdateAvatarCard
                classNames={{
                  base: 'bg-[#151517] border border-white/10 rounded-md',
                  header: '',
                  title: 'text-lg font-semibold text-white',
                  description: 'text-sm text-white/80',
                  content: 'bg-transparent',
                  footer: 'flex flex-row bg-transparent border-t border-white/10',
                  button: 'bg-white/10 hover:bg-white/20 text-white border-0'
                }}
              />
              <UpdateNameCard
                classNames={{
                  base: 'bg-[#151517] border border-white/10 rounded-md',
                  header: 'border-b border-white/10',
                  title: 'text-lg font-semibold text-white',
                  description: 'text-sm text-white/80',
                  content: 'bg-transparent',
                  footer: 'flex flex-row bg-transparent border-t border-white/10',
                  button: 'bg-white/10 hover:bg-white/20 text-white border-0',
                  input: 'bg-[#0A0A0B] border-white/10 text-white placeholder:text-white/40',
                  label: 'text-white/80'
                }}
              />
              <UpdateUsernameCard
                classNames={{
                  base: 'bg-[#151517] border border-white/10 rounded-md',
                  header: 'border-b border-white/10',
                  title: 'text-lg font-semibold text-white',
                  description: 'text-sm text-white/80',
                  content: 'bg-transparent',
                  footer: 'flex flex-row bg-transparent border-t border-white/10',
                  button: 'bg-white/10 hover:bg-white/20 text-white border-0',
                  input: 'bg-[#0A0A0B] border-white/10 text-white placeholder:text-white/40',
                  label: 'text-white/80'
                }}
              />
            </div>
          </div>

          {/* Account Security */}
          <div className='space-y-4'>
            <div>
              <h2 className='text-xl font-semibold text-white'>Account Security</h2>
              <p className='text-sm text-white/60'>Manage your login credentials and account access</p>
            </div>
            <div className='space-y-4'>
              <ChangeEmailCard
                classNames={{
                  base: 'bg-[#151517] border border-white/10 rounded-md',
                  header: 'border-b border-white/10',
                  title: 'text-lg font-semibold text-white',
                  description: 'text-sm text-white/80',
                  content: 'bg-transparent',
                  footer: 'flex flex-row bg-transparent border-t border-white/10',
                  button: 'bg-white/10 hover:bg-white/20 text-white border-0',
                  input: 'bg-[#0A0A0B] border-white/10 text-white placeholder:text-white/40',
                  label: 'text-white/80'
                }}
              />
              <ChangePasswordCard
                classNames={{
                  base: 'bg-[#151517] border border-white/10 rounded-md',
                  header: 'border-b border-white/10',
                  title: 'text-lg font-semibold text-white',
                  description: 'text-sm text-white/80',
                  content: 'bg-transparent',
                  footer: 'flex flex-row bg-transparent border-t border-white/10',
                  button: 'bg-white/10 hover:bg-white/20 text-white border-0',
                  input: 'bg-[#0A0A0B] border-white/10 text-white placeholder:text-white/40',
                  label: 'text-white/80'
                }}
              />
              <ProvidersCard
                classNames={{
                  base: 'bg-[#151517] border border-white/10 rounded-md',
                  header: 'border-b border-white/10',
                  title: 'text-lg font-semibold text-white',
                  description: 'text-sm text-white/80',
                  content: 'bg-transparent [&_div]:border-white/10',
                  footer: 'flex flex-row bg-transparent border-t border-white/10',
                  button: 'bg-white/10 hover:bg-white/20 text-white border-0'
                }}
              />
            </div>
          </div>

          {/* Sessions */}
          <div className='space-y-4'>
            <div>
              <h2 className='text-xl font-semibold text-white'>Active Sessions</h2>
              <p className='text-sm text-white/60'>Monitor and manage your active login sessions</p>
            </div>
            <div>
              <SessionsCard
                classNames={{
                  base: 'bg-[#151517] border border-white/10 rounded-md',
                  header: 'border-b border-white/10',
                  title: 'text-lg font-semibold text-white',
                  description: 'text-sm text-white/80',
                  content: 'bg-transparent [&_div]:border-white/10',
                  footer: 'flex flex-row bg-transparent border-t border-white/10',
                  button: 'bg-white/10 hover:bg-white/20 text-white border-0'
                }}
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className='space-y-4'>
            <div>
              <h2 className='text-xl font-semibold text-red-400'>Danger Zone</h2>
              <p className='text-sm text-white/60'>Irreversible account actions</p>
            </div>
            <div>
              <DeleteAccountCard
                classNames={{
                  base: 'bg-[#151517] border border-red-900/30 rounded-md',
                  header: 'border-b border-red-900/30',
                  title: 'text-lg font-semibold text-red-400',
                  description: 'text-sm text-white/60',
                  content: 'bg-transparent',
                  footer: 'bg-transparent border-t border-red-900/30',
                  button: 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border-0'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
