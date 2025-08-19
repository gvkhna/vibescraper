import {monaco as monacoNS} from './monaco-namespace'

export function options(readOnly = false): monacoNS.editor.IStandaloneEditorConstructionOptions {
  // Default editor options optimized for HTML viewing
  return {
    minimap: {enabled: false},
    scrollBeyondLastLine: false,
    lineNumbers: 'off',
    // Minimal gutter for cleaner view
    lineNumbersMinChars: 1,
    glyphMargin: false,
    lineDecorationsWidth: 0,
    // HTML can be long lines, word wrap helps viewing
    wordWrap: 'on',
    wrappingIndent: 'indent',
    // Standard indentation for HTML
    tabSize: 2,
    insertSpaces: true,
    renderWhitespace: 'none',
    readOnly,
    fontSize: 13,
    fontFamily:
      '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Menlo, Consolas, "Courier New", monospace',
    renderControlCharacters: false,
    automaticLayout: true,
    // Disable suggestions for read-only viewing
    quickSuggestions: false,
    acceptSuggestionOnEnter: 'off',
    suggestOnTriggerCharacters: false,
    // Auto-format for better viewing
    formatOnType: false,
    formatOnPaste: false,
    // Bracket matching for HTML tags
    bracketPairColorization: {
      enabled: true,
      independentColorPoolPerBracketType: true
    },
    matchBrackets: 'always',
    // Folding for HTML elements
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'always',
    // Disable hints for read-only mode
    parameterHints: {
      enabled: false
    },
    // Disable suggestions in read-only mode
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
    // Enable semantic highlighting for HTML
    'semanticHighlighting.enabled': true,
    detectIndentation: true,
    // Better selection
    columnSelection: false,
    multiCursorModifier: 'ctrlCmd',
    // Disable code lens in read-only mode
    codeLens: false,
    // Enable find widget with enhanced settings
    find: {
      seedSearchStringFromSelection: 'always',
      autoFindInSelection: 'never',
      addExtraSpaceOnTop: true,
      loop: true,
      cursorMoveOnType: true
    },
    // Disable hover in read-only mode
    hover: {
      enabled: false
    },
    lightbulb: {
      enabled: monacoNS.editor.ShowLightbulbIconMode.Off
    },
    inlayHints: {
      enabled: 'off'
    }
  }
}

export function beforeMount(monaco: typeof monacoNS, readOnly = false) {
  monaco.languages.html.htmlDefaults.setOptions({
    format: {
      tabSize: 2,
      insertSpaces: true,
      // No line length limit for better formatting
      wrapLineLength: 120,
      // Format all elements
      unformatted: '',
      // Format content in all elements
      contentUnformatted: '',
      indentInnerHtml: true,
      preserveNewLines: true,
      maxPreserveNewLines: 1,
      indentHandlebars: false,
      endWithNewline: false,
      extraLiners: 'head, body, /html',
      // Auto wrap attributes
      wrapAttributes: 'auto'
    },
    suggest: {
      html5: true
    }
  })

  // Configure HTML mode configuration
  monaco.languages.html.htmlDefaults.setModeConfiguration({
    completionItems: !readOnly,
    hovers: !readOnly,
    documentSymbols: true,
    links: true,
    documentHighlights: true,
    rename: false,
    colors: true,
    foldingRanges: true,
    diagnostics: !readOnly,
    selectionRanges: true,
    documentFormattingEdits: true,
    documentRangeFormattingEdits: true
  })
}
