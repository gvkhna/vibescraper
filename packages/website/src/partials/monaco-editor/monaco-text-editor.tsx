import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Editor, type OnMount } from '@monaco-editor/react'
import debug from 'debug'

import { nowait } from '@/lib/async-utils'

import { monaco as monacoNS } from './monaco-namespace'
import { beforeMount as htmlBeforeMount, options as htmlOptions } from './options-html'
import { beforeMount as jsBeforeMount, options as jsOptions } from './options-js'
import { beforeMount as jsonBeforeMount, options as jsonOptions } from './options-json'
import { beforeMount as mdBeforeMount, options as mdOptions } from './options-md'
import { beforeMount as textBeforeMount, options as textOptions } from './options-text'
const log = debug('app:monaco-text')

// Types for editor props
export interface MonacoTextEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  onSave?: () => void
  // height?: string
  // width?: string
  readOnly?: boolean
  options?: monacoNS.editor.IStandaloneEditorConstructionOptions
  theme?: 'light' | 'dark'
  lang: 'html' | 'md' | 'json' | 'text' | 'js'
}

export interface ExternalEditorRefHandle {
  layout: () => void
}

export const MonacoTextEditor = forwardRef<ExternalEditorRefHandle, MonacoTextEditorProps>(
  ({ value, onChange, readOnly = false, lang, onSave, options = {}, theme = 'dark' }, ref) => {
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
          log('monaco resize')
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
    const handleEditorDidMount: OnMount = (editorCurrent, monaco) => {
      // Log editor mount
      log('Editor mounted with model:', editorCurrent.getModel()?.uri.toString())
      editorRef.current = editorCurrent

      // Add keyboard commands for find functionality
      // Cmd+F / Ctrl+F - Open find widget
      editorCurrent.addCommand(monacoNS.KeyMod.CtrlCmd | monacoNS.KeyCode.KeyF, () => {
        const findAction = editorCurrent.getAction('actions.find')
        if (findAction) {
          nowait(findAction.run())
        }
      })

      // Cmd+G / Ctrl+G - Find next
      editorCurrent.addCommand(monacoNS.KeyMod.CtrlCmd | monacoNS.KeyCode.KeyG, () => {
        const findNextAction = editorCurrent.getAction('editor.action.nextMatchFindAction')
        if (findNextAction) {
          nowait(findNextAction.run())
        }
      })

      // Cmd+Shift+G / Ctrl+Shift+G - Find previous
      editorCurrent.addCommand(
        monacoNS.KeyMod.CtrlCmd | monacoNS.KeyMod.Shift | monacoNS.KeyCode.KeyG,
        () => {
          const findPrevAction = editorCurrent.getAction('editor.action.previousMatchFindAction')
          if (findPrevAction) {
            nowait(findPrevAction.run())
          }
        }
      )

      // Escape - Close find widget
      editorCurrent.addCommand(monacoNS.KeyCode.Escape, () => {
        const closeFindAction = editorCurrent.getAction('closeFindWidget')
        if (closeFindAction) {
          nowait(closeFindAction.run())
        }
      })

      if (!readOnly) {
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
      }

      editorCurrent.onDidChangeModelContent(() => {
        if (editorRef.current) {
          // log('model did change')
          editorRef.current.layout()
        }
      })
    }

    const monacoLang =
      lang === 'json'
        ? 'json'
        : lang === 'md'
          ? 'markdown'
          : lang === 'text'
            ? 'plaintext'
            : lang === 'js'
              ? 'javascript'
              : lang
    const defaultOptions =
      lang === 'json'
        ? jsonOptions(readOnly)
        : lang === 'html'
          ? htmlOptions(readOnly)
          : lang === 'js'
            ? jsOptions(readOnly)
            : lang === 'md'
              ? mdOptions(readOnly)
              : textOptions(readOnly)

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
            language={monacoLang}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={value}
            onChange={onChange}
            onMount={handleEditorDidMount}
            options={{
              ...defaultOptions,
              ...{
                readOnly
              },
              ...options
            }}
            beforeMount={(monaco) => {
              if (lang === 'json') {
                jsonBeforeMount(monaco, readOnly)
              } else if (lang === 'html') {
                htmlBeforeMount(monaco, readOnly)
              } else if (lang === 'js') {
                jsBeforeMount(monaco, readOnly)
              } else if (lang === 'md') {
                mdBeforeMount(monaco, readOnly)
              } else {
                textBeforeMount(monaco, readOnly)
              }
            }}
          />
        </div>
      </div>
    )
  }
)

MonacoTextEditor.displayName = 'MonacoTextEditor'
