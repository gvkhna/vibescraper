"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Plus } from 'lucide-react'
// import { useToast } from "@/hooks/use-toast"

type KeyItem = { id: string; label: string; lastUsed: string; masked: string }

export function ApiKeysDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  // const { toast } = useToast()
  const [keys, setKeys] = React.useState<KeyItem[]>([
    { id: "1", label: "Production", lastUsed: "Today", masked: "sk_live_****4F6A" },
    { id: "2", label: "Development", lastUsed: "2d ago", masked: "sk_test_****1B2C" },
  ])
  const [label, setLabel] = React.useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[rgba(26,26,27,0.5)] backdrop-blur-md border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
          <DialogDescription className="text-white/60">
            Manage authentication for API access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-3">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                className="bg-white/5 border-white/10"
                value={label}
                onChange={(e) => { setLabel(e.target.value); }}
                placeholder="e.g., Staging"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <Button
                className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/80"
                onClick={() => {
                  if (!label.trim()) {return}
                  setKeys((ks) => [
                    ...ks,
                    { id: Math.random().toString(36).slice(2), label, lastUsed: "Never", masked: "sk_****" },
                  ])
                  setLabel("")
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Create Key
              </Button>
            </div>
          </div>
          <ScrollArea className="h-48 rounded-md border border-white/10">
            <div className="divide-y divide-white/10">
              {keys.map((k) => (
                <div key={k.id} className="p-3 flex items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{k.label}</div>
                    <div className="text-xs text-white/50">Last used: {k.lastUsed}</div>
                  </div>
                  <div className="hidden sm:block text-sm text-white/70">{k.masked}</div>
                  <Button
                    variant="ghost"
                    className="hover:bg-white/10"
                    onClick={() => { console.log("Copied to clipboard"); }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="secondary" className="bg-white/10 border-white/10 hover:bg-white/20" onClick={() => { onOpenChange(false); }}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
