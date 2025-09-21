'use no memo'
import { type FC, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Define the data type for our table
type Person = {
  id: number
  name: string
  status: 'active' | 'inactive' | 'pending'
}

// Sample data
const defaultData: Person[] = [
  { id: 1, name: 'John Doe', status: 'active' },
  { id: 2, name: 'Jane Smith', status: 'inactive' },
  { id: 3, name: 'Bob Johnson', status: 'pending' }
]

// Status options for the dropdown
const statusOptions: Person['status'][] = ['active', 'inactive', 'pending']

const ShadcnDataTable: FC = () => {
  const [data, setData] = useState<Person[]>(() => [...defaultData])

  // Function to update status
  const updateStatus = (rowIndex: number, value: Person['status']) => {
    setData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            status: value
          }
        }
        return row
      })
    )
  }

  // Define columns
  const columns: ColumnDef<Person>[] = [
    // Row number column (smaller and more compact)
    {
      id: 'rowNumber',
      header: '#',
      cell: ({ row }) => <div className='w-6 text-center text-xs text-muted-foreground'>{row.index + 1}</div>,
      enableSorting: false
    },
    // Text column
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => <div className='py-1'>{getValue() as string}</div>
    },
    // Dropdown column with shadcn styling
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const rowIndex = row.index
        const status = row.getValue('status')

        return (
          <Select
            value={status as string}
            onValueChange={(value) => {
              updateStatus(rowIndex, value as Person['status'])
            }}
          >
            <SelectTrigger className='h-8 w-full'>
              <SelectValue placeholder='Select status' />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem
                  key={option}
                  value={option}
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
    }
  ]

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <div className='rounded-md border'>
      <Table className='text-sm'>
        <TableHeader className='bg-muted'>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className='h-9 font-medium'
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className='px-3 py-1.5'
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export const Route = createFileRoute('/sample-table')({
  component: RouteComponent
})

function RouteComponent() {
  return <ShadcnDataTable />
}
