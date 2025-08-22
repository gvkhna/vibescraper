import * as React from 'react'
import type {JsonValue} from 'type-fest'
import {TreeTableEditor} from './tree-table-editor'
import {jsonObjectToSchemaTable} from './json-object-to-schema-table'

export interface JsonTreeTableProps {
  data: JsonValue | undefined
  className?: string
  expandLevel?: number
}

export function JsonTreeTable({data, className, expandLevel = 1}: JsonTreeTableProps) {
  const schemaData = React.useMemo(() => {
    // Handle cases where data can't be converted to schema table
    if (data === undefined || typeof data !== 'object' || data === null) {
      return []
    }
    return jsonObjectToSchemaTable(data, expandLevel)
  }, [data, expandLevel])

  // Handle undefined case
  if (data === undefined) {
    return (
      <div className={className}>
        <div className='p-4 text-center text-slate-400'>
          <div className='text-sm font-medium'>No Data</div>
          <div className='text-xs'>Data is undefined</div>
        </div>
      </div>
    )
  }

  // Handle primitive values that can't be converted to schema table
  if (typeof data !== 'object' || data === null) {
    return (
      <div className={className}>
        <div className='p-4 text-center text-slate-400'>
          <div className='text-sm font-medium'>{data === null ? 'null' : String(data)}</div>
          <div className='text-xs'>{typeof data} value</div>
        </div>
      </div>
    )
  }

  return (
    <TreeTableEditor
      schemaData={schemaData}
      className={className}
      // Disable all editing features
      enabledAddRootItemButton={false}
      disabledEditRootKeys={true}
      enableArray={true}
      enableCheckboxField={false}
      enableValueField={true}
      disableValueFieldEdit={true}
      enableDescriptionTooltip={false}
      disableDescriptionEdit={true}
      disableEditTypes={true}
      disableResize={true}
      overhideHeaderKey={Array.isArray(data) ? 'Item' : 'Key'}
    />
  )
}
