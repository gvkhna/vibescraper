import {monaco as monacoNS} from './monaco-namespace'

export function options(readOnly = false): monacoNS.editor.IStandaloneEditorConstructionOptions {
  // Default editor options optimized for Markdown viewing/editing
  return {
    minimap: {enabled: false},
    scrollBeyondLastLine: false,
    lineNumbers: 'off',
    // Minimal gutter for cleaner markdown view
    lineNumbersMinChars: 1,
    glyphMargin: false,
    lineDecorationsWidth: 0,
    // Markdown benefits from word wrap for long paragraphs
    wordWrap: 'on',
    wrappingIndent: 'indent',
    // Standard markdown indentation
    tabSize: 2,
    // Use spaces instead of tabs
    insertSpaces: true,
    renderWhitespace: 'none',
    readOnly,
    fontSize: 13,
    fontFamily:
      '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Menlo, Consolas, "Courier New", monospace',
    renderControlCharacters: false,
    automaticLayout: true,
    // Disable suggestions for read-only viewing
    quickSuggestions: readOnly
      ? false
      : {
          other: true,
          comments: false,
          strings: false
        },
    acceptSuggestionOnEnter: readOnly ? 'off' : 'on',
    suggestOnTriggerCharacters: !readOnly,
    // Markdown-specific formatting
    formatOnType: false,
    formatOnPaste: false,
    // Bracket matching for markdown links
    bracketPairColorization: {
      enabled: true,
      independentColorPoolPerBracketType: true
    },
    matchBrackets: 'always',
    // Folding for markdown sections
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'always',
    // Disable hints for read-only mode
    parameterHints: {
      enabled: !readOnly
    },
    // Markdown suggestions
    suggest: readOnly
      ? {
          showWords: false,
          showSnippets: false,
          showIcons: false
        }
      : {
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
    // Enable semantic highlighting for markdown
    'semanticHighlighting.enabled': true,
    detectIndentation: true,
    // Better selection
    columnSelection: false,
    multiCursorModifier: 'ctrlCmd',
    // Disable code lens in read-only mode
    codeLens: readOnly ? false : true,
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
      enabled: !readOnly
    },
    lightbulb: {
      enabled: readOnly
        ? monacoNS.editor.ShowLightbulbIconMode.Off
        : monacoNS.editor.ShowLightbulbIconMode.OnCode
    },
    inlayHints: {
      enabled: readOnly ? 'off' : 'on'
    }
  }
}

export function beforeMount(monaco: typeof monacoNS, readOnly = false) {
  // Register markdown language features
  monaco.languages.registerCompletionItemProvider('markdown', {
    provideCompletionItems: (_model, position) => {
      if (readOnly) {
        return {suggestions: []}
      }

      const suggestions: monacoNS.languages.CompletionItem[] = []

      // Markdown snippets
      // const markdownSnippets = [
      //   {label: '# H1', insertText: '# ${1:Heading 1}', detail: 'Heading Level 1'},
      //   {label: '## H2', insertText: '## ${1:Heading 2}', detail: 'Heading Level 2'},
      //   {label: '### H3', insertText: '### ${1:Heading 3}', detail: 'Heading Level 3'},
      //   {label: '**bold**', insertText: '**${1:text}**', detail: 'Bold text'},
      //   {label: '*italic*', insertText: '*${1:text}*', detail: 'Italic text'},
      //   {label: '[link]', insertText: '[${1:text}](${2:url})', detail: 'Link'},
      //   {label: '![image]', insertText: '![${1:alt}](${2:url})', detail: 'Image'},
      //   {label: '```code```', insertText: '```${1:language}\n${2:code}\n```', detail: 'Code block'},
      //   {label: '`inline`', insertText: '`${1:code}`', detail: 'Inline code'},
      //   {label: '- list', insertText: '- ${1:item}', detail: 'Unordered list item'},
      //   {label: '1. list', insertText: '1. ${1:item}', detail: 'Ordered list item'},
      //   {label: '> quote', insertText: '> ${1:quote}', detail: 'Blockquote'},
      //   {label: '---', insertText: '---', detail: 'Horizontal rule'},
      //   {
      //     label: '| table |',
      //     insertText: '| ${1:Header} | ${2:Header} |\n| --- | --- |\n| ${3:Cell} | ${4:Cell} |',
      //     detail: 'Table'
      //   }
      // ]

      // markdownSnippets.forEach((snippet) => {
      //   suggestions.push({
      //     label: snippet.label,
      //     kind: monaco.languages.CompletionItemKind.Snippet,
      //     insertText: snippet.insertText,
      //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      //     detail: snippet.detail,
      //     range: {
      //       startLineNumber: position.lineNumber,
      //       endLineNumber: position.lineNumber,
      //       startColumn: position.column,
      //       endColumn: position.column
      //     }
      //   })
      // })

      return {suggestions}
    }
  })

  // Set markdown-specific configuration
  // monaco.languages.setLanguageConfiguration('markdown', {
  //   comments: {
  //     blockComment: ['<!--', '-->']
  //   },
  //   brackets: [
  //     ['[', ']'],
  //     ['(', ')'],
  //     ['{', '}']
  //   ],
  //   autoClosingPairs: [
  //     {open: '[', close: ']'},
  //     {open: '(', close: ')'},
  //     {open: '"', close: '"'},
  //     {open: "'", close: "'"},
  //     {open: '`', close: '`'},
  //     {open: '*', close: '*'},
  //     {open: '_', close: '_'},
  //     {open: '**', close: '**'},
  //     {open: '__', close: '__'},
  //     {open: '<!--', close: '-->'}
  //   ],
  //   surroundingPairs: [
  //     {open: '[', close: ']'},
  //     {open: '(', close: ')'},
  //     {open: '"', close: '"'},
  //     {open: "'", close: "'"},
  //     {open: '`', close: '`'},
  //     {open: '*', close: '*'},
  //     {open: '_', close: '_'},
  //     {open: '**', close: '**'},
  //     {open: '__', close: '__'}
  //   ],
  //   onEnterRules: [
  //     {
  //       beforeText: /^[-*+]\s+/,
  //       action: {indentAction: monaco.languages.IndentAction.None, appendText: '- '}
  //     },
  //     {
  //       beforeText: /^\d+\.\s+/,
  //       action: {indentAction: monaco.languages.IndentAction.None}
  //     }
  //   ]
  // })
}
