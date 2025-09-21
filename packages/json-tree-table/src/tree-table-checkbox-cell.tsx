import { Checkbox } from '@/components/ui/checkbox'
import { TableCell } from '@/components/ui/table'

import type { FlatNode, TreeNode } from './tree-table-editor'

export interface TreeTableCheckboxCellProps {
  node: TreeNode
  row: FlatNode
  updateCheckboxValue: (path: string[], value: boolean) => void
  disabled?: boolean
}

export function TreeTableCheckboxCell(props: TreeTableCheckboxCellProps) {
  const { node, row, updateCheckboxValue, disabled = false } = props

  let isPrimitive = false

  switch (node.type) {
    case 'String':
    case 'Number':
    case 'Boolean':
      isPrimitive = true
      break
    case 'Array':
    case 'Object':
    default:
  }

  return (
    <TableCell className='p-0'>
      <Checkbox
        disabled={disabled || !isPrimitive}
        className={'disabled:opacity-90'}
        checked={!isPrimitive ? false : node.checkboxValue}
        onCheckedChange={(checked) => {
          if (checked !== 'indeterminate' && !disabled) {
            updateCheckboxValue(row.path, checked)
          }
        }}
      />
    </TableCell>
  )
}
