import type { ProjectCommitCacheData } from '@/db/schema'

export type PipelineStepStatus = 'success' | 'success-cached' | 'error' | 'not-run'

export interface DerivedPipelineStatus {
  fetched: PipelineStepStatus
  processed: PipelineStepStatus
  extracted: PipelineStepStatus
  validated: PipelineStepStatus
  hasData: boolean
  lastRunAt?: string
  error?: string
}

/**
 * Derives the actual pipeline status from cached data using the new clear stage-based structure
 * This provides real status information for each stage of the pipeline
 */
export function derivePipelineStatus(
  cachedData: ProjectCommitCacheData | null,
  hasActiveSchema: boolean,
  hasActiveScript: boolean
): DerivedPipelineStatus {
  // Default state when no data exists
  if (!cachedData) {
    return {
      fetched: 'not-run',
      processed: 'not-run',
      extracted: 'not-run',
      validated: 'not-run',
      hasData: false
    }
  }

  // Step 1: Fetched - check fetchStatus from new structure
  const fetched: PipelineStepStatus =
    cachedData.fetchStatus === 'completed'
      ? 'success'
      : cachedData.fetchStatus === 'cached'
        ? 'success-cached'
        : cachedData.fetchStatus === 'failed'
          ? 'error'
          : 'not-run'

  // Step 2: Processed - check processingStatus from new structure
  const processed: PipelineStepStatus =
    cachedData.processingStatus === 'completed'
      ? 'success'
      : cachedData.processingStatus === 'failed'
        ? 'error'
        : 'not-run'

  // Step 3: Extracted - check extractionScriptStatus from new structure
  let extracted: PipelineStepStatus = 'not-run'
  if (hasActiveScript) {
    extracted =
      cachedData.extractionScriptStatus === 'completed'
        ? 'success'
        : cachedData.extractionScriptStatus === 'failed'
          ? 'error'
          : 'not-run'
  }

  // Step 4: Validated - check schemaValidationStatus from new structure
  let validated: PipelineStepStatus = 'not-run'
  if (hasActiveSchema) {
    validated =
      cachedData.schemaValidationStatus === 'completed'
        ? 'success'
        : cachedData.schemaValidationStatus === 'failed'
          ? 'error'
          : 'not-run'
  }

  // Determine overall error message using new error fields
  let error: string | undefined
  if (fetched === 'error') {
    error = cachedData.fetchError ?? 'Failed to fetch URL'
  } else if (processed === 'error') {
    error = cachedData.processingError ?? 'Failed to process HTML'
  } else if (extracted === 'error') {
    // Extract error details from messages if available
    const exceptionMessages = cachedData.extractionMessages?.filter((msg) => msg.type === 'exception') ?? []
    if (exceptionMessages.length > 0) {
      const firstException = exceptionMessages[0].exception
      error = typeof firstException === 'string' ? firstException : firstException.message
    } else {
      error = 'Extraction script failed'
    }
  } else if (validated === 'error') {
    error = cachedData.schemaValidationErrors?.[0] ?? 'Data validation failed'
  }

  return {
    fetched,
    processed,
    extracted,
    validated,
    hasData: !!cachedData.html,
    lastRunAt: cachedData.url, // We can use URL as identifier for "when this was run"
    error
  }
}

/**
 * Get a human-readable label for each pipeline step
 */
export function getPipelineStepLabel(
  step: keyof Omit<DerivedPipelineStatus, 'hasData' | 'lastRunAt' | 'error'>
): string {
  switch (step) {
    case 'fetched':
      return 'Fetched'
    case 'processed':
      return 'Processed'
    case 'extracted':
      return 'Extracted'
    case 'validated':
      return 'Validated'
    default:
      return 'Unknown'
  }
}

/**
 * Get the overall pipeline status for badge display
 */
export function getOverallPipelineStatus(status: DerivedPipelineStatus): {
  stage: 'ready' | 'complete' | 'error'
  message: string
} {
  if (!status.hasData) {
    return {
      stage: 'ready',
      message: 'Ready'
    }
  }

  // Check for any errors
  if (status.error) {
    return {
      stage: 'error',
      message: 'Failed'
    }
  }

  // If we have data and no errors, it's complete
  return {
    stage: 'complete',
    message: 'Ready'
  }
}
