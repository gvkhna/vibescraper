import {z} from 'zod'

const exampleSchema = z.object({
  input: z.string()
})

type ExamplePayload = z.infer<typeof exampleSchema>

export const exampleTask = {
  taskName: 'example',
  schema: exampleSchema,
  handler: async (payload: ExamplePayload) => {
    console.log('Received input:', payload.input)
  }
}
