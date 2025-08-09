import {db} from '../db/db'
import {user} from '../db/schema'
import {eq} from 'drizzle-orm'

// Reserved usernames that should not be allowed
const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'superuser',
  'moderator',
  'mod',
  'api',
  'www',
  'mail',
  'email',
  'support',
  'help',
  'info',
  'contact',
  'about',
  'terms',
  'privacy',
  'legal',
  'blog',
  'news',
  'ftp',
  'ssh',
  'test',
  'demo',
  'beta',
  'alpha',
  'staging',
  'dev',
  'development',
  'production',
  'prod',
  'app',
  'application',
  'system',
  'null',
  'undefined',
  'anonymous',
  'guest',
  'user',
  'users',
  'account',
  'accounts',
  'profile',
  'profiles',
  'settings',
  'config',
  'configuration',
  'dashboard',
  'home',
  'index',
  'main',
  'default',
  'public',
  'private',
  'security',
  'auth',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'password',
  'reset',
  'forgot',
  'verify',
  'verification',
  'activate',
  'activation',
  'welcome'
])

/**
 * Validates a username according to the following rules:
 * - Only alphanumeric characters, underscores, and dots
 * - Must be between 3-30 characters
 * - Cannot start or end with a dot or underscore
 * - Cannot have consecutive dots or underscores
 * - Cannot be a reserved username
 * - Must be unique in the database
 */
export async function validateUsername(newUsername: string): Promise<boolean> {
  // Normalize the username (better-auth will do this too, but we want to validate the normalized version)
  const normalizedUsername = newUsername.toLowerCase().trim()

  // Check length
  if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
    return false
  }

  // Check for valid characters only (alphanumeric, underscore, dot)
  const validCharacterRegex = /^[a-z0-9_.]+$/
  if (!validCharacterRegex.test(normalizedUsername)) {
    return false
  }

  // Cannot start or end with dot or underscore
  if (
    normalizedUsername.startsWith('.') ||
    normalizedUsername.startsWith('_') ||
    normalizedUsername.endsWith('.') ||
    normalizedUsername.endsWith('_')
  ) {
    return false
  }

  // Cannot have consecutive dots or underscores
  if (
    normalizedUsername.includes('..') ||
    normalizedUsername.includes('__') ||
    normalizedUsername.includes('._') ||
    normalizedUsername.includes('_.')
  ) {
    return false
  }

  // Check against reserved usernames
  if (RESERVED_USERNAMES.has(normalizedUsername)) {
    return false
  }

  // Check for uniqueness in database
  try {
    const existingUser = await db
      .select({id: user.id})
      .from(user)
      .where(eq(user.username, normalizedUsername))
      .limit(1)

    if (existingUser.length > 0) {
      return false // Username already exists
    }

    return true
  } catch (error) {
    console.error('Error checking username uniqueness:', error)
    return false // Fail safe - reject if we can't check
  }
}

/**
 * Alternative sync validator for basic character validation
 * Use this if you want to do database checks separately
 */
export function validateUsernameFormat(username: string): boolean {
  const normalizedUsername = username.toLowerCase().trim()

  // Check length
  if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
    return false
  }

  // Check for valid characters only
  const validCharacterRegex = /^[a-z0-9_.]+$/
  if (!validCharacterRegex.test(normalizedUsername)) {
    return false
  }

  // Cannot start or end with dot or underscore
  if (
    normalizedUsername.startsWith('.') ||
    normalizedUsername.startsWith('_') ||
    normalizedUsername.endsWith('.') ||
    normalizedUsername.endsWith('_')
  ) {
    return false
  }

  // Cannot have consecutive dots or underscores
  if (
    normalizedUsername.includes('..') ||
    normalizedUsername.includes('__') ||
    normalizedUsername.includes('._') ||
    normalizedUsername.includes('_.')
  ) {
    return false
  }

  // Check against reserved usernames
  if (RESERVED_USERNAMES.has(normalizedUsername)) {
    return false
  }

  return true
}
/**
 * Check if a username is available (for frontend username availability checking)
 */
