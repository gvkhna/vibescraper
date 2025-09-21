import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createCohere } from '@ai-sdk/cohere'
import { createFireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { createGroq } from '@ai-sdk/groq'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createTogetherAI } from '@ai-sdk/togetherai'
import type { LanguageModel } from 'ai'
import debug from 'debug'

import { PRIVATE_VARS } from '@/vars.private'

import { mockTestModel } from './mock/mock-test'
import { mockTestToolsModel } from './mock/mock-test-tools'

const log = debug('app:assistant-ai')

// Model size categories
export type ModelSize = 'small' | 'medium' | 'large'

// Get model based on size preference - simplified version
export function getModelBySize(size: ModelSize): LanguageModel | null {
  // Get the model string from env vars based on size
  let modelString: string | undefined
  let provider: string | undefined

  if (PRIVATE_VARS.MOCK_LLM === 'test') {
    return mockTestModel()
  }

  if (PRIVATE_VARS.MOCK_LLM === 'test-tools') {
    return mockTestToolsModel()
  }

  if (size === 'small') {
    modelString = PRIVATE_VARS.AI_SMALL_MODEL
    provider = PRIVATE_VARS.AI_SMALL_PROVIDER
    if (!modelString) {
      log('No model defined for size: small. Set AI_SMALL_MODEL environment variable.')
      return null
    }
  } else if (size === 'medium') {
    modelString = PRIVATE_VARS.AI_MEDIUM_MODEL
    provider = PRIVATE_VARS.AI_MEDIUM_PROVIDER
    if (!modelString) {
      log('No model defined for size: medium. Set AI_MEDIUM_MODEL environment variable.')
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (size === 'large') {
    modelString = PRIVATE_VARS.AI_LARGE_MODEL
    provider = PRIVATE_VARS.AI_LARGE_PROVIDER
    if (!modelString) {
      log('No model defined for size: large. Set AI_LARGE_MODEL environment variable.')
      return null
    }
  } else {
    log(`Unknown model size: ${size}`)
    return null
  }

  // Get preferred provider
  provider ??= PRIVATE_VARS.AI_DEFAULT_PROVIDER
  if (!provider) {
    log('No preferred provider defined. Set AI_DEFAULT_PROVIDER environment variable or one per model size.')
    return null
  }

  try {
    switch (provider) {
      case 'openai': {
        const openai = createOpenAI({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return openai(modelString)
      }

      case 'anthropic': {
        const anthropic = createAnthropic({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return anthropic(modelString)
      }

      case 'google': {
        const google = createGoogleGenerativeAI({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return google(modelString)
      }

      case 'groq': {
        const groq = createGroq({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return groq(modelString)
      }

      case 'mistral': {
        const mistral = createMistral({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return mistral(modelString)
      }

      case 'cohere': {
        const cohere = createCohere({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return cohere(modelString)
      }

      case 'perplexity': {
        const perplexity = createPerplexity({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return perplexity(modelString)
      }

      case 'fireworks': {
        const fireworks = createFireworks({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return fireworks(modelString)
      }

      case 'togetherai': {
        const togetherai = createTogetherAI({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return togetherai(modelString)
      }

      case 'bedrock': {
        const bedrock = createAmazonBedrock({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return bedrock(modelString)
      }

      case 'vertex': {
        const vertex = createVertex({
          ...(PRIVATE_VARS.AI_PROVIDER_BASE_URL && {
            baseURL: PRIVATE_VARS.AI_PROVIDER_BASE_URL
          })
        })
        return vertex(modelString)
      }

      case 'openai-compatible':
      case 'ollama':
      case 'lmstudio': {
        // For OpenAI-compatible providers, base URL is required
        const baseURL =
          PRIVATE_VARS.AI_PROVIDER_BASE_URL ??
          (provider === 'ollama'
            ? 'http://localhost:11434/v1'
            : provider === 'lmstudio'
              ? 'http://localhost:1234/v1'
              : null)

        if (!baseURL) {
          log(`OpenAI-compatible provider requires AI_PROVIDER_BASE_URL`)
          return null
        }

        const compatible = createOpenAICompatible({
          name: PRIVATE_VARS.AI_OPENAI_COMPATIBLE_NAME ?? provider,
          apiKey: PRIVATE_VARS.AI_OPENAI_COMPATIBLE_API_KEY,
          baseURL: baseURL
        })
        return compatible(modelString)
      }

      default:
        log(`Unknown provider: ${provider}`)
        return null
    }
  } catch (error) {
    log(`Failed to create model ${modelString} with provider ${provider}:`, error)
    return null
  }
}
