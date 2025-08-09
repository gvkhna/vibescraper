"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Search, RefreshCw, Trash2, Filter, PanelBottomClose, Database, FileJson, FileSpreadsheet } from 'lucide-react'

interface DataPanelProps {
  onClose: () => void
}

export function DataPanel({ onClose }: DataPanelProps) {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const data = [
    { id: "1", product_name: "ACME Widget", price: 19.99, availability: true, extracted_at: "2025-08-07 11:24" },
    { id: "2", product_name: "Super Tool", price: 29.99, availability: false, extracted_at: "2025-08-07 11:23" },
    { id: "3", product_name: "Magic Device", price: 39.99, availability: true, extracted_at: "2025-08-07 11:22" },
    { id: "4", product_name: "Pro Gadget", price: 49.99, availability: true, extracted_at: "2025-08-07 11:21" },
    { id: "5", product_name: "Elite Kit", price: 59.99, availability: false, extracted_at: "2025-08-07 11:20" },
  ]

  const filteredData = data.filter(item => 
    item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    )
  }

  const toggleAll = () => {
    setSelectedRows(prev => 
      prev.length === filteredData.length ? [] : filteredData.map(row => row.id)
    )
  }

  return (
    <div className="h-full bg-[#151517] border-t border-white/10 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[#3B82F6]" />
          <h2 className="font-medium">Extracted Data</h2>
          <Badge variant="secondary" className="bg-white/10 text-xs">
            {filteredData.length} records
          </Badge>
          <div className="text-xs text-white/60">
            Success: 98.4% • Updated: 2m ago
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10 w-8 h-8"
          >
            <PanelBottomClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/40" />
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              className="bg-[#0A0A0B] border-white/20 pl-7 h-7 w-48 text-sm"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 h-7"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filter
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/10 border-white/10 hover:bg-white/20 h-7 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Re-process ({selectedRows.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </>
          )}
          
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 border-white/10 hover:bg-white/20 h-7 text-xs"
          >
            <FileJson className="w-3 h-3 mr-1" />
            JSON
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 border-white/10 hover:bg-white/20 h-7 text-xs"
          >
            <FileSpreadsheet className="w-3 h-3 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-[#151517] z-10">
            <TableRow className="border-white/10">
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-white/80">Product</TableHead>
              <TableHead className="text-white/80">Price</TableHead>
              <TableHead className="text-white/80">Status</TableHead>
              <TableHead className="text-white/80">Extracted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
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
                <TableCell className="font-mono text-sm">${row.price}</TableCell>
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
                <TableCell className="text-white/60 font-mono text-xs">
                  {row.extracted_at}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
