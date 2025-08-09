import { z } from 'zod'

// API request/response types
export interface ContactFormData {
  name: string
  email: string
  company?: string
  message: string
}

export interface LeadData extends ContactFormData {
  source: string
  timestamp: Date
  userId?: string
}

// Zod schemas for API validation
export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email(),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export const LeadDataSchema = ContactFormSchema.extend({
  source: z.string(),
  timestamp: z.date(),
  userId: z.string().optional(),
})