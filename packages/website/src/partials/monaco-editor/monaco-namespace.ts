import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
// import 'monaco-editor/esm/vs/editor/editor.api'
// // Language contributions you actually need
// import 'monaco-editor/esm/vs/language/typescript/monaco.contribution'
// import 'monaco-editor/esm/vs/language/json/monaco.contribution'
// import 'monaco-editor/esm/vs/language/html/monaco.contribution'
// import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
// import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
// import 'monaco-editor/esm/vs/basic-languages/html/html.contribution'
// import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution'
// Workers
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

declare global {
  interface Window {
    MonacoEnvironment: monaco.Environment | undefined
  }
}

globalThis.window.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'html') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

loader.config({ monaco })

// loader.init().then(/* ... */);

export { monaco }
