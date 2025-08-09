// import {addJob, getWorkerUtils} from '@/worker/graphile.config'
// import {JOB_NAMES} from '@/worker/types'
// import type {ProjectId, CrawlRunId} from '@/db/schema/project'
// import {db} from '@/db'
// import {crawlRun} from '@/db/schema/project'
// import {ulid} from 'ulid'

// /**
//  * Start a crawl for a project
//  */
// export async function startCrawl(projectId: ProjectId): Promise<CrawlRunId> {
//   // Create a new crawl run
//   const crawlRunId = ulid() as CrawlRunId
//   await db.insert(crawlRun).values({
//     id: crawlRunId,
//     projectId,
//     status: 'pending'
//   })

//   // Queue the crawl job
//   await addJob(
//     JOB_NAMES.CRAWL,
//     {
//       crawlRunId,
//       projectId
//     },
//     {
//       priority: 0
//     }
//   )

//   return crawlRunId
// }

// /**
//  * Schedule recurring crawls for a project
//  */
// export async function scheduleProjectCrawls(projectId: ProjectId): Promise<void> {
//   await addJob(
//     JOB_NAMES.SCHEDULED_CRAWL,
//     {
//       projectId
//     },
//     {
//       priority: 5
//     }
//   )
// }

// /**
//  * Get job queue statistics
//  */
// export async function getQueueStats() {
//   const utils = await getWorkerUtils()

//   // Get various queue statistics
//   const [completeJobCount, failedJobCount, pendingJobCount] = await Promise.all([
//     utils.completeJobs(1000), // Complete jobs older than 1 second
//     utils.permanentlyFailJobs(1000) // Permanently fail jobs older than 1 second
//     // Note: These are maintenance operations, in practice you'd want different queries
//   ])

//   return {
//     // Would need to implement actual counting queries
//     pending: 0,
//     running: 0,
//     completed: 0,
//     failed: 0
//   }
// }

// /**
//  * Retry a failed job
//  */
// export async function retryJob(jobId: string): Promise<void> {
//   const utils = await getWorkerUtils()
//   await utils.rescheduleJobs([jobId])
// }

// /**
//  * Cancel a pending job
//  */
// export async function cancelJob(jobId: string): Promise<void> {
//   const utils = await getWorkerUtils()
//   await utils.permanentlyFailJobs([jobId])
// }
