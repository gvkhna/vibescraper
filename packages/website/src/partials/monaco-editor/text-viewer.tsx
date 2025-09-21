import { useEffect, useRef } from 'react'
import debug from 'debug'

import {
  type ExternalEditorRefHandle,
  MonacoTextEditor,
  type MonacoTextEditorProps
} from './monaco-text-editor'

const log = debug('app:viewer-text')

export function TextViewer({
  textData,
  lang = 'text'
}: {
  textData: string
  lang: MonacoTextEditorProps['lang']
}) {
  const editorRef = useRef<ExternalEditorRefHandle>(null)

  useEffect(() => {
    // This will run when the tab becomes active
    const handleTabFocus = () => {
      if (editorRef.current) {
        // Force a layout refresh
        editorRef.current.layout()
      }
    }

    globalThis.window.addEventListener('focus', handleTabFocus)
    return () => {
      globalThis.window.removeEventListener('focus', handleTabFocus)
    }
  }, [])

  return (
    <div className='flex h-full w-full'>
      <MonacoTextEditor
        ref={editorRef}
        value={textData}
        readOnly={true}
        theme='dark'
        lang={lang}
      />
    </div>
  )
}
