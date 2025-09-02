// import {createAuthClient} from 'better-auth/client'
import {nowait} from '@/lib/async-utils'
// import path from 'node:path'
// import {fileURLToPath} from 'node:url'
// import process from 'node:process'
import debug from 'debug'

const log = debug('app:db-seed')

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
// const __cwd = process.cwd()

const main = async () => {
  // const authClient = createAuthClient()
  // authClient.signUp.email({
  // })
  // const res = await db
  //   .insert(schema.user)
  //   .values({
  //     name: 'Gaurav Khanna'
  //   })
  //   .returning()
  // const user = await db.query.user.findFirst()
  // console.log('res: ', res)
  // console.log('user: ', user)
  // console.log('safe to quit (ctrl+c)')
}
nowait(main())
