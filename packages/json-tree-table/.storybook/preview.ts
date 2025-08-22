import type {Preview} from '@storybook/react'
import '../src/styles.css'
import debug from 'debug'

debug.enable('*')
debug.log = console.info.bind(console)

const preview: Preview = {
  parameters: {
    actions: {argTypesRegex: '^on[A-Z].*'},
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
}

export default preview
