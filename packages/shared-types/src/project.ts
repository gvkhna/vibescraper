import { z } from 'zod'

import type { ID, Timestamp } from './common'

// Project and estimation types
export interface Project {
  id: ID
  name: string
  description?: string
  status: ProjectStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  ownerId: ID
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived'

export interface EstimateItem {
  id: ID
  name: string
  description?: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  category?: string
}

export interface ProjectEstimate {
  id: ID
  projectId: ID
  items: EstimateItem[]
  subtotal: number
  tax?: number
  total: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Zod schemas
export const ProjectStatusSchema = z.enum(['draft', 'active', 'completed', 'archived'])

export const EstimateItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  category: z.string().optional()
})

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: ProjectStatusSchema,
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  ownerId: z.string()
})

export const ProjectEstimateSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  items: z.array(EstimateItemSchema),
  subtotal: z.number().min(0),
  tax: z.number().min(0).optional(),
  total: z.number().min(0),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
})
