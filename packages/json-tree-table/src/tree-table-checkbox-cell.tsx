import {TableCell} from '@/components/ui/table'
import {Checkbox} from '@/components/ui/checkbox'
import type {TreeNode, FlatNode} from './tree-table-editor'

export interface TreeTableCheckboxCellProps {
  node: TreeNode
  row: FlatNode
  updateCheckboxValue: (path: string[], value: boolean) => void
}

export function TreeTableCheckboxCell(props: TreeTableCheckboxCellProps) {
  const {node, row, updateCheckboxValue} = props

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
        disabled={!isPrimitive}
        className={'disabled:opacity-20'}
        checked={!isPrimitive ? false : node.checkboxValue}
        onCheckedChange={(checked) => {
          if (checked !== 'indeterminate') {
            updateCheckboxValue(row.path, checked)
          }
        }}
      />
    </TableCell>
  )
}
