'use client'

import {useState} from 'react'
import {useNavigate} from '@tanstack/react-router'
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar
} from '@/components/ai-elements/prompt-input'
import {Sparkles} from 'lucide-react'
import {nowait} from '@/lib/async-utils'
import api from '@/lib/api-client'
import {toast} from 'sonner'

export function VibecodingLandingPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmitMessage = async (prompt: string) => {
    setIsLoading(true)

    try {
      const response = await api.projects.newPrompt.$post({
        json: {
          prompt: prompt.trim()
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || 'Failed to process your request'
        toast.error(errorMessage)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      // Navigate to the project edit page with optional chat query param
      if (data.project.publicId) {
        await navigate({
          to: '/scraper/$project-public-id/edit',
          params: {
            'project-public-id': data.project.publicId
          },
          search: data.chatPublicId ? {chat: data.chatPublicId} : {}
        })
      }
    } catch (error) {
      // Log error for debugging
      toast.error('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) {
      return
    }
    nowait(handleSubmitMessage(input))
    return false
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#0A0A0B] px-4'>
      <div className='w-full max-w-2xl'>
        {/* Logo/Brand */}
        <div className='mb-8 text-center'>
          <div className='mb-4 flex items-center justify-center gap-3'>
            <Sparkles className='h-8 w-8 text-blue-500' />
            <h1 className='text-3xl font-bold text-white'>Vibescraper</h1>
          </div>
          <p className='text-lg text-white/80'>Start scraping any website with natural language</p>
        </div>

        {/* Prompt Input */}
        <PromptInput
          onSubmit={handleFormSubmit}
          className='relative'
        >
          <PromptInputTextarea
            onChange={(e) => {
              setInput(e.target.value)
            }}
            value={input}
            placeholder='Start scraping "example.com" for product data...'
            disabled={isLoading}
            className={`min-h-[120px] resize-none border-white/20 bg-white/10 text-white transition-opacity
              placeholder:text-white/60 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
          />
          <PromptInputToolbar>
            <PromptInputSubmit
              className='absolute bottom-3 right-3'
              disabled={!input.trim() || isLoading}
              status={isLoading ? 'submitted' : 'ready'}
            />
          </PromptInputToolbar>
        </PromptInput>

        {/* Example prompts */}
        <div className='mt-8'>
          <p className='mb-3 text-center text-sm text-white/60'>Try these examples:</p>
          <div className='flex flex-wrap justify-center gap-2'>
            {[
              'Scrape product prices from amazon.com',
              'Extract articles from news.ycombinator.com',
              'Get real estate listings from zillow.com',
              'Monitor price changes on bestbuy.com'
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  if (!isLoading) {
                    setInput(example)
                    nowait(handleSubmitMessage(example))
                  }
                }}
                disabled={isLoading}
                className={`rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/80
                transition-all ${
                  isLoading
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:border-white/30 hover:bg-white/20 hover:text-white'
                }`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
