import {Hono} from 'hono'
import type {HonoServer} from '.'
import * as schema from '@/db/schema'
import {eq} from 'drizzle-orm'
import debug from 'debug'
import {streamSSE} from 'hono/streaming'
import {PRIVATE_VARS} from '@/vars.private'
import {SandboxManager} from '@scrapeloop/sandbox'
import {HttpStatusCode} from '@/lib/http-status-codes'

const log = debug('app:server:sandbox')

const sandboxManager = new SandboxManager(PRIVATE_VARS.TMP_DIR)

// const app = new Hono<HonoServer>()
//   .get('/execute/:codeFunctionPublicId', async (c) => {
//     const user = c.get('user')
//     const session = c.get('session')
//     const db = c.get('db')

//     // c.header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0, s-maxage=0')

//     const codeFunctionPublicId = c.req.param('codeFunctionPublicId')
//     if (!codeFunctionPublicId) {
//       return c.json({message: 'Code Function Id not found'}, HttpStatusCode.Forbidden)
//     }

//     if (!user) {
//       return c.json({message: 'User not found'}, HttpStatusCode.Forbidden)
//     }

//     const file = await db.query.projectFile.findFirst({
//       where: eq(schema.projectFile.publicId, codeFunctionPublicId as schema.ProjectFilePublicId)
//     })

//     if (!file) {
//       return c.json({message: 'File not found or unauthorized'}, HttpStatusCode.NotFound)
//     }

//     const codeDefinition = file.jsonContent as CodeDefinition | null

//     if (!codeDefinition) {
//       return c.json({message: 'File not found or malformed'}, HttpStatusCode.NotFound)
//     }

//     const code = codeDefinition.text
//     if (!code) {
//       return c.json({message: 'No code'}, HttpStatusCode.BadRequest)
//     }

//     if (code.trim().length === 0) {
//       return c.json({message: 'No code'}, HttpStatusCode.BadRequest)
//     }

//     c.header('Content-Type', 'text/event-stream')
//     c.header('Connection', 'keep-alive')
//     c.header('X-Accel-Buffering', 'no')
//     c.header('Access-Control-Allow-Credentials', 'true')

//     // Use streamSSE to stream the response
//     log('starting stream')
//     // let id = 1
//     return streamSSE(
//       c,
//       async (stream) => {
//         stream.onAbort(() => {
//           log('Aborted!')
//         })
//         // const abortController = new AbortController()

//         // Handle client disconnect
//         // c.req.raw.signal.addEventListener('abort', () => {
//         //   log('client raw abort')
//         //   abortController.abort()
//         // })

//         // await new Promise((resolve) => {
//         //   setTimeout(() => {
//         //     resolve()
//         //   }, 1000)
//         // })

//         try {
//           for await (const message of sandboxManager.executeCode(code, true)) {
//             // if (abortController.signal.aborted) {
//             //   log('received abort')
//             //   break
//             // }

//             log('sending original message', message.type)
//             await stream.writeSSE({
//               event: 'message',
//               data: JSON.stringify(message),
//               // id: String(id++)
//               id: message.messageId
//             })

//             if (message.type === 'status' && ['completed', 'failed', 'timeout'].includes(message.status)) {
//               log('stream received complete')
//               await stream.sleep(1500)
//               // await stream.writeSSE({
//               //   event: 'time-update',
//               //   data: JSON.stringify(message),
//               //   // id: String(id++)
//               //   id: message.messageId
//               // })
//               break
//             }
//           }
//           log('outside of for loop')
//         } catch (err) {
//           log('stream error:', err)
//         } finally {
//           log('finally closing stream')
//           // while (true) {
//           //   const message = `It is ${new Date().toISOString()}`
//           //   await stream.writeSSE({
//           //     data: message,
//           //     event: 'message',
//           //     id: String(id++)
//           //   })
//           //   // Sleep for 1 second before sending the next event
//           //   await stream.sleep(1000)
//           // }
//           await stream.close()
//         }
//       },
//       async (err, stream) => {
//         // stream.writeln('An error occurred!')
//         log('stream error: ', err)
//       }
//     )
//   })
//   .get('/test', async (c) => {
//     log('starting request')
//     // const code = `
//     //   console.log('Starting job...');
//     //   // ... user code ...
//     //   await new Promise(r => setTimeout(r, 1000));
//     //   for (let i = 0; i < 3; i++) {
//     //     console.log(\`Iteration \${i}\`);
//     //     await new Promise(r => setTimeout(r, 500));
//     //   }
//     //   console.log('done!')
//     //   exit()
//     // `
//     const code = WorkerRuntimeTestsRaw
//     // const code = `
//     // console.log('Starting job...');
//     // console.log('Job complete!');
//     // `
//     // const code = `
//     // console.log("Line 1 in user code");
//     // console.error("Line 2 is an error");
//     // throw new Error("Line 3 error");
//     // `
//     // Set the SSE headers
//     c.header('Content-Type', 'text/event-stream')
//     c.header('Cache-Control', 'no-cache')
//     c.header('Connection', 'keep-alive')
//     c.header('X-Accel-Buffering', 'no')

