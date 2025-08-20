/* eslint-disable no-console */
// Demo file showing how to use shared types across packages
import type {ContactFormData, Project, ProjectStatus} from '@vibescraper/shared-types'
import {ContactFormSchema, ProjectSchema} from '@vibescraper/shared-types'

// Example usage of shared types
const exampleContact: ContactFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  company: 'ACME Corp',
  message: 'I need an site scraped.'
}

// Example validation using shared schemas
try {
  const validatedContact = ContactFormSchema.parse(exampleContact)
  // const validatedProject = ProjectSchema.parse(exampleProject)

  console.log('Validated contact:', validatedContact)
  // console.log('Validated project:', validatedProject)
} catch (error) {
  console.error('Validation failed:', error)
}

export {exampleContact}
