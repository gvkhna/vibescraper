import {pgTable, text, uniqueIndex, timestamp, jsonb} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'
import {ulid, type ULID} from 'ulid'
import type {ActorType, AuditEntrySchema, PermissionPolicyV1Schema} from '@/lib/permission-policy-schema'
import {TIMESTAMPS_SCHEMA, type BrandedType, type StrictOmit} from './common'
import {user, type UserId} from './better-auth'

export type SubjectPolicyId = BrandedType<ULID, 'SubjectPolicyId'>
export type SubjectPolicyPublicId = BrandedType<ULID, 'SubjectPolicyPublicId'>

export const subjectPolicy = pgTable(
  'subjectPolicy',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<SubjectPolicyId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<SubjectPolicyPublicId>(),
    policy: jsonb().notNull().$type<PermissionPolicyV1Schema>(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type SubjectPolicyDTOType = StrictOmit<typeof subjectPolicy.$inferSelect, 'id'>

export type ActorId = BrandedType<ULID, 'ActorId'>
export type ActorPublicId = BrandedType<ULID, 'ActorPublicId'>

// Stores actors that can have permissions
export const actor = pgTable(
  'actor',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ActorId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<ActorPublicId>(),
    type: text().notNull().$type<ActorType>(),
    userId: text()
      .references(() => user.id, {onDelete: 'cascade'})
      .$type<UserId>(), // Only for type 'user'
    // apiKeyId: text().references(() => apiKey.id, { onDelete: "cascade" }), // Only for type 'apiKey'
    // anonymousId: text().$type<AnonymousActorId>(),
    ...TIMESTAMPS_SCHEMA
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export const actorRelations = relations(actor, ({one}) => ({
  user: one(user, {
    fields: [actor.userId],
    references: [user.id]
  })
  // apiKey: one(apiKey, {
  //   fields: [actor.apiKeyId],
  //   references: [apiKey.id],
  // }),
}))

export type PolicyAuditEntryId = BrandedType<ULID, 'PolicyAuditEntryId'>
export type PolicyAuditEntryPublicId = BrandedType<ULID, 'PolicyAuditEntryPublicId'>

export const policyAuditEntry = pgTable(
  'policyAuditEntry',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<PolicyAuditEntryId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<PolicyAuditEntryPublicId>(),
    subjectPolicyId: text()
      .notNull()
      .references(() => subjectPolicy.id, {onDelete: 'cascade'})
      .$type<SubjectPolicyId>(),
    entry: jsonb().notNull().$type<AuditEntrySchema>(),
    createdAt: timestamp().notNull().defaultNow()
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

// const actor = await db.query.actor.findFirst({
//   where: {
//     id: "some-actor-id", // Actor id you want to look up
//   },
//   with: {
//     user: actor.type === "user" ? true : false, // Only include the 'user' relation if actor is of type 'user'
//     apiKey: actor.type === "apiKey" ? true : false, // Only include the 'apiKey' relation if actor is of type 'apiKey'
//   },
// });