//     // Use streamSSE to stream the response
//     log('starting stream')
//     return streamSSE(c, async (stream) => {
//       const abortController = new AbortController()
//       // let eventId = 1

//       // Handle client disconnect
//       c.req.raw.signal.addEventListener('abort', () => {
//         log('client raw abort')
//         abortController.abort()
//       })

//       try {
//         for await (const message of sandboxManager.executeCode(code, true)) {
//           if (abortController.signal.aborted) {
//             log('received abort')
//             break
//           }

//           log('sending original message', message.type)
//           await stream.writeSSE({
//             event: message.type,
//             data: JSON.stringify(message),
//             id: message.messageId
//           })

//           if (message.type === 'status' && ['completed', 'failed', 'timeout'].includes(message.status)) {
//             log('stream received complete')
//             break
//           }
//         }
//       } catch (err) {
//         log('stream error:', err)
//       } finally {
//         log('finally closing stream')
//         await stream.close()
//       }
//     })
//     // return streamSSE(c, async (stream) => {
//     //   log('executing stream')
//     //   const job = await sandboxManager.executeCode(code)
//     //   let eventId = 1

//     //   log('job: ', job)
//     //   // Send initial job status
//     //   await stream.writeSSE({
//     //     event: 'status',
//     //     data: JSON.stringify(job),
//     //     id: String(eventId++)
//     //   })

//     //   // Listen for log updates
//     //   const logListener = (data: {jobId: string; log: string}) => {
//     //     if (data.jobId === job.id) {
//     //       log('log listener', data)
//     //       nowait(
//     //         stream.writeSSE({
//     //           event: 'log',
//     //           data: data.log,
//     //           id: String(eventId++)
//     //         })
//     //       )
//     //     }
//     //   }

//     //   // Listen for status updates
//     //   const statusListener = (updatedJob: SandboxWorkerJob) => {
//     //     if (updatedJob.id === job.id) {
//     //       log('log listener', updatedJob)
//     //       nowait(
//     //         stream.writeSSE({
//     //           event: 'status',
//     //           data: JSON.stringify(updatedJob),
//     //           id: String(eventId++)
//     //         })
//     //       )

//     //       // Close stream on terminal states
//     //       if (['completed', 'failed', 'timeout'].includes(updatedJob.status)) {
//     //         log('log listener closing stream')
//     //         sandboxManager.off('job-log', logListener)
//     //         sandboxManager.off('job-update', statusListener)
//     //         nowait(stream.close())
//     //       }
//     //     }
//     //   }

//     //   log('listening')
//     //   sandboxManager.on('job-log', logListener)
//     //   sandboxManager.on('job-update', statusListener)

//     //   // Handle client disconnect
//     //   c.req.raw.signal.addEventListener('abort', () => {
//     //     log('aborting')
//     //     sandboxManager.off('job-log', logListener)
//     //     sandboxManager.off('job-update', statusListener)
//     //   })

//     //   // Keep the connection open until job completes
//     //   await new Promise((resolve) => {
//     //     log('starting listener')
//     //     statusListener(job) // Initial status
//     //   })
//     // })
//   })
//   .get('/new', async (c) => {
//     let id = 1
//     // Set the SSE headers
//     c.header('Content-Type', 'text/event-stream')
//     c.header('Cache-Control', 'no-cache')
//     c.header('Connection', 'keep-alive')
//     c.header('X-Accel-Buffering', 'no')

//     // Use streamSSE to stream the response
//     return streamSSE(c, async (stream) => {
//       // Send an initial message to verify the connection
//       await stream.writeSSE({
//         data: 'Connected to SSE endpoint',
//         event: 'init',
//         id: String(id++)
//       })

//       while (true) {
//         const message = `It is ${new Date().toISOString()}`
//         await stream.writeSSE({
//           data: message,
//           event: 'time-update',
//           id: String(id++)
//         })
//         // Sleep for 1 second before sending the next event
//         await stream.sleep(1000)
//       }
//     })
//   })

// export default app
// export type SandboxType = typeof app
