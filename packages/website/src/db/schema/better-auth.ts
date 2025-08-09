import {
  pgTable,
  text,
  integer,
  bigint,
  uniqueIndex,
  index,
  timestamp,
  jsonb,
  boolean
} from 'drizzle-orm/pg-core'
import {ulid, type ULID} from 'ulid'
import {alphanumericShortPublicId} from '@/lib/short-id'
import {storage, type StorageId} from './storage'

import {TIMESTAMPS_SCHEMA, type BrandedType} from './common'
import {relations} from 'drizzle-orm'

export type UserId = BrandedType<ULID, 'UserId'>
export type UserPublicId = BrandedType<ULID, 'UserPublicId'>
export const user = pgTable(
  'user',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<UserId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<UserPublicId>(),
    // Authentication fields
    email: text().unique(),
    emailVerified: boolean(),
    username: text().unique(),
    displayUsername: text(),
    // Generation tracking
    isGenerated: boolean().notNull().default(false),
    generatedFromSeed: text(), // Reference to the seed file that generated this user
    contentHash: text(), // Hash of the user's profile data for sync purposes
    // Profile information
    name: text(),
    image: text(), // URL from OAuth providers
    isAnonymous: boolean(),
    twoFactorEnabled: boolean(),
    stripeCustomerId: text(),
    avatarStorageId: text()
      .references(() => storage.id, {onDelete: 'set null'})
      .$type<StorageId>(),

    // Admin plugin
    role: text(),
    banned: boolean().notNull().default(false),
    banReason: text(),
    banExpires: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [
    uniqueIndex().on(table.email),
    uniqueIndex().on(table.publicId),
    uniqueIndex().on(table.username)
  ]
)

export const userAvatarRelation = relations(user, ({one}) => ({
  avatar: one(storage, {
    fields: [user.avatarStorageId],
    references: [storage.id]
  })
}))

// const userWithActor = await db.query.user.findFirst({
//   with: {
//     actor: true, // Includes the actor data
//   },
// });

export type TwoFactorId = BrandedType<ULID, 'TwoFactorId'>
export const twoFactor = pgTable('twoFactor', {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
    .$type<TwoFactorId>(),
  userId: text()
    .notNull()
    .references(() => user.id, {onDelete: 'cascade'})
    .$type<UserId>(),
  secret: text(),
  backupCodes: text()
})

