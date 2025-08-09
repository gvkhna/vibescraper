import {useRef, useEffect, forwardRef, useImperativeHandle, useState} from 'react'
import {Editor, type OnMount, useMonaco} from '@monaco-editor/react'
import {monaco as monacoNS} from './monaco-namespace'
import debug from 'debug'
const log = debug('app:monaco')

// Types for custom completions
export interface CustomCompletion {
  label: string
  insertText?: string
  documentation?: string
  snippet?: boolean
}

// Types for editor props
export interface MonacoCodeEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  onSave?: () => void
  customCompletions?: CustomCompletion[]
  // height?: string
  // width?: string
  readOnly?: boolean
  options?: monacoNS.editor.IStandaloneEditorConstructionOptions
}

// This function configures Code language support with Monaco

export const useCodeMonaco = (customCompletions: CustomCompletion[] = []): typeof monacoNS | null => {
  const monacoInstance = useMonaco()
  const initialized = useRef(false)

  return monacoInstance
}

export interface ExternalEditorRefHandle {
  layout: () => void
}

export const MonacoCodeEditor = forwardRef<ExternalEditorRefHandle, MonacoCodeEditorProps>(
  ({value, onChange, customCompletions = [], readOnly = false, onSave, options = {}}, ref) => {
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

    // Use our custom hook for Monaco setup
    // const monacoInstance = useCodeMonaco(customCompletions)

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
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      acceptSuggestionOnEnter: 'on',
      suggestOnTriggerCharacters: true,
      // Don't show word-based suggestions, only our handlebars ones
      wordBasedSuggestions: 'off',
      parameterHints: {
        enabled: true
      },
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
            language='javascript'
            theme='javascriptTheme'
            value={value}
            onChange={onChange}
            onMount={handleEditorDidMount}
            beforeMount={(monaco) => {
              // Allow JS files to be checked
              monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ESNext,
                module: monaco.languages.typescript.ModuleKind.ESNext,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                allowNonTsExtensions: true,
                allowJs: true,
                checkJs: true,
                noEmit: true
              })

              // Turn diagnostics back on
              monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false,

                // suppress "Cannot find module '...'"" (TS2307) for *all* imports
                // Top level await only allowed with esnext (TS1378)
                // variable declared but never read (TS6133)
                diagnosticCodesToIgnore: [2307, 1378, 6133]
              })

              // Inject your "jest.d.ts" stub so `test` & `expect` show up
              // TODO: add more expect matchers here
              //               monaco.languages.typescript.javascriptDefaults.addExtraLib(
              //                 `
              // /**
              //  * test() registers a test.
              //  */
              // declare function test(description: string, fn: () => void | Promise<void>): void;

              // declare namespace test {
              //   /**
              //    * Run only this test.
              //    */
              //   function only(description: string, fn: () => void | Promise<void>): void;

              //   /**
              //    * Skip this test.
              //    */
              //   function skip(description: string, fn: () => void | Promise<void>): void;
              // }

              // declare function expect<T>(actual: T): {
              //   toBe(expected: T): void;
              //   toEqual(expected: any): void;
              //   toBeTruthy(expected: T): void
              //   toBeFalsy(expected: T): void
              //   toBeDefined(expected: T): void
              //   toBeInstanceOf(clazz: any, expected: T): void
              //   toBeUndefined(expected: T): void
              //   toBeNull(expected: T): void
              //   toBeNaN(expected: T): void
              //   toMatch(pattern: RegExp | string): void
              //   toHaveProperty(propName: string, expected: T): void
              //   toHaveLength(length: number, expected: T): void
              //   toContain(item: any, expected: T): void
              //   toThrow(error?: RegExp | string, expected: T): void

              //   // comparison
              //   toBeGreaterThan(number: number, expected: T): void
              //   toBeGreaterThanOrEqual(number: number, expected: T): void
              //   toBeLessThan(number: number, expected: T): void
              //   toBeLessThanOrEqual(number: number, expected: T): void

              //   // mock calls
              //   toHaveBeenCalled(): void
              //   toHaveBeenCalledTimes(times: number): void
              //   toHaveBeenCalledWith(...args: any[]): void
              //   toHaveBeenLastCalledWith(...args: any[]): void
              //   toHaveBeenNthCalledWith(nth: number, ...args: any[]): void
              //   toHaveReturnedWith(expected: any): void
              //   toHaveReturned(): void
              //   toHaveLastReturnedWith(expected: any): void
              //   toHaveReturnedTimes(times: number): void
              //   toHaveNthReturnedWith(nth: number, expected: any): void
              // };
              // `,
              //                 'inmemory://model/test.d.ts'
              //               )
            }}
            options={{...defaultOptions, ...options}}
          />
        </div>
      </div>
    )
  }
)

MonacoCodeEditor.displayName = 'MonacoCodeEditor'
