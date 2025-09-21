import { z } from 'zod'

// Common utility types
export type ID = string
export type Timestamp = Date | string

// Response wrapper type
export interface ApiResponse<T = unknown> {
  data: T
  success: boolean
  message?: string
  error?: string
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Common Zod schemas for validation
export const IdSchema = z.string().min(1)
export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})
