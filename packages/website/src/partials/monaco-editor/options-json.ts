import { monaco as monacoNS } from './monaco-namespace'

export function options(readOnly = false): monacoNS.editor.IStandaloneEditorConstructionOptions {
  // Default editor options optimized for JSON editing
  return {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    // JSON typically looks better without word wrap
    wordWrap: 'off',
    wrappingIndent: 'indent',
    // Standard for JSON
    tabSize: 2,
    // Use spaces instead of tabs
    insertSpaces: true,
    renderWhitespace: 'selection',
    readOnly,
    fontSize: 13,
    fontFamily:
      '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Menlo, Consolas, "Courier New", monospace',
    renderControlCharacters: true,
    automaticLayout: true,
    // Enable quick suggestions for JSON
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true
    },
    acceptSuggestionOnEnter: 'on',
    suggestOnTriggerCharacters: true,
    // JSON-specific formatting
    formatOnType: true,
    formatOnPaste: true,
    // Bracket matching
    bracketPairColorization: {
      enabled: true,
      independentColorPoolPerBracketType: true
    },
    matchBrackets: 'always',
    // Folding
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',
    // Validation and hints
    parameterHints: {
      enabled: true
    },
    suggest: {
      snippetsPreventQuickSuggestions: false,
      showIcons: true,
      showStatusBar: true,
      preview: true,
      insertMode: 'replace'
    },
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      vertical: 'auto',
      horizontal: 'auto'
    },
    // JSON error detection
    'semanticHighlighting.enabled': true,
    detectIndentation: true,
    // Better selection
    columnSelection: false,
    multiCursorModifier: 'ctrlCmd'
    // Comments support for JSONC
  }
}

export function beforeMount(monaco: typeof monacoNS, readOnly = false) {
  // Configure JSON defaults for strict JSON
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    // Don't allow comments in strict JSON
    allowComments: false,
    // Error on trailing commas
    trailingCommas: 'error',
    // Error on comments
    comments: 'error',
    // You can add JSON schemas here if needed
    schemas: [],
    enableSchemaRequest: false
  })

  // Configure Monaco editor defaults
  monaco.languages.json.jsonDefaults.setModeConfiguration({
    documentFormattingEdits: true,
    documentRangeFormattingEdits: true,
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    tokens: true,
    colors: true,
    foldingRanges: true,
    diagnostics: true,
    selectionRanges: true
  })
}