export async function isUsernameAvailable(username: string): Promise<{
  available: boolean
  reason?: string
}> {
  const normalizedUsername = username.toLowerCase().trim()

  // First check format
  if (!validateUsernameFormat(normalizedUsername)) {
    return {
      available: false,
      reason: 'Username contains invalid characters or format'
    }
  }

  // Check database
  try {
    const existingUser = await db
      .select({id: user.id})
      .from(user)
      .where(eq(user.username, normalizedUsername))
      .limit(1)

    if (existingUser.length > 0) {
      return {
        available: false,
        reason: 'Username is already taken'
      }
    }

    return {available: true}
  } catch (error) {
    console.error('Error checking username availability:', error)
    return {
      available: false,
      reason: 'Unable to check username availability'
    }
  }
}

/**
 * Generate username suggestions based on a desired username
 */
export async function generateUsernameSuggestions(desiredUsername: string): Promise<string[]> {
  const baseUsername = desiredUsername
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
  const suggestions: string[] = []

  // Try the base username first
  if (await isUsernameAvailable(baseUsername)) {
    suggestions.push(baseUsername)
  }

  // Generate variations
  const variations = [
    `${baseUsername}_`,
    `${baseUsername}.1`,
    `${baseUsername}1`,
    `${baseUsername}2`,
    `${baseUsername}3`,
    `_${baseUsername}`,
    `${baseUsername}_1`,
    `${baseUsername}_2`,
    `${baseUsername}.2`,
    `${baseUsername}.3`
  ]

  for (const variation of variations) {
    if (suggestions.length >= 5) {
      break
    } // Limit to 5 suggestions

    const result = await isUsernameAvailable(variation)
    if (result.available) {
      suggestions.push(variation)
    }
  }

  return suggestions
}

/**
 * Validate username and provide detailed error messages
 */
export function validateUsernameWithDetails(username: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const normalizedUsername = username.toLowerCase().trim()

  // Check length
  if (normalizedUsername.length < 3) {
    errors.push('Username must be at least 3 characters long')
  }
  if (normalizedUsername.length > 30) {
    errors.push('Username must be no more than 30 characters long')
  }

  // Check for valid characters only
  const validCharacterRegex = /^[a-z0-9_.]+$/
  if (!validCharacterRegex.test(normalizedUsername)) {
    errors.push('Username can only contain letters, numbers, underscores, and dots')
  }

  // Cannot start or end with dot or underscore
  if (normalizedUsername.startsWith('.') || normalizedUsername.startsWith('_')) {
    errors.push('Username cannot start with a dot or underscore')
  }
  if (normalizedUsername.endsWith('.') || normalizedUsername.endsWith('_')) {
    errors.push('Username cannot end with a dot or underscore')
  }

  // Cannot have consecutive dots or underscores
  if (normalizedUsername.includes('..')) {
    errors.push('Username cannot contain consecutive dots')
  }
  if (normalizedUsername.includes('__')) {
    errors.push('Username cannot contain consecutive underscores')
  }
  if (normalizedUsername.includes('._') || normalizedUsername.includes('_.')) {
    errors.push('Username cannot have dots and underscores next to each other')
  }

  // Check against reserved usernames
  if (RESERVED_USERNAMES.has(normalizedUsername)) {
    errors.push('This username is reserved and cannot be used')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// API route example for checking username availability
// pages/api/username/check.ts or app/api/username/check/route.ts
/*
export async function POST(request: Request) {
  const { username } = await request.json()

  if (!username || typeof username !== 'string') {
    return Response.json({ error: 'Username is required' }, { status: 400 })
  }

  const result = await isUsernameAvailable(username)
  return Response.json(result)
}
*/

// Frontend hook example for React
/*
import { useState, useCallback } from 'react'

export function useUsernameCheck() {
  const [isChecking, setIsChecking] = useState(false)
  const [availability, setAvailability] = useState<{
    available: boolean
    reason?: string
  } | null>(null)

  const checkUsername = useCallback(async (username: string) => {
    if (!username.trim()) {
      setAvailability(null)
      return
    }

    setIsChecking(true)
    try {
      const response = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
      const result = await response.json()
      setAvailability(result)
    } catch (error) {
      console.error('Error checking username:', error)
      setAvailability({
        available: false,
        reason: 'Error checking username'
      })
    } finally {
      setIsChecking(false)
    }
  }, [])

  return { checkUsername, isChecking, availability }
}
*/
