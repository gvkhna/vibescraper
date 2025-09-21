import { Hono } from 'hono'

import { HttpStatusCode } from '@/lib/http-status-codes'
import type { HonoServer } from '.'

const app = new Hono<HonoServer>().get('/', async (c) => {
  // const user = c.get('user')
  // const session = c.get('session')
  // const db = c.get('db')
  // return c.json(
  //   {
  //     whoami: {
  //       user: {
  //         name: user?.name,
  //         email: user?.email
  //       },
  //       session: {
  //         userAgent: session?.userAgent,
  //         createdAt: session?.createdAt,
  //         updatedAt: session?.updatedAt,
  //         expiresAt: session?.expiresAt
  //       },
  //       db: Boolean(db)
  //     }
  //   },
  //   HttpStatusCode.Ok
  // )
})

export default app
export type WhoamiType = typeof app
