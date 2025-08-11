import {
  createRouterMockModel,
  type RouterMockModelKey,
  type RouterMockModelValue
} from './create-router-mock-model'

export default function mockTestModel() {
  const x = new Map<RouterMockModelKey, RouterMockModelValue>()
  x.set(/price/i, 'The price is $42.')
  x.set('hello', (p) => `Hi! you said: ${p}`)

  x.set('default', (p) => p.toUpperCase())

  return createRouterMockModel(x)
}
