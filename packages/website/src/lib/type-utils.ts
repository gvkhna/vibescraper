import type {Writable, IsEqual} from 'type-fest'

export type EnforceExactWritable<T, Expected> =
  IsEqual<T, Writable<Expected>> extends true ? T & {} : `Must be Writable`
