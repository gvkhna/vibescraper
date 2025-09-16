'use client'

import React from 'react'
import {ChevronDown} from './components/icons/chevron-down'
import {ChevronRight} from './components/icons/chevron-right'
import {Plus} from './components/icons/plus'
import {Minus} from './components/icons/minus'
// import {ChevronDown, ChevronRight, Plus, Minus} from 'lucide-react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {Input} from '@/components/ui/input'

import {TooltipDescription} from './tooltip-description'
import {cn} from '@/lib/utils'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {TreeTableValueField} from './tree-table-value-field'
import {TreeTableCheckboxCell} from './tree-table-checkbox-cell'
import debug from 'debug'
const log = debug('app:tree-table-editor')

const nodeTypes = {
  String: 'string',
  Number: 'number',
  Null: 'null',
  Boolean: 'boolean',
  Array: 'array',
  Object: 'object'
}

export type Primitive = string | number | boolean

export function isPrimitive(value: unknown): value is Primitive {
  const t = typeof value
  return t === 'string' || t === 'number' || t === 'boolean'
}

export type TreeNodeType = keyof typeof nodeTypes

export type TreeNode = {
  name: string
  type: TreeNodeType
  value: string | boolean | number | null
  title?: string
  checkboxValue?: boolean
  children?: TreeNode[] | null
  description?: string
  options?: string[]
  expanded?: boolean
  badge?: string
}

export interface TreeTableEditorProps extends Partial<Pick<HTMLDivElement, 'className'>> {
  schemaData: TreeNode[]
  schemaPrefillValues?: Record<string, Array<string>>
  onChange?: (data: TreeNode[]) => void
  enabledAddRootItemButton?: boolean
  disabledEditRootKeys?: boolean
  rootItemText?: string
  enableArray?: boolean
  enableCheckboxField?: boolean
  checkboxFieldName?: string
  disableCheckboxFieldEdit?: boolean
  enableCheckboxTooltip?: boolean
  enableValueField?: boolean
  disableValueFieldEdit?: boolean
  enableDescriptionTooltip?: boolean
  disableDescriptionEdit?: boolean
  disableEditTypes?: boolean
  disableResize?: boolean
  overhideHeaderKey?: string
  disableExpansionChevrons?: boolean
}

export type FlatNode = {
  node: TreeNode
  path: string[]
  depth: number
  expanded: boolean
  isArrayItem: boolean
  badge?: string
}

