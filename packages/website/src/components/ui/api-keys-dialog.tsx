import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react"

interface ApiKeysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeysDialog({ open, onOpenChange }: ApiKeysDialogProps) {
  const [showKey, setShowKey] = React.useState<string | null>(null)
  const [keys, setKeys] = React.useState([
    { id: "1", name: "Production API Key", key: "sk_prod_xxxxxxxxxxxxxxxxxxx", created: "2024-01-15" },
    { id: "2", name: "Development API Key", key: "sk_dev_yyyyyyyyyyyyyyyyyyyy", created: "2024-01-10" }
  ])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
          <DialogDescription>
            Manage your API keys for accessing the WebCrawler Studio API
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Generate New Key
            </Button>
          </div>
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{key.name}</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-muted-foreground font-mono">
                      {showKey === key.id ? key.key : key.key.replace(/./g, '•')}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => { setShowKey(showKey === key.id ? null : key.id); }}
                    >
                      {showKey === key.id ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => { copyToClipboard(key.key); }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {key.created}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}