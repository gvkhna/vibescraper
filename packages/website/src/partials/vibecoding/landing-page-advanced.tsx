'use client'

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { GlobeIcon, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'

import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools
} from '@/components/ai-elements/prompt-input'
import api from '@/lib/api-client'
import { nowait } from '@/lib/async-utils'

const models = [
  { id: 'gpt-4o', name: 'GPT 4o' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'deepseek-r1', name: 'Deepseek R1' }
]

export function VibecodingLandingPageAdvanced() {
  const [input, setInput] = useState('')
  const [model, setModel] = useState('gpt-4o')
  const [webSearch, setWebSearch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) {
      return
    }

    setIsLoading(true)

    // FUTURE: Process with AI SDK using selected model and options
    // Simulate async processing for now
    setTimeout(() => {
      setIsLoading(false)
      // Will navigate or process result here
    }, 2000)
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#0A0A0B] px-4'>
      <div className='w-full max-w-3xl'>
        {/* Logo/Brand */}
        <div className='mb-8 text-center'>
          <div className='mb-4 flex items-center justify-center gap-3'>
            <Sparkles className='h-10 w-10 text-blue-500' />
            <h1 className='text-4xl font-bold text-white'>Vibescraper</h1>
          </div>
          <p className='text-xl text-white/80'>AI-powered web scraping with natural language</p>
        </div>

        {/* Prompt Input with Tools */}
        <PromptInput
          onSubmit={(msg, e) => {
            nowait(handleSubmit(e))
          }}
          className='relative'
        >
          <PromptInputTextarea
            onChange={(e) => {
              setInput(e.target.value)
            }}
            value={input}
            placeholder='Describe what you want to scrape... e.g., "Get all product listings from example.com with prices, descriptions, and images"'
            disabled={isLoading}
            className={`min-h-[140px] resize-none border-white/20 bg-white/10 text-white transition-opacity
              placeholder:text-white/60 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                disabled={isLoading}
                onClick={() => {
                  if (!isLoading) {
                    setWebSearch(!webSearch)
                  }
                }}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputButton
                variant='ghost'
                disabled={isLoading}
              >
                <Zap size={16} />
                <span>Fast Mode</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  if (!isLoading) {
                    setModel(value)
                  }
                }}
                value={model}
                disabled={isLoading}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((m) => (
                    <PromptInputModelSelectItem
                      key={m.id}
                      value={m.id}
                    >
                      {m.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input.trim() || isLoading}
              status={isLoading ? 'submitted' : 'ready'}
            />
          </PromptInputToolbar>
        </PromptInput>

        {/* Quick Actions */}
        <div className='mt-10'>
          <p className='mb-4 text-center text-sm font-medium text-white/70'>Popular scraping tasks</p>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {[
              {
                title: 'E-commerce Products',
                description: 'Extract product listings, prices, and reviews',
                prompt:
                  'Scrape all products from the catalog page including title, price, image, and availability'
              },
              {
                title: 'News Articles',
                description: 'Get articles with headlines and content',
                prompt: 'Extract all news articles with title, author, date, and full text content'
              },
              {
                title: 'Real Estate Listings',
                description: 'Property details, prices, and locations',
                prompt: 'Get property listings with price, bedrooms, bathrooms, square footage, and address'
              },
              {
                title: 'Job Postings',
                description: 'Job titles, companies, and requirements',
                prompt: 'Extract job listings including title, company, salary range, and requirements'
              }
            ].map((task) => (
              <button
                key={task.title}
                onClick={() => {
                  if (!isLoading) {
                    setInput(task.prompt)
                  }
                }}
                disabled={isLoading}
                className={`group rounded-lg border border-white/20 bg-white/10 p-4 text-left transition-all
                ${
                  isLoading ? 'cursor-not-allowed opacity-50' : 'hover:border-blue-500/50 hover:bg-white/20'
                }`}
              >
                <h3 className={`font-medium text-white ${!isLoading ? 'group-hover:text-blue-400' : ''}`}>
                  {task.title}
                </h3>
                <p className='mt-1 text-sm text-white/70'>{task.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