export function TreeTableEditor({schemaData, onChange, schemaPrefillValues, ...props}: TreeTableEditorProps) {
  const enabledAddRootItemButton = props.enabledAddRootItemButton ?? false
  const enableArray = props.enableArray ?? false
  // const enableRequireField = props.enableRequireField ?? false
  const enableCheckboxField = props.enableCheckboxField ?? false
  const checkboxFieldName = props.checkboxFieldName ?? 'Require'
  const disableCheckboxFieldEdit = props.disableCheckboxFieldEdit ?? false
  const enableCheckboxTooltip = props.enableCheckboxTooltip ?? true
  const enableValueField = props.enableValueField ?? false
  const disabledEditRootKeys = props.disabledEditRootKeys ?? false
  const enableDescriptionTooltip = props.enableDescriptionTooltip ?? false
  const disableDescriptionEdit = props.disableDescriptionEdit ?? false
  const disableEditTypes = props.disableEditTypes ?? false
  const disableValueFieldEdit = props.disableValueFieldEdit ?? false
  const disableResize = props.disableResize ?? false
  const disableExpansionChevrons = props.disableExpansionChevrons ?? false
  // Initialize expanded state to match initial node.expanded values
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
    const initialExpanded: Record<string, boolean> = {}

    const collectExpandedNodes = (nodes: TreeNode[], parentPath: string[] = []) => {
      nodes.forEach((node, index) => {
        const path = [...parentPath, index.toString()]
        const id = path.join('.')

        if (typeof node.expanded === 'boolean') {
          initialExpanded[id] = node.expanded
        }

        if (node.children) {
          collectExpandedNodes(node.children, [...path, 'children'])
        }
      })
    }

    collectExpandedNodes(schemaData)
    return initialExpanded
  })
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null)
  const [editingKey, setEditingKey] = React.useState<string | null>(null)
  const [editingKeyValue, setEditingKeyValue] = React.useState<string>('')
  const [columnWidths, setColumnWidths] = React.useState({key: 150, type: 100, checkbox: 10, value: 300})
  const [openValueSelector, setOpenValueSelector] = React.useState<string | null>(null)
  const tableRef = React.useRef<HTMLDivElement>(null)
  const resizingRef = React.useRef<{
    active: boolean
    column: keyof typeof columnWidths | null
    startX: number
    startWidth: number
  }>({
    active: false,
    column: null,
    startX: 0,
    startWidth: 0
  })

  // Update expanded state when schemaData changes
  React.useEffect(() => {
    const newExpanded: Record<string, boolean> = {}

    const collectExpandedNodes = (nodes: TreeNode[], parentPath: string[] = []) => {
      nodes.forEach((node, index) => {
        const path = [...parentPath, index.toString()]
        const id = path.join('.')

        if (typeof node.expanded === 'boolean') {
          newExpanded[id] = node.expanded
        }

        if (node.children) {
          collectExpandedNodes(node.children, [...path, 'children'])
        }
      })
    }

    collectExpandedNodes(schemaData)
    setExpanded(newExpanded)
  }, [schemaData])

  // log('tree table editor render')

  const flattenData = (
    nodes: TreeNode[],
    parentPath: string[] = [],
    depth = 0,
    parentType?: TreeNode['type']
  ): FlatNode[] => {
    return nodes.flatMap((node, index) => {
      const path = [...parentPath, index.toString()]
      const id = path.join('.')
      const isExpanded =
        typeof expanded[id] === 'boolean'
          ? expanded[id]
          : typeof node.expanded === 'boolean'
            ? node.expanded
            : false
      const isArray = node.type === 'Array'
      const isObject = node.type === 'Object'
      const isArrayItem = parentType === 'Array'

      const flatNode: FlatNode = {
        node: {
          ...node,
          value: isArray
            ? `(${node.children?.length ?? 0} items)`
            : isObject
              ? `(${node.children?.length ?? 0} values)`
              : node.value
        },
        path,
        depth,
        expanded: isExpanded,
        isArrayItem,
        badge: node.badge
      }

      if (isExpanded && (isArray || isObject)) {
        const children = node.children ?? []
        return [flatNode, ...flattenData(children, [...path, 'children'], depth + 1, node.type)]
      }
      return [flatNode]
    })
  }

  const rows = flattenData(schemaData)

  const getPredefinedValues = (key: string): string[] => {
    return []
    // return PREDEFINED_VALUES[key as keyof typeof PREDEFINED_VALUES] || []
  }

  const toggleExpand = (path: string[]) => {
    const id = path.join('.')
    setExpanded((prev) => ({...prev, [id]: !prev[id]}))
  }

  // const getNodeAtPath = (path: string[]): TreeNode | null => {
  //   let current: TreeNode | null = null
  //   for (const segment of path) {
  //     if (segment === 'children') {
  //       continue
  //     }
  //     if (Array.isArray(schemaData)) {
  //       const index = parseInt(segment)
  //       if (isNaN(index)) {
  //         return null
  //       }
  //       current = schemaData[index]
  //     }
  //   }
  //   return current
  // }

  const updateNodeAtPath = (path: string[], updater: (node: TreeNode) => TreeNode) => {
    const newData = [...schemaData]
    let current: TreeNode[] | TreeNode = newData
    let parentArray: TreeNode[] = newData

    for (let i = 0; i < path.length; i++) {
      const segment = path[i]

      if (segment === 'children' && typeof current === 'object' && 'children' in current) {
        current.children ??= []
        parentArray = current.children
        current = parentArray
        continue
      }

      const index = parseInt(segment)
      if (i === path.length - 1) {
        parentArray[index] = updater(parentArray[index])
      } else {
        current = parentArray[index]
        parentArray = current.children ?? []
      }
    }

    if (onChange) {
      onChange(newData)
    }
  }

  const updateDescriptionValue = (path: string[], value: string) => {
    updateNodeAtPath(path, (node) => {
      return {...node, description: value}
    })
  }

  const updateCheckboxValue = (path: string[], value: boolean) => {
    updateNodeAtPath(path, (node) => {
      return {...node, checkboxValue: value}
    })
  }

  const updateValue = (path: string[], value: TreeNode['value']) => {
    updateNodeAtPath(path, (node) => {
      let parsedValue = value
      if (node.type === 'Number') {
        parsedValue = Number(value)
        if (typeof parsedValue === 'number' && isNaN(parsedValue)) {
          parsedValue = 0
        }
      } else if (node.type === 'Boolean') {
        parsedValue = value
      }

      return {...node, value: parsedValue}
    })
  }

  const updateName = (path: string[], newName: string) => {
    updateNodeAtPath(path, (node) => ({
      ...node,
      name: newName
    }))
  }

  const updateType = (path: string[], newType: TreeNode['type']) => {
    updateNodeAtPath(path, (node) => {
      const newChildren = newType === 'Array' || newType === 'Object' ? [] : null
      let newValue = node.value

      if (newType === 'Array') {
        newValue = `(${newChildren?.length ?? 0} items)`
      } else if (newType === 'Object') {
        newValue = '(Dict)'
      } else {
        newValue = node.type === 'Boolean' ? false : ''
      }

      return {
        ...node,
        type: newType,
        value: newValue,
        children: newChildren
      } satisfies TreeNode
    })

    const id = path.join('.')
    if (newType === 'Array' || newType === 'Object') {
      setExpanded((prev) => ({...prev, [id]: true}))
    }
  }

  const addNewRootItem = () => {
    const newData = [
      ...schemaData,
      {
        name: `New Key 1`,
        type: 'String',
        value: ''
      } as TreeNode
    ]
    if (onChange) {
      onChange(newData)
    }
  }

  const addItem = (currentPath: string[]) => {
    log('addItem path', currentPath)
    const newData = [...schemaData]
    const id = currentPath.join('.')
    const currentNode = rows.find((row) => row.path.join('.') === id)

    if (!currentNode) {
      return
    }

    // Determine insertion path and index
    let parentPath = [...currentPath]
    let insertIndex = 0

    // If node is an expanded Object/Array, add as first child
    if ((currentNode.node.type === 'Object' || currentNode.node.type === 'Array') && expanded[id]) {
      // Add as first child of the current node
      parentPath = [...currentPath, 'children']
      insertIndex = 0
    } else {
      // Add after current node at same level
      // Find the row index in the flat structure
      const rowIndex = rows.findIndex((row) => row.path.join('.') === id)

      // Get the target depth
      const targetDepth = currentNode.depth

      // Find the next sibling index by looking for next row with same depth
      let nextSiblingIndex = -1
      for (let i = rowIndex + 1; i < rows.length; i++) {
        if (rows[i].depth < targetDepth) {
          // We've exited the parent, so no more siblings
          break
        }
        if (rows[i].depth === targetDepth) {
          // Found next sibling
          nextSiblingIndex = i
          break
        }
      }

      // Remove the last segment (index) from parentPath to get to parent level
      parentPath = currentPath.slice(0, -1)

      // If this is a root level node
      if (parentPath.length === 0) {
        insertIndex = parseInt(currentPath[0]) + 1
      } else {
        // If we found a next sibling, the index is from its path
        if (nextSiblingIndex !== -1) {
          insertIndex = parseInt(rows[nextSiblingIndex].path[rows[nextSiblingIndex].path.length - 1])
        } else {
          // Otherwise add at the end of parent's children
          const parentChildren = getParentChildren(newData, parentPath)
          insertIndex = parentChildren.length
        }
      }
    }

    // Helper to get parent's children array
    function getParentChildren(data: TreeNode[], path: string[]): TreeNode[] {
      if (path.length === 0) {
        return data
      }

      let current: TreeNode[] | null = data
      for (let i = 0; i < path.length; i++) {
        const segment = path[i]
        if (segment === 'children') {
          if (i + 1 < path.length) {
            const index = parseInt(path[i + 1])
            if (!isNaN(index) && current[index]) {
              current = current[index].children ?? []
              i++
            }
          }
        } else {
          const index = parseInt(segment)
          if (!isNaN(index) && current[index]) {
            current = current[index].children ?? []
          }
        }
      }
      return current
    }

    // Create new node with appropriate name
    let isParentArray = false
    const parentNodePath = parentPath.slice(0, -1)
    const parentNode = rows.find((r) => r.path.join('.') === parentNodePath.join('.'))
    if (parentPath.length > 0 && parentPath[parentPath.length - 1] === 'children') {
      isParentArray = parentNode?.node.type === 'Array'
    }

    // Create new item
    const newIndex = parentNode?.node.children ? parentNode.node.children.length : insertIndex
    const newNode: TreeNode = {
      name: isParentArray ? `` : `New Item ${newIndex + 1}`,
      type: 'String',
      value: ''
    }

    // Insert the node
    if (parentPath.length === 0) {
      // Root level insertion
      newData.splice(insertIndex, 0, newNode)
    } else {
      const parentChildren = getParentChildren(newData, parentPath)
      parentChildren.splice(insertIndex, 0, newNode)

      // Update parent display values if needed
      if (parentPath[parentPath.length - 1] === 'children') {
        const parentNodePath_ = parentPath.slice(0, -1)
        updateNodeAtPath(parentNodePath_, (node) => {
          if (node.type === 'Array') {
            return {...node, value: `(${node.children?.length ?? 0} items)`}
          } else if (node.type === 'Object') {
            return {...node, value: '(Object)'}
          }
          return node
        })
      }
    }
    if (onChange) {
      onChange(newData)
    }
  }

  const removeItem = (path: string[]) => {
    const newData = [...schemaData]

    // Handle root level items
    if (path.length === 1) {
      const index = parseInt(path[0])
      newData.splice(index, 1)
      if (onChange) {
        onChange(newData)
      }

      return
    }

    // Create a reference copy of the path
    const pathCopy = [...path]

    // Find the parent array that contains the item to remove
    let current: TreeNode[] | TreeNode = newData
    let parentArray: TreeNode[] | TreeNode = newData

    for (let i = 0; i < pathCopy.length - 1; i++) {
      const segment = pathCopy[i]

      if (segment === 'children') {
        // Skip the 'children' segment and handle it in the next iteration
        continue
      }

      const index = parseInt(segment)

      // Update the reference to the current node
      parentArray = current
      if (Array.isArray(current)) {
        current = current[index]
      }

      // If the next segment is 'children', move to the children array
      if (i + 1 < pathCopy.length && pathCopy[i + 1] === 'children') {
        parentArray = current
        current = current.children ?? []
        // Skip the 'children' segment in the next iteration
        i++
      }
    }

    // Get the index of the item to remove
    const removeIndex = parseInt(pathCopy[pathCopy.length - 1])

    // Remove the item from its parent array
    if (Array.isArray(current) && removeIndex >= 0 && removeIndex < current.length) {
      current.splice(removeIndex, 1)

      // Update parent node's value if it's an Array or Object
      if (pathCopy.includes('children')) {
        // Find the path to the parent node
        const parentPath: string[] = []
        for (let i = 0; i < pathCopy.length; i++) {
          if (pathCopy[i] === 'children') {
            break
          }
          parentPath.push(pathCopy[i])
        }

        // Update the parent node's value
        updateNodeAtPath(parentPath, (node) => {
          if (node.type === 'Array') {
            return {...node, value: `(${node.children?.length ?? 0} items)`}
          }
          return node
        })
      }
      if (onChange) {
        onChange(newData)
      }
    }
  }

  const startResize = (column: keyof typeof columnWidths, resizeEvent: unknown) => {
    if (
      typeof resizeEvent === 'object' &&
      resizeEvent &&
      'preventDefault' in resizeEvent &&
      typeof resizeEvent.preventDefault === 'function'
    ) {
      const fn = resizeEvent.preventDefault as () => void
      fn()
    }

    let pageX = 0
    if (
      typeof resizeEvent === 'object' &&
      resizeEvent &&
      'pageX' in resizeEvent &&
      typeof resizeEvent.pageX === 'number'
    ) {
      pageX = resizeEvent.pageX
    }

    resizingRef.current = {
      active: true,
      column,
      startX: pageX,
      startWidth: columnWidths[column]
    }

    const handleMouseMove = (e_: MouseEvent) => {
      if (!resizingRef.current.active) {
        return
      }

      const diff = e_.pageX - resizingRef.current.startX
      const newWidth = Math.max(100, resizingRef.current.startWidth + diff)

      setColumnWidths((prev) => ({
        ...prev,
        [resizingRef.current.column!]: newWidth
      }))
    }

    const handleMouseUp = () => {
      resizingRef.current.active = false
      globalThis.window.removeEventListener('mousemove', handleMouseMove)
      globalThis.window.removeEventListener('mouseup', handleMouseUp)
    }

    globalThis.window.addEventListener('mousemove', handleMouseMove)
    globalThis.window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <>
      <div
        ref={tableRef}
        className={cn('flex h-full min-h-0 w-full flex-col', props.className)}
      >
        <div className='min-h-0 flex-1 overflow-auto'>
          <div className='min-w-max'>
            <Table>
              <TableHeader>
                <TableRow className='border-b hover:bg-transparent dark:border-zinc-800'>
                  <TableHead
                    className='relative h-8 py-0'
                    {...(disableResize
                      ? {}
                      : {
                          style: {width: columnWidths.key}
                        })}
                  >
                    <div className='flex items-center justify-between text-nowrap whitespace-nowrap'>
                      <span>{props.overhideHeaderKey ?? 'Key'}</span>
                      <div
                        className={cn(
                          'absolute top-0 right-0 flex h-full w-1',
                          disableResize ? '' : 'cursor-col-resize'
                        )}
                        {...(disableResize
                          ? {}
                          : {
                              onMouseDown: (event) => {
                                startResize('key', event)
                              }
                            })}
                      >
                        <div
                          className='relative top-0 right-0 flex h-2/3 w-[1px] items-center self-center
                            bg-zinc-700/30 dark:bg-white/40'
                        ></div>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead
                    className='relative h-8 py-0'
                    {...(disableResize
                      ? {}
                      : {
                          style: {width: columnWidths.type}
                        })}
                  >
                    <div className='flex items-center justify-between text-nowrap whitespace-nowrap'>
                      <span>Type</span>
                      {(enableCheckboxField || enableValueField) && (
                        <div
                          className={cn(
                            'absolute top-0 right-0 flex h-full w-1',
                            disableResize ? '' : 'cursor-col-resize'
                          )}
                          {...(disableResize
                            ? {}
                            : {
                                onMouseDown: (event) => {
                                  startResize('type', event)
                                }
                              })}
                        >
                          <div
                            className='relative top-0 right-0 flex h-2/3 w-[1px] items-center self-center
                              bg-zinc-700/30 dark:bg-white/40'
                          ></div>
                        </div>
                      )}
                    </div>
                  </TableHead>
                  {enableCheckboxField && (
                    <TableHead
                      className={cn('relative h-8 py-0', enableCheckboxTooltip ? 'hover:underline' : '')}
                      {...(disableResize
                        ? {}
                        : {
                            style: {width: columnWidths.checkbox}
                          })}
                    >
                      {enableCheckboxTooltip ? (
                        <Tooltip delayDuration={450}>
                          <TooltipTrigger asChild>
                            <div className='flex items-center justify-between text-nowrap whitespace-nowrap'>
                              <span>{checkboxFieldName}</span>
                              {enableValueField && (
                                <div
                                  className={cn(
                                    'absolute top-0 right-0 flex h-full w-1',
                                    disableResize ? '' : 'cursor-col-resize'
                                  )}
                                  {...(disableResize
                                    ? {}
                                    : {
                                        onMouseDown: (event) => {
                                          startResize('checkbox', event)
                                        }
                                      })}
                                >
                                  <div
                                    className='relative top-0 right-0 flex h-2/3 w-[1px] items-center
                                      self-center bg-zinc-700/30 dark:bg-white/40'
                                  ></div>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Allow overriding this value in deployments</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className='flex items-center justify-between text-nowrap whitespace-nowrap'>
                          <span>{checkboxFieldName}</span>
                          {enableValueField && (
                            <div
                              className={cn(
                                'absolute top-0 right-0 flex h-full w-1',
                                disableResize ? '' : 'cursor-col-resize'
                              )}
                              {...(disableResize
                                ? {}
                                : {
                                    onMouseDown: (event) => {
                                      startResize('checkbox', event)
                                    }
                                  })}
                            >
                              <div
                                className='relative top-0 right-0 flex h-2/3 w-[1px] items-center self-center
                                  bg-zinc-700/30 dark:bg-white/40'
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )}
                  {enableValueField && (
                    <TableHead
                      className='relative h-8 py-0'
                      {...(disableResize
                        ? {}
                        : {
                            style: {width: columnWidths.value}
                          })}
                    >
                      <div className='flex items-center justify-between text-nowrap whitespace-nowrap'>
                        <span>Value</span>
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const id = row.path.join('.')
                  const isEditing = editingKey === id
                  const {node} = row

                  return (
                    <TableRow
                      key={id}
                      className='border-b dark:border-zinc-800 hover:dark:bg-zinc-900'
                      onMouseEnter={() => {
                        setHoveredRow(id)
                      }}
                      onMouseLeave={() => {
                        setHoveredRow(null)
                      }}
                    >
                      <TableCell
                        {...(disableResize
                          ? {}
                          : {
                              style: {width: columnWidths.key}
                            })}
                        className={cn('text-primary py-1', !enableDescriptionTooltip && 'px-4')}
                      >
                        <div
                          className='flex items-center'
                          style={{paddingLeft: `${row.depth * 10}px`}}
                        >
                          {enableDescriptionTooltip &&
                            (hoveredRow === id ? (
                              <TooltipDescription
                                disabled={disableDescriptionEdit}
                                description={node.description}
                                onDescriptionChange={(value) => {
                                  updateDescriptionValue(row.path, value)
                                }}
                              />
                            ) : (
                              <div className='mr-2 h-4 w-4'></div>
                            ))}

                          {!disableExpansionChevrons && (node.type === 'Object' || node.type === 'Array') && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='mr-1 h-4 w-4 p-0'
                              onClick={() => {
                                toggleExpand(row.path)
                              }}
                            >
                              {row.expanded ? (
                                <ChevronDown className='text-primary h-3 w-3' />
                              ) : (
                                <ChevronRight className='text-primary h-3 w-3' />
                              )}
                            </Button>
                          )}
                          {disableValueFieldEdit ? (
                            <div className='flex items-center gap-2'>
                              <span>
                                {row.isArrayItem
                                  ? `Item ${row.path[row.path.length - 1]}`
                                  : (node.title ?? node.name)}
                              </span>
                              {row.badge && (
                                <Badge
                                  variant='secondary'
                                  className='h-4 px-1.5 py-0 text-[10px]'
                                >
                                  {row.badge}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className='flex-1'>
                              {isEditing ? (
                                <Input
                                  value={editingKeyValue}
                                  autoFocus
                                  onChange={(e) => {
                                    setEditingKeyValue(e.target.value)
                                  }}
                                  onBlur={() => {
                                    updateName(row.path, editingKeyValue)
                                    setEditingKey(null)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateName(row.path, editingKeyValue)
                                      setEditingKey(null)
                                    } else if (e.key === 'Escape') {
                                      setEditingKey(null)
                                    }
                                  }}
                                  className='h-6 border-none bg-transparent p-0 text-sm focus-visible:ring-0
                                    focus-visible:ring-offset-0'
                                />
                              ) : (
                                <button
                                  onClick={() => {
                                    // console.log('row', row)
                                    if (!disabledEditRootKeys) {
                                      if (!row.isArrayItem) {
                                        setEditingKey(id)
                                        setEditingKeyValue(node.name)
                                      }
                                    }
                                  }}
                                  onDoubleClick={() => {
                                    if (!disabledEditRootKeys) {
                                      if (!row.isArrayItem) {
                                        setEditingKey(id)
                                        setEditingKeyValue(node.name)
                                      }
                                    }
                                  }}
                                  className={cn(
                                    'text-primary w-full text-left text-sm',
                                    !disableValueFieldEdit && 'hover:underline'
                                  )}
                                >
                                  <div className='flex items-center gap-2'>
                                    <span>
                                      {row.isArrayItem
                                        ? `Item ${row.path[row.path.length - 1]}`
                                        : (node.title ?? node.name)}
                                    </span>
                                    {row.badge && (
                                      <Badge
                                        variant='secondary'
                                        className='h-4 px-1.5 py-0 text-[10px]'
                                      >
                                        {row.badge}
                                      </Badge>
                                    )}
                                  </div>
                                </button>
                              )}
                            </div>
                          )}

                          {!disableValueFieldEdit && (
                            <div className='flex items-center gap-1 px-1'>
                              {!enableValueField &&
                                (node.type === 'Array' || node.type === 'Object') &&
                                isPrimitive(node.value) && (
                                  <span className='text-sm text-zinc-400'>{node.value}</span>
                                )}
                              {!disabledEditRootKeys &&
                                (hoveredRow === id ? (
                                  <>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='h-4 w-4 p-0'
                                      onClick={() => {
                                        addItem(row.path)
                                      }}
                                    >
                                      <Plus className='h-3 w-3' />
                                    </Button>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='h-4 w-4 p-0'
                                      onClick={() => {
                                        removeItem(row.path)
                                      }}
                                    >
                                      <Minus className='h-3 w-3' />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <div className='h-4 w-4'></div>
                                    <div className='h-4 w-4'></div>
                                  </>
                                ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        {...(disableResize
                          ? {}
                          : {
                              style: {width: columnWidths.type}
                            })}
                        className='text-primary px-4 py-1 text-nowrap'
                      >
                        {disableEditTypes ? (
                          <>{nodeTypes[node.type]}</>
                        ) : (
                          <Select
                            disabled={disableEditTypes}
                            value={node.type}
                            onValueChange={(value) => {
                              // updateType(row.path, value as TreeNode['type'])
                              const newType = value as TreeNode['type']
                              // console.log('update ', row.path, newType)
                              // if (newType.startsWith('Array-')) {
                              //   updateType(row.path, 'Array')
                              // } else {
                              updateType(row.path, newType)
                              // }
                            }}
                          >
                            {disableEditTypes ? (
                              <SelectValue
                                placeholder={node.type}
                                className=''
                              />
                            ) : (
                              <SelectTrigger
                                className='h-6 w-full border-none bg-transparent text-sm focus:ring-0
                                  focus:ring-offset-0 disabled:opacity-80'
                              >
                                <SelectValue placeholder={node.type} />
                              </SelectTrigger>
                            )}

                            <SelectContent>
                              <SelectGroup>
                                {Object.keys(nodeTypes).map((key, index) => {
                                  if (key === 'Array' && !enableArray) {
                                    return <React.Fragment key={key} />
                                  }
                                  return (
                                    <SelectItem
                                      key={key}
                                      value={key}
                                    >
                                      {(nodeTypes as Record<string, string>)[key]}
                                    </SelectItem>
                                  )
                                })}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      {enableCheckboxField && (
                        <TreeTableCheckboxCell
                          node={node}
                          row={row}
                          updateCheckboxValue={updateCheckboxValue}
                          disabled={disableCheckboxFieldEdit}
                        />
                      )}
                      {enableValueField && (
                        <TableCell
                          {...(disableResize
                            ? {}
                            : {
                                style: {width: columnWidths.value}
                              })}
                          className={cn(
                            'px-4 py-1 text-zinc-400',
                            disableResize ? 'w-full' : '',
                            disableValueFieldEdit && node.type === 'String'
                              ? 'text-zinc-600 dark:text-zinc-300'
                              : '',
                            disableValueFieldEdit && (node.type === 'Boolean' || node.type === 'Number')
                              ? 'text-blue-500'
                              : '',
                            disableValueFieldEdit && node.type === 'Null' ? 'text-[#d33682]' : ''
                          )}
                        >
                          {disableValueFieldEdit ? (
                            <>{node.value}</>
                          ) : (
                            <TreeTableValueField
                              id={id}
                              row={row}
                              node={node}
                              updateValue={updateValue}
                              disableValueFieldEdit={disableValueFieldEdit}
                              openValueSelector={openValueSelector}
                              setOpenValueSelector={setOpenValueSelector}
                              getPredefinedValues={getPredefinedValues}
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        {enabledAddRootItemButton && (
          <div className='flex-shrink-0 border-t p-2 text-black dark:border-zinc-800'>
            <Button
              variant='outline'
              size='sm'
              onClick={addNewRootItem}
              className='h-7'
            >
              <Plus className='mr-1 h-3 w-3' /> {props.rootItemText ?? 'Add Root Item'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
