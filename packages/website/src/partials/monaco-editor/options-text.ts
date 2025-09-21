import { monaco as monacoNS } from './monaco-namespace'

export function options(readOnly = false): monacoNS.editor.IStandaloneEditorConstructionOptions {
  // Default editor options optimized for plaintext viewing
  return {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'off',
    // Minimal gutter for cleaner text view
    lineNumbersMinChars: 1,
    glyphMargin: false,
    lineDecorationsWidth: 0,
    // Plaintext benefits from word wrap for long lines
    wordWrap: 'on',
    wrappingIndent: 'none',
    // Standard text indentation
    tabSize: 4,
    // Use spaces instead of tabs
    insertSpaces: true,
    renderWhitespace: 'none',
    readOnly,
    fontSize: 13,
    fontFamily:
      '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Menlo, Consolas, "Courier New", monospace',
    renderControlCharacters: false,
    automaticLayout: true,
    // Disable all suggestions for plaintext
    quickSuggestions: false,
    acceptSuggestionOnEnter: 'off',
    suggestOnTriggerCharacters: false,
    // No formatting for plaintext
    formatOnType: false,
    formatOnPaste: false,
    // Minimal bracket matching
    bracketPairColorization: {
      enabled: false
    },
    matchBrackets: 'never',
    // Simple folding
    folding: false,
    // Disable all hints
    parameterHints: {
      enabled: false
    },
    // No suggestions for plaintext
    suggest: {
      showWords: false,
      showSnippets: false,
      showIcons: false
    },
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      vertical: 'auto',
      horizontal: 'auto'
    },
    // Disable semantic highlighting for plaintext
    'semanticHighlighting.enabled': false,
    detectIndentation: false,
    // Better selection
    columnSelection: false,
    multiCursorModifier: 'ctrlCmd',
    // No code lens for plaintext
    codeLens: false,
    // Enable find widget with enhanced settings
    find: {
      seedSearchStringFromSelection: 'always',
      autoFindInSelection: 'never',
      addExtraSpaceOnTop: true,
      loop: true,
      cursorMoveOnType: true
    },
    // Disable hover for plaintext
    hover: {
      enabled: false
    },
    lightbulb: {
      enabled: monacoNS.editor.ShowLightbulbIconMode.Off
    },
    inlayHints: {
      enabled: 'off'
    },
    // Simple cursor style
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    // No rulers for plaintext
    rulers: [],
    // Disable highlighting of active line
    renderLineHighlight: 'none',
    // Disable occurrences highlighting
    occurrencesHighlight: 'off',
    // Disable selection highlighting
    selectionHighlight: false,
    // No links in plaintext
    links: false,
    // Context menu can be useful for copy operations
    contextmenu: true
  }
}

export function beforeMount(monaco: typeof monacoNS, readOnly = false) {
  // For plaintext, we don't need any special language features
  // The 'plaintext' language is built-in to Monaco and doesn't need configuration

  // Optionally set some basic configuration for plaintext
  monaco.languages.setLanguageConfiguration('plaintext', {
    // Simple word pattern for plaintext
    // wordPattern: /(-?\d*\.\d\w*)|([^\s]+)/g,
    // No comments in plaintext
    comments: {},
    // No brackets
    brackets: [],
    // No auto-closing pairs
    autoClosingPairs: [],
    // No surrounding pairs
    surroundingPairs: []
  })
}
