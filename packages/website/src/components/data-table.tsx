"use client"

import * as React from "react"
import { Download, Eye, RefreshCw, Trash2 } from 'lucide-react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function DataTable() {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  
  const data = [
    { id: "1", product_name: "ACME Widget", price: 19.99, availability: true },
    { id: "2", product_name: "Super Tool", price: 29.99, availability: false },
    { id: "3", product_name: "Magic Device", price: 39.99, availability: true },
  ]

  const toggleRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="max-h-64 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">Extracted Data</div>
          <Badge variant="secondary" className="bg-white/10">
            {data.length} records
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 border-white/10 hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export ({selectedRows.length})
            </Button>
          )}
          
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 border-white/10 hover:bg-white/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-48">
        <Table>
          <TableHeader className="sticky top-0 bg-[#151517]">
            <TableRow className="border-white/10">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow 
                key={row.id} 
                className="border-white/10 hover:bg-white/5"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onCheckedChange={() => { toggleRow(row.id); }}
                  />
                </TableCell>
                <TableCell className="font-medium">{row.product_name}</TableCell>
                <TableCell className="font-mono">${row.price}</TableCell>
                <TableCell>
                  <Badge 
                    className={row.availability 
                      ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30" 
                      : "bg-red-400/20 text-red-400 border-red-400/30"
                    }
                  >
                    {row.availability ? "Available" : "Out of Stock"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
