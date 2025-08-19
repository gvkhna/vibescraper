import {monaco as monacoNS} from './monaco-namespace'

export function options(readOnly = false): monacoNS.editor.IStandaloneEditorConstructionOptions {
  // Default editor options
  return {
    minimap: {enabled: false},
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'on',
    wrappingIndent: 'same',
    tabSize: 2,
    renderWhitespace: 'selection',
    fontSize: 13,
    renderControlCharacters: true,
    automaticLayout: true,
    // quickSuggestions: {
    //   other: true,
    //   comments: true,
    //   strings: true
    // },
    quickSuggestions: false,
    acceptSuggestionOnEnter: 'on',
    suggestOnTriggerCharacters: true,
    // Don't show word-based suggestions, only our handlebars ones
    wordBasedSuggestions: 'off',
    parameterHints: {
      enabled: false
    },
    suggest: {
      snippetsPreventQuickSuggestions: false,
      showIcons: true,
      showStatusBar: false,
      preview: false
      // showKeywords: false,
      // showVariables: false,
      // showFunctions: false,
      // showClasses: false,
      // showInterfaces: false,
      // showStructs: false,
      // showProperties: false,
      // showMethods: false,
      // showEnumMembers: false,
      // showConstants: false,
      // showModules: false,
      // showSnippets: false,
      // showValues: false,
      // showColors: false,
      // showUnits: false,
      // showFiles: false,
      // showFolders: false,
      // showOperators: false,
      // showReferences: false
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
}

export function beforeMount(monaco: typeof monacoNS, readOnly = false) {
  // Allow JS files to be checked
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    noEmit: true,
    noLib: true
  })

  // Turn diagnostics back on
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,

    // suppress "Cannot find module '...'"" (TS2307) for *all* imports
    // Top level await only allowed with esnext (TS1378)
    // variable declared but never read (TS6133)
    diagnosticCodesToIgnore: [2307, 1378, 6133, 7044]
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
}