export type SessionId = BrandedType<ULID, 'SessionId'>
export const session = pgTable(
  'session',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<SessionId>(),
    userId: text()
      .notNull()
      .references(() => user.id, {onDelete: 'cascade'})
      .$type<UserId>(),
    activeOrganizationId: text()
      .references(() => organization.id, {
        onDelete: 'set null'
      })
      .$type<OrganizationId>(),
    token: text().notNull(),
    expiresAt: timestamp().notNull(),
    ipAddress: text(),
    userAgent: text(),
    impersonatedBy: text().$type<UserId>(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [index().on(table.userId)]
)

export type AccountId = BrandedType<ULID, 'AccountId'>
export const account = pgTable(
  'account',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<AccountId>(),
    userId: text()
      .notNull()
      .references(() => user.id, {onDelete: 'cascade'})
      .$type<UserId>(),
    accountId: text().notNull(),
    providerId: text().notNull(), // 'google', 'github', etc
    accessToken: text(),
    refreshToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    idToken: text(),
    password: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [index().on(table.userId)]
)
export type VerificationId = BrandedType<ULID, 'VerificationId'>
export const verification = pgTable('verification', {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
    .$type<VerificationId>(),
  identifier: text().notNull(), // Typically email
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
})

// Better auth organization schema
export type OrganizationId = BrandedType<ULID, 'OrganizationId'>
export type OrganizationPublicId = BrandedType<ULID, 'OrganizationPublicId'>
// Organization Table
export const organization = pgTable(
  'organization',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<OrganizationId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<OrganizationPublicId>(),
    name: text().notNull(),
    slug: text().notNull(),
    logo: text(),
    metadata: text(), // Store additional metadata as JSON
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type ORG_MEMBER_ROLE = 'owner' | 'admin' | 'member'

export type MemberId = BrandedType<ULID, 'MemberId'>
export type MemberPublicId = BrandedType<ULID, 'MemberPublicId'>
// Member Table
export const member = pgTable(
  'member',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<MemberId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<MemberPublicId>(),
    userId: text()
      .notNull()
      .references(() => user.id, {onDelete: 'cascade'})
      .$type<UserId>(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, {onDelete: 'cascade'})
      .$type<OrganizationId>(),
    role: text().notNull().$type<ORG_MEMBER_ROLE>(), // e.g., 'admin', 'member'
    createdAt: timestamp().notNull().defaultNow()
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type TeamId = BrandedType<ULID, 'TeamId'>
export type TeamPublicId = BrandedType<ULID, 'TeamPublicId'>
export const team = pgTable(
  'team',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<TeamId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => alphanumericShortPublicId())
      .$type<TeamPublicId>(),
    name: text().notNull(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, {onDelete: 'cascade'})
      .$type<OrganizationId>(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type InvitationId = BrandedType<ULID, 'InvitationId'>
// Invitation Table
export const invitation = pgTable('invitation', {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
    .$type<InvitationId>(),
  email: text().notNull(),
  inviterId: text()
    .notNull()
    .references(() => user.id, {onDelete: 'cascade'})
    .$type<UserId>(), // Assuming you have a `user` table
  organizationId: text()
    .notNull()
    .references(() => organization.id, {onDelete: 'cascade'})
    .$type<OrganizationId>(),
  role: text().notNull(), // e.g., 'admin', 'member'
  status: text().notNull(), // e.g., 'pending', 'accepted', 'expired'
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow()
})

export type ApiKeyId = BrandedType<ULID, 'ApiKeyId'>
export type ApiKeyPublicId = BrandedType<ULID, 'ApiKeyPublicId'>
export const apiKey = pgTable(
  'apiKey',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<ApiKeyId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<ApiKeyPublicId>(),
    name: text(),
    start: text(),
    prefix: text(),
    key: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, {onDelete: 'cascade'})
      .$type<UserId>(),
    refillInterval: integer(),
    refillAmount: integer(),
    lastRefillAt: timestamp(),
    enabled: boolean().notNull().default(false),
    rateLimitEnabled: boolean().notNull().default(false),
    rateLimitTimeWindow: integer(),
    rateLimitMax: integer(),
    requestCount: integer().notNull().default(0),
    remaining: integer(),
    lastRequest: timestamp(),
    expiresAt: timestamp(),
    permissions: text(),
    metadata: jsonb(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type JwkId = BrandedType<ULID, 'JwkId'>
export type JwkPublicId = BrandedType<ULID, 'JwkPublicId'>
export const jwk = pgTable(
  'jwk',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid())
      .$type<JwkId>(),
    publicId: text()
      .unique()
      .notNull()
      .$defaultFn(() => ulid())
      .$type<JwkPublicId>(),
    publicKey: text().notNull(),
    privateKey: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [uniqueIndex().on(table.publicId)]
)

export type SubscriptionId = BrandedType<ULID, 'SubscriptionId'>
export type SubscriptionPublicId = BrandedType<ULID, 'SubscriptionPublicId'>
export const subscription = pgTable('subscription', {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
    .$type<SubscriptionId>(),
  publicId: text()
    .unique()
    .notNull()
    .$defaultFn(() => ulid())
    .$type<SubscriptionPublicId>(),
  plan: text().notNull(),
  referenceId: text().notNull(),
  stripeCustomerId: text(),
  stripeSubscriptionId: text(),
  status: text().notNull(),
  periodStart: timestamp(),
  periodEnd: timestamp(),
  cancelAtPeriodEnd: timestamp(),
  seats: integer(),
  trialStart: timestamp(),
  trialEnd: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
})

// Stripe integration
// export const customer = pgTable(
//   'customer',
//   {
//     id: text()
//       .primaryKey()
//       .$defaultFn(() => ulid()),
//     publicId: text()
//       .unique()
//       .notNull()
//       .$defaultFn(() => ulid()),
//     organizationId: text()
//       .notNull()
//       .references(() => organization.id, {onDelete: 'cascade'}),
//     userId: text()
//       .notNull()
//       .references(() => user.id, {onDelete: 'cascade'}),
//     stripeCustomerId: text(),
//     stripeSubscriptionId: text(),
//     createdAt: timestamp().notNull().defaultNow(),
//     updatedAt: timestamp().notNull().defaultNow()
//   },
//   (table) => [uniqueIndex().on(table.publicId)]
// )

// Share system
// export const share = pgTable(
//   'share',
//   {
//     id: text()
//       .primaryKey()
//       .$defaultFn(() => ulid()),
//     publicId: text()
//       .unique()
//       .$defaultFn(() => alphanumericShortPublicId()),
//     ownerId: text()
//       .notNull()
//       .references(() => user.id, {onDelete: 'cascade'}),
//     data: jsonb().notNull(),
//     expiresAt: timestamp(),
//     createdAt: timestamp().notNull().defaultNow(),
//     updatedAt: timestamp().notNull().defaultNow()
//   },
//   (table) => [index().on(table.ownerId), uniqueIndex().on(table.publicId)]
// )

// export const auditLog = pgTable('auditLog', {
//   id: text()
//     .primaryKey()
//     .$defaultFn(() => ulid()),
//   userId: text()
//     .notNull()
//     .references(() => user.id),
//   organizationId: text().references(() => organization.id),
//   resourceType: text().notNull(),
//   resourceId: text().notNull(),
//   action: text().notNull(),
//   timestamp: timestamp().notNull().defaultNow(),
//   metadata: jsonb() // Additional context
// })
