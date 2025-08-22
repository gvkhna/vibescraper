import type {Meta, StoryObj} from '@storybook/react'
import {type FC, type PropsWithChildren, useState} from 'react'
import {ScrollArea} from '@/components/ui/scroll-area'

import {type TreeNode, TreeTableEditor} from './tree-table-editor'
import {schemaTableToJsonSchema} from './schema-table-to-json-schema'
import {TooltipProvider} from '@/components/ui/tooltip'

const initialTreeData: TreeNode[] = [
  {
    name: 'A_FILLED_STRING',
    type: 'Array',
    value: '',
    children: [
      {
        name: '',
        type: 'String',
        value: ''
      }
    ],
    checkboxValue: true
  },
  {
    name: 'A_EMTPY_STRING',
    type: 'String',
    value: ''
  },
  {
    name: 'DICT_VAR',
    type: 'Object',
    value: '(Object)',
    children: [
      {
        name: 'New Item #0',
        type: 'String',
        value: ''
      }
    ]
  },
  {
    name: 'NUMBER_VAR',
    type: 'Number',
    value: ''
  },
  {
    name: 'BOOL_VAR',
    type: 'Boolean',
    value: false
  }
  // {
  //   name: 'My File',
  //   type: 'Binary',
  //   value: ''
  // }
]

const PREDEFINED_VALUES = {
  'Bundle version string (short)': ['$(MARKETING_VERSION)', '1.0.0', '2.0.0'],
  'Bundle identifier': ['$(PRODUCT_BUNDLE_IDENTIFIER)', 'com.example.app'],
  'Bundle name': ['$(PRODUCT_NAME)', 'MyApp'],
  'Default localization': ['$(DEVELOPMENT_LANGUAGE)', 'en', 'es', 'fr'],
  'Executable file': ['$(EXECUTABLE_NAME)', 'MyApp'],
  'Bundle OS Type code': ['$(PRODUCT_BUNDLE_PACKAGE_TYPE)', 'APPL'],
  'Bundle version': ['$(CURRENT_PROJECT_VERSION)', '1', '2']
}

const meta = {
  title: 'TreeTableEditor',
  component: TreeTableEditor,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    schemaData: initialTreeData
  },
  argTypes: {
    onChange: {action: 'updated'} // This allows Storybook to track changes
  }
} satisfies Meta<typeof TreeTableEditor>

export default meta
type Story = StoryObj<typeof meta>

const TableEditorLayout = (props: PropsWithChildren<object>) => {
  return (
    <TooltipProvider>
      <main className='flex flex-col items-center justify-between p-4'>
        <div className='w-full max-w-7xl'>
          <h1 className='mb-4 text-2xl font-bold'>JSON Tree Editor</h1>
          <ScrollArea>{props.children}</ScrollArea>
        </div>
      </main>
    </TooltipProvider>
  )
}

const TableEditorLayoutDark = (props: PropsWithChildren<object>) => {
  return (
    <TooltipProvider>
      <main className='dark flex flex-col items-center justify-between bg-zinc-950 p-4 text-white'>
        <div className='w-full max-w-7xl'>
          <h1 className='mb-4 text-2xl font-bold'>JSON Tree Editor</h1>
          <ScrollArea>{props.children}</ScrollArea>
        </div>
      </main>
    </TooltipProvider>
  )
}
export const TreeTableEditorDefaultDark: Story = {
  render: function Render(args) {
    const [data, setData] = useState(args.schemaData)

    const handleChange = (newData: any) => {
      setData(newData)
      args.onChange?.(newData)
    }
    return (
      <TableEditorLayoutDark>
        <div className='overflow-hidden rounded-md border border-zinc-800'>
          <TreeTableEditor
            // schemaPrefillValues={PREDEFINED_VALUES}
            schemaData={data}
            onChange={handleChange}
            enableArray={true}
            enableValueField={true}
          />
        </div>
        <details>
          <summary>JSON schema</summary>
          <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </details>
      </TableEditorLayoutDark>
    )
  },
  args: {
    schemaData: initialTreeData,
    onChange: () => {
      console.log('on change')
    }
  }
}

export const SchemaEditor: Story = {
  render: function Render(args) {
    const [data, setData] = useState(args.schemaData)

    const handleChange = (newData: any) => {
      setData(newData)
      args.onChange?.(newData)
    }
    return (
      <TableEditorLayout>
        <div className='overflow-hidden rounded-md border dark:border-zinc-800'>
          <TreeTableEditor
            // schemaPrefillValues={PREDEFINED_VALUES}
            enableArray={false}
            enableCheckboxField={true}
            checkboxFieldName={'Value'}
            schemaData={data}
            onChange={handleChange}
            enableDescriptionTooltip={true}
          />
        </div>
        <details>
          <summary>JSON Data Model</summary>
          <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </details>
        <details>
          <summary>JSONSchema</summary>
          <div>
            <pre>{schemaTableToJsonSchema(data).jsonString()}</pre>
          </div>
        </details>
      </TableEditorLayout>
    )
  },
  args: {
    schemaData: initialTreeData,
    onChange: () => {
      console.log('on change')
    }
  }
}

export const SchemaEditorDark: Story = {
  render: function Render(args) {
    const [data, setData] = useState(args.schemaData)

    const handleChange = (newData: any) => {
      setData(newData)
      args.onChange?.(newData)
    }
    return (
      <TableEditorLayoutDark>
        <div className='overflow-hidden rounded-md border dark:border-zinc-800'>
          <TreeTableEditor
            // schemaPrefillValues={PREDEFINED_VALUES}
            enableArray={false}
            enableCheckboxField={true}
            schemaData={data}
            onChange={handleChange}
            enableDescriptionTooltip={true}
          />
        </div>
        <details>
          <summary>JSON Data Model</summary>
          <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </details>
        <details>
          <summary>JSONSchema</summary>
          <div>
            <pre>{schemaTableToJsonSchema(data).jsonString()}</pre>
          </div>
        </details>
      </TableEditorLayoutDark>
    )
  },
  args: {
    schemaData: initialTreeData,
    onChange: () => {
      console.log('on change')
    }
  }
}
