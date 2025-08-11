import {useRef, useEffect, forwardRef, useImperativeHandle, useState} from 'react'
import {Editor, type OnMount} from '@monaco-editor/react'
import {monaco as monacoNS} from './monaco-namespace'
import debug from 'debug'
const log = debug('app:monaco-json')

// Types for custom completions
export interface CustomCompletion {
  label: string
  insertText?: string
  documentation?: string
  snippet?: boolean
}

// Types for editor props
export interface MonacoJsonEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  onSave?: () => void
  // height?: string
  // width?: string
  readOnly?: boolean
  options?: monacoNS.editor.IStandaloneEditorConstructionOptions
}

export interface ExternalEditorRefHandle {
  layout: () => void
}

export const MonacoJsonEditor = forwardRef<ExternalEditorRefHandle, MonacoJsonEditorProps>(
  ({value, onChange, readOnly = false, onSave, options = {}}, ref) => {
    // const externalEditorRef = useRef<any>(null)
    const [isVisible, setIsVisible] = useState(true)

    const editorRef = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(ref, () => ({
      layout: () => {
        if (editorRef.current) {
          editorRef.current.layout()
        }
      }
    }))

    useEffect(() => {
      const handleVisibilityChange = () => {
        // This will trigger when tab switching happens and
        // the component becomes visible again
        if (globalThis.document.visibilityState === 'visible') {
          setIsVisible(true)

          // Force editor layout and refresh
          if (editorRef.current) {
            setTimeout(() => {
              editorRef.current?.layout()
              // Force model update to trigger completion provider
              const model = editorRef.current?.getModel()
              if (model) {
                const value_ = model.getValue()
                model.setValue(value_)
              }
            }, 10)
          }
        } else {
          setIsVisible(false)
        }
      }

      globalThis.document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        globalThis.document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }, [])

    // useEffect(() => {
    //   const editorCurrent = editorRef.current
    //   if (!editorCurrent) return

    //   const model = editorCurrent.getModel()
    //   if (model) {
    //     log('Updating model custom data with completions:', customCompletions) // Log model updates
    //     // model.updateOptions({ customData: { customCompletions } });
    //   }
    // }, [customCompletions])

    // This effect handles layout changes
    useEffect(() => {
      const handleResize = () => {
        if (editorRef.current) {
          log('monaco relayout')
          editorRef.current.layout()
        }
      }

      globalThis.window.addEventListener('resize', handleResize)

      // Create a ResizeObserver to detect container size changes
      const resizeObserver = new ResizeObserver(handleResize)
      const editorContainer = containerRef.current
      if (editorContainer) {
        resizeObserver.observe(editorContainer)
      }

      return () => {
        globalThis.window.removeEventListener('resize', handleResize)
        if (editorContainer) {
          resizeObserver.disconnect()
        }
      }
    }, [])

    // Handle editor did mount
    const handleEditorDidMount: OnMount = (editorCurrent) => {
      // Log editor mount
      log('Editor mounted with model:', editorCurrent.getModel()?.uri.toString())
      editorRef.current = editorCurrent

      const model = editorCurrent.getModel()
      if (model) {
        const value_ = model.getValue()
        // This small trick forces Monaco to refresh its state
        model.setValue(value_)
      }

      editorCurrent.addCommand(
        // This is Cmd+S on Mac, Ctrl+S on Windows
        monacoNS.KeyMod.CtrlCmd | monacoNS.KeyCode.KeyS,
        () => {
          // Bubble the save event up to the parent component
          if (onSave) {
            onSave()
          }
        }
      )

      editorCurrent.onDidChangeModelContent(() => {
        if (editorRef.current) {
          // log('model did change')
          editorRef.current.layout()
        }
      })
    }

    // Default editor options
    const defaultOptions: monacoNS.editor.IStandaloneEditorConstructionOptions = {
      minimap: {enabled: false},
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      wordWrap: 'on',
      wrappingIndent: 'same',
      tabSize: 4,
      renderWhitespace: 'selection',
      readOnly,
      fontSize: 14,
      renderControlCharacters: true,
      automaticLayout: true,
      // quickSuggestions: {
      //   other: true,
      //   comments: true,
      //   strings: true
      // },
      acceptSuggestionOnEnter: 'on',
      // suggestOnTriggerCharacters: true,
      // wordBasedSuggestions: 'off', // Don't show word-based suggestions, only our handlebars ones
      // parameterHints: {
      //   enabled: true
      // },
      suggest: {
        snippetsPreventQuickSuggestions: false,
        showIcons: true,
        showStatusBar: true,
        preview: true
        // filteredTypes: {
        //   keyword: false,
        //   snippet: false
        // }
      },
      scrollbar: {
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        vertical: 'auto',
        horizontal: 'auto'
      }
    }

    return (
      <div className='relative flex w-full flex-1 flex-col'>
        <div
          // className='flex w-full flex-1 flex-col'
          className='absolute inset-0'
          ref={containerRef}
        >
          <Editor
            height={'100%'}
            width={'100%'}
            language='jsonc'
            value={value}
            onChange={onChange}
            onMount={handleEditorDidMount}
            options={{...defaultOptions, ...options}}
          />
        </div>
      </div>
    )
  }
)

MonacoJsonEditor.displayName = 'MonacoTextEditor'
