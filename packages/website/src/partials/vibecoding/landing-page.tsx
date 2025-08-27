'use client'

import {useState} from 'react'
import {useNavigate, Link} from '@tanstack/react-router'
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar
} from '@/components/ai-elements/prompt-input'
import {Sparkles, User} from 'lucide-react'
import {nowait} from '@/lib/async-utils'
import api from '@/lib/api-client'
import {toast} from 'sonner'
import {authReactClient} from '@/lib/auth-react-client'
import {Button} from '@/components/ui/button'
import {BetterAuthUserButton} from '@/partials/webapp/better-auth-user-button'
import {BetterAuthModal} from '@/partials/webapp/better-auth-modal'
import {GitHubStarsButton} from '@/components/animate-ui/buttons/github-stars'

export function VibecodingLandingPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authView, setAuthView] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_UP')
  const navigate = useNavigate()
  const session = authReactClient.useSession()

  const handleSubmitMessage = async (prompt: string) => {
    // Check if user is authenticated
    if (!session.data?.user) {
      setAuthView('SIGN_UP')
      setAuthModalOpen(true)
      return
    }

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
          to: '/app/scraper/$project-public-id/edit',
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
    <div className='min-h-screen bg-[#0A0A0B]'>
      {/* Simple Navigation Bar */}
      <nav className='h-16 border-b border-white/10 px-4 py-4'>
        <div className='mx-auto flex max-w-6xl items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Sparkles className='h-6 w-6 text-blue-500' />
            <span className='text-lg font-bold text-white'>Vibescraper</span>
          </div>
          <div>
            <GitHubStarsButton
              username='gvkhna'
              repo='vibescraper'
              className='h-8 px-2 py-1'
            />
          </div>
          <div className='flex items-center gap-6'>
            {!session.isPending && (
              <>
                <a
                  href='/readme'
                  className='text-white/80 transition-colors hover:text-white'
                >
                  About
                </a>
                {session.data?.user ? (
                  <div className='flex items-center gap-6'>
                    <Link
                      to='/app/scrapers'
                      className='text-white/80 transition-colors hover:text-white'
                    >
                      Scrapers
                    </Link>
                    <BetterAuthUserButton />
                  </div>
                ) : (
                  <div className='flex items-center gap-6'>
                    <button
                      onClick={() => {
                        setAuthView('SIGN_IN')
                        setAuthModalOpen(true)
                      }}
                      className='text-white/80 transition-colors hover:text-white'
                    >
                      Sign In
                    </button>
                    <Button
                      size='sm'
                      className='bg-blue-600 text-white hover:bg-blue-700'
                      onClick={() => {
                        setAuthView('SIGN_UP')
                        setAuthModalOpen(true)
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className='flex min-h-[calc(100vh-80px)] items-center justify-center px-4'>
        <div className='w-full max-w-2xl'>
          {/* Logo/Brand */}
          <div className='mb-8 text-center'>
            <h1 className='mb-4 text-3xl font-bold text-white'>Start scraping any website</h1>
            <p className='text-lg text-white/80'>Use natural language to extract data from any website</p>
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
                className='absolute right-3 bottom-3'
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

      <BetterAuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        view={authView}
        redirectTo='/'
      />
    </div>
  )
}
