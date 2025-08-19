import {createOpenAI} from '@ai-sdk/openai'
import {createOpenAICompatible} from '@ai-sdk/openai-compatible'
import {createAnthropic} from '@ai-sdk/anthropic'
import {createGoogleGenerativeAI} from '@ai-sdk/google'
import {createAmazonBedrock} from '@ai-sdk/amazon-bedrock'
import {createMistral} from '@ai-sdk/mistral'
import {createCohere} from '@ai-sdk/cohere'
import {createGroq} from '@ai-sdk/groq'
import {createPerplexity} from '@ai-sdk/perplexity'
import {createFireworks} from '@ai-sdk/fireworks'
import {createVertex} from '@ai-sdk/google-vertex'
import {createTogetherAI} from '@ai-sdk/togetherai'
import {PRIVATE_VARS} from '@/vars.private'
import type {LanguageModel} from 'ai'
import debug from 'debug'
import {mockTestModel} from './mock-llm/mock-test'
import {mockTestToolsModel} from './mock-llm/mock-test-tools'

const log = debug('app:assistant-llm')

// Model size categories
export type ModelSize = 'small' | 'medium' | 'large'

// Get model based on size preference - simplified version
export function getModelBySize(size: ModelSize): LanguageModel | null {
  // Get the model string from env vars based on size
  let modelString: string | undefined

  if (PRIVATE_VARS.MOCK_LLM === 'test') {
    return mockTestModel()
  }

  if (PRIVATE_VARS.MOCK_LLM === 'test-tools') {
    return mockTestToolsModel()
  }

  if (size === 'small') {
    modelString = PRIVATE_VARS.AI_SMALL_MODEL
    if (!modelString) {
      log('No model defined for size: small. Set AI_SMALL_MODEL environment variable.')
      return null
    }
  } else if (size === 'medium') {
    modelString = PRIVATE_VARS.AI_MEDIUM_MODEL
    if (!modelString) {
      log('No model defined for size: medium. Set AI_MEDIUM_MODEL environment variable.')
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (size === 'large') {
    modelString = PRIVATE_VARS.AI_LARGE_MODEL
    if (!modelString) {
      log('No model defined for size: large. Set AI_LARGE_MODEL environment variable.')
      return null
    }
  } else {
    log(`Unknown model size: ${size}`)
    return null
  }

  // Get preferred provider
  const provider = PRIVATE_VARS.AI_PREFERRED_PROVIDER
  if (!provider) {
    log('No preferred provider defined. Set AI_PREFERRED_PROVIDER environment variable.')
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
