'use client'

import * as React from 'react'
import { objectRootMetaSchema, validateDataAgainstSchema } from '@vibescraper/json-schemas'
import { JsonSchemaTable } from '@vibescraper/json-tree-table'
import debug from 'debug'
import { AlertCircle, AlertTriangle, ChevronRight, FileJson2, X } from 'lucide-react'
import type { JsonObject } from 'type-fest'

import { EmptyStateData } from '@/components/empty-state-data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/use-store'

const log = debug('app:tab-data-schema')

interface SchemaWarning {
  type: 'missing-primary-key' | 'invalid-structure' | 'primary-key-not-required'
  title: string
  description: string
  severity: 'warning' | 'error'
}

// Validate schema and return warnings
function validateSchema(schema: JsonObject): SchemaWarning[] {
  const warnings: SchemaWarning[] = []

  // Check if schema is a valid object type with properties
  if (schema.type !== 'object') {
    warnings.push({
      type: 'invalid-structure',
      title: 'Invalid Schema Structure',
      description: 'Schema must have type "object" at the root level',
      severity: 'error'
    })
    // Return early if basic structure is invalid
    return warnings
  }

  if (
    !schema.properties ||
    typeof schema.properties !== 'object' ||
    Object.keys(schema.properties).length === 0
  ) {
    warnings.push({
      type: 'invalid-structure',
      title: 'No Properties Defined',
      description: 'Schema must define at least one property',
      severity: 'error'
    })
  }

  if (!Array.isArray(schema.required) || schema.required.length === 0) {
    warnings.push({
      type: 'invalid-structure',
      title: 'No Required Fields',
      description: 'Schema should define at least one required field',
      severity: 'warning'
    })
  }

  // Check for x-primary-key
  const primaryKey = schema['x-primary-key'] as string | undefined
  if (!primaryKey) {
    warnings.push({
      type: 'missing-primary-key',
      title: 'Primary Key Missing',
      description:
        'Objects need a unique primary key for versioning and duplicate detection. Add x-primary-key field.',
      severity: 'warning'
    })
  } else if (typeof primaryKey === 'string') {
    // Check if primary key is in required array
    if (Array.isArray(schema.required) && !schema.required.includes(primaryKey)) {
      warnings.push({
        type: 'primary-key-not-required',
        title: 'Primary Key Not Required',
        description: `Primary key "${primaryKey}" should be in required fields to ensure uniqueness.`,
        severity: 'warning'
      })
    }
    // Check if primary key exists in properties
    if (schema.properties && typeof schema.properties === 'object' && !(primaryKey in schema.properties)) {
      warnings.push({
        type: 'invalid-structure',
        title: 'Primary Key Property Missing',
        description: `Property "${primaryKey}" not found in schema.`,
        severity: 'error'
      })
    }
  }

  return warnings
}

export function TabDataSchema() {
  // Get project and schema from store
  const projectPublicId = useStore((state) => state.projectSlice.project?.project.publicId)
  const loadSchemas = useStore((state) => state.extractorSlice.loadSchemas)
  const projectSchemas = useStore((state) => state.extractorSlice.projectSchemas)

  // Derive schemas from projectSchemas
  const schemas = projectPublicId ? (projectSchemas[projectPublicId]?.schemas ?? null) : null

  // Get the active schema version from project commit
  const activeSchemaVersion = useStore((state) => state.extractorSlice.projectCommit?.activeSchemaVersion)

  // Get the active schema from the reactive schemas array
  const activeSchema = React.useMemo(() => {
    if (!schemas || !activeSchemaVersion) {
      return null
    }
    return schemas.find((s) => s.version === activeSchemaVersion) ?? null
  }, [schemas, activeSchemaVersion])

  // Check if schema has valid structure for JsonSchemaTable
  const isValidSchemaStructure = React.useMemo(() => {
    if (!activeSchema?.schemaJson) {
      return false
    }
    try {
      const result = validateDataAgainstSchema(objectRootMetaSchema, activeSchema.schemaJson as JsonObject, [
        objectRootMetaSchema
      ])
      return result.success
    } catch (e) {
      log('Error validating schema structure:', e)
      return false
    }
  }, [activeSchema?.schemaJson])

  // Validate the schema and get warnings (only if structure is valid)
  const warnings = React.useMemo(() => {
    if (!activeSchema?.schemaJson || !isValidSchemaStructure) {
      return []
    }
    try {
      return validateSchema(activeSchema.schemaJson as JsonObject)
    } catch (e) {
      log('Error validating schema:', e)
      return []
    }
  }, [activeSchema?.schemaJson, isValidSchemaStructure])

  const [showWarnings, setShowWarnings] = React.useState(false)

  // Load schemas on mount if not already loaded
  React.useEffect(() => {
    if (projectPublicId) {
      loadSchemas(projectPublicId).catch((err: unknown) => {
        log('Error loading schemas:', err)
      })
    }
  }, [projectPublicId, loadSchemas])

  // Show empty state if no schema
  if (!activeSchema?.schemaJson) {
    return (
      <EmptyStateData
        icon={FileJson2}
        title='No Data Schema'
        description='No schema is defined for this project'
        details='Create or edit the schema to specify what data to extract'
      />
    )
  }

  // Show error state if schema structure is invalid
  if (!isValidSchemaStructure) {
    return (
      <EmptyStateData
        icon={AlertCircle}
        title='Invalid Schema Format'
        description='The schema structure is malformed or incorrect'
        details='Click "Schema JSON" in the dropdown above to view and fix the raw schema'
      />
    )
  }

  // Show the schema using JsonSchemaTable
  return (
    <div className='relative h-full'>
      {/* Warning indicator button */}
      {warnings.length > 0 && (
        <div className='absolute top-4 right-4 z-10'>
          {!showWarnings ? (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setShowWarnings(true)
              }}
              className={cn(
                'h-auto gap-2 px-3 py-1.5 font-medium',
                'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
                'dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25',
                'border border-amber-500/30 dark:border-amber-500/40'
              )}
            >
              <AlertTriangle className='h-4 w-4' />
              <span className='text-xs'>
                {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
              </span>
              <ChevronRight className='h-3 w-3' />
            </Button>
          ) : (
            <div
              className='max-w-md min-w-[320px] rounded-lg border border-amber-500/40 bg-amber-50/95 p-4
                shadow-lg backdrop-blur dark:border-amber-500/50 dark:bg-amber-950/90'
            >
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <AlertTriangle className='h-4 w-4 text-amber-700 dark:text-amber-400' />
                  <h3 className='text-sm font-semibold text-amber-950 dark:text-amber-100'>
                    Schema Validation
                  </h3>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setShowWarnings(false)
                  }}
                  className='h-6 w-6 p-0 hover:bg-amber-600/20 dark:hover:bg-amber-400/20'
                >
                  <X className='h-4 w-4 text-amber-800 dark:text-amber-300' />
                </Button>
              </div>
              <div className='space-y-3'>
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className='space-y-1'
                  >
                    <h4 className='text-sm font-medium text-amber-950 dark:text-amber-50'>{warning.title}</h4>
                    <p className='text-sm leading-relaxed text-amber-800 dark:text-amber-100'>
                      {warning.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <JsonSchemaTable
        data={activeSchema.schemaJson}
        className='font-mono text-xs'
      />
    </div>
  )
}
