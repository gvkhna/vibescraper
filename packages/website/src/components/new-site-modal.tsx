"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NewSiteModalProps {
  isOpen: boolean
  onClose: () => void
  onSiteCreated: (url: string, name: string) => void
}

export function NewSiteModal({ isOpen, onClose, onSiteCreated }: NewSiteModalProps) {
  const [url, setUrl] = React.useState("")
  const [siteName, setSiteName] = React.useState("")

  React.useEffect(() => {
    if (url) {
      try {
        const domain = new URL(url).hostname.replace('www.', '')
        const name = domain.split('.')[0]
        setSiteName(name.charAt(0).toUpperCase() + name.slice(1) + " Scraper")
      } catch {
        setSiteName("")
      }
    }
  }, [url])

  const handleCreate = () => {
    if (url && siteName) {
      onSiteCreated(url, siteName)
      setUrl("")
      setSiteName("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#151517] border-white/20">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
          <DialogDescription className="text-white/60">
            Enter the URL you want to scrape and give your site a name.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); }}
              placeholder="https://example.com"
              className="bg-[#0A0A0B] border-white/20 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              value={siteName}
              onChange={(e) => { setSiteName(e.target.value); }}
              placeholder="My Scraper"
              className="bg-[#0A0A0B] border-white/20 mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            className="bg-white/10 border-white/10 hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!url || !siteName}
            className="bg-[#3B82F6] hover:bg-[#3B82F6]/80"
          >
            Create Site
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
