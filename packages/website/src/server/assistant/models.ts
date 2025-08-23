import {Hono} from 'hono'
import type {HonoServer} from '..'
import {HttpStatusCode} from '@/lib/http-status-codes'
import {PRIVATE_VARS} from '@/vars.private'
import debug from 'debug'

const log = debug('app:server:assistant:models')

const app = new Hono<HonoServer>().get('/models', async (c) => {
  try {
    const models = {
      small: PRIVATE_VARS.AI_SMALL_MODEL,
      medium: PRIVATE_VARS.AI_MEDIUM_MODEL,
      large: PRIVATE_VARS.AI_LARGE_MODEL
    }

    return c.json({models}, HttpStatusCode.Ok)
  } catch (error) {
    log('Error fetching models:', error)
    return c.json({error: 'Failed to fetch models'}, HttpStatusCode.BadGateway)
  }
})

export default app
export type ModelsType = typeof app
