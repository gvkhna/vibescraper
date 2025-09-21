"use client"

import * as React from "react"
import { BarChart3, ChevronLeft, ChevronRight, Code, Database, FileText, MessageCircle, Paperclip, Send, Sparkles } from 'lucide-react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface AISidebarProps {
  currentUrl: string
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AISidebar({ currentUrl, collapsed, onToggleCollapse }: AISidebarProps) {
  const [message, setMessage] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("chat")

  if (collapsed) {
    return (
      <div className="w-12 bg-[#151517] border-l border-white/10 flex flex-col items-center py-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="mt-4">
          <Sparkles className="w-5 h-5 text-[#3B82F6]" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-[#151517] border-l border-white/10 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#3B82F6]" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30 text-xs">
            Online
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-white hover:bg-white/10 w-8 h-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Context */}
      <div className="px-4 py-3 bg-[#0A0A0B] border-b border-white/10 flex-shrink-0">
        <div className="text-xs text-white/60 mb-1">Current context:</div>
        <div className="text-sm font-mono truncate text-white/80">{currentUrl}</div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-white/10 rounded-none h-12 px-4 flex-shrink-0">
          <TabsTrigger value="chat" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="schema" className="gap-2">
            <Database className="w-4 h-4" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <Code className="w-4 h-4" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0">
          <ChatInterface message={message} onMessageChange={setMessage} />
        </TabsContent>

        <TabsContent value="schema" className="flex-1 m-0 p-4">
          <SchemaEditor />
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 p-4">
          <CodeViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ChatInterface({ message, onMessageChange }: { 
  message: string
  onMessageChange: (message: string) => void 
}) {
  const messages = [
    {
      type: "system",
      content: "I can see the current page content. What would you like to extract?"
    },
    {
      type: "user", 
      content: "Extract the product name and price from this page"
    },
    {
      type: "ai",
      content: "I can see a product with the name 'ACME Widget' and price '$19.99'. Would you like me to create a schema for extracting this data?",
      actions: ["Apply this schema", "Run extraction", "Test on current page"]
    }
  ]

  return (
    <>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 p-4 space-y-3 flex-shrink-0">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {[
            "Extract data",
            "Define schema", 
            "Start crawling",
            "Check issues"
          ].map((action) => (
            <Button
              key={action}
              variant="secondary"
              size="sm"
              className="bg-white/10 border-white/10 hover:bg-white/20 text-xs"
            >
              {action}
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => { onMessageChange(e.target.value); }}
              placeholder="Describe what you want to extract..."
              className="bg-[#0A0A0B] border-white/20 resize-none pr-10"
              rows={2}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 w-6 h-6 text-white/60 hover:bg-white/10"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
          <Button
            size="icon"
            className="bg-[#3B82F6] hover:bg-[#3B82F6]/80 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  )
}

function ChatMessage({ message }: { 
  message: { 
    type: string
    content: string
    actions?: string[] 
  } 
}) {
  const isUser = message.type === "user"
  const isSystem = message.type === "system"

  if (isSystem) {
    return (
      <div className="text-center text-sm text-white/60 py-2">
        {message.content}
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-lg p-3 ${
        isUser 
          ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/30' 
          : 'bg-[#0A0A0B] border border-white/10'
      }`}>
        <div className="text-sm leading-relaxed">{message.content}</div>
        {message.actions && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.actions.map((action) => (
              <Button
                key={action}
                variant="secondary"
                size="sm"
                className="bg-white/10 border-white/10 hover:bg-white/20 text-xs"
              >
                {action}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SchemaEditor() {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Current Schema (v2)</div>
      <div className="bg-[#0D1117] rounded-lg p-4 font-mono text-sm border border-white/10">
        <pre className="text-gray-300 leading-relaxed">
{`{
  "product_name": "string",
  "price": "number", 
  "availability": "boolean",
  "description": "string"
}`}
        </pre>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="bg-[#3B82F6] hover:bg-[#3B82F6]/80">
          Test Schema
        </Button>
        <Button size="sm" variant="secondary" className="bg-white/10 border-white/10 hover:bg-white/20">
          Edit
        </Button>
      </div>
    </div>
  )
}

function CodeViewer() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Extraction Code</div>
        <Badge variant="secondary" className="bg-white/10 text-xs">Auto-generated</Badge>
      </div>
      <div className="bg-[#0D1117] rounded-lg p-4 font-mono text-sm border border-white/10">
        <pre className="text-gray-300 leading-relaxed">
{`const extractData = (page) => {
  return {
    product_name: page.querySelector('h1')?.textContent,
    price: parseFloat(
      page.querySelector('.price')?.textContent?.replace('$', '')
    ),
    availability: !page.querySelector('.out-of-stock')
  }
}`}
        </pre>
      </div>
      <Button size="sm" className="bg-[#3B82F6] hover:bg-[#3B82F6]/80">
        Test Code
      </Button>
    </div>
  )
}
