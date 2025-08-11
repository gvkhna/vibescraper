import {useEffect, useRef} from 'react'
import {MonacoJsonEditor, type ExternalEditorRefHandle} from './monaco-json-editor'
import type {ProjectPublicId} from '@/db/schema'
import {TextEditorContextProvider} from './text-editor-context'
import debug from 'debug'

const log = debug('app:viewer-text')

export function ViewerText(props: {publicId: ProjectPublicId; textFileData: TextDefinition}) {
  const {publicId, textFileData} = props
  const editorRef = useRef<ExternalEditorRefHandle>(null)

  useEffect(() => {
    // This will run when the tab becomes active
    const handleTabFocus = () => {
      if (editorRef.current) {
        // Force a layout refresh
        editorRef.current.layout()

        // If you can access the actual Monaco editor instance:
        // This part is optional but would help ensure the editor
        // gets fully refreshed when switching tabs
        // const editor = (editorRef.current as any)._editor
        // if (editor) {
        //   const model = editor.getModel() // eslint-disable-line @typescript-eslint/no-unsafe-call
        //   if (model) {
        //     // Force a model refresh to reinitialize the completion provider
        //     const value = model.getValue() // eslint-disable-line @typescript-eslint/no-unsafe-call
        //     model.setValue(value) // eslint-disable-line @typescript-eslint/no-unsafe-call
        //   }
        // }
      }
    }

    globalThis.window.addEventListener('focus', handleTabFocus)
    return () => {
      globalThis.window.removeEventListener('focus', handleTabFocus)
    }
  }, [])

  return (
    <TextEditorContextProvider publicId={publicId}>
      <MonacoJsonEditor
        ref={editorRef}
        value={textFileData}
        readOnly={true}
      />
    </TextEditorContextProvider>
  )
}
