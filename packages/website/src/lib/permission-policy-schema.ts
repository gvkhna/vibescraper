import {z} from 'zod'
import type {Patch} from 'immer'
import * as schema from '@/db/schema'
import {AbilityBuilder, PureAbility, type ForcedSubject, type MatchConditions} from '@casl/ability'

export const PermissionPolicyActionValues = ['create', 'read', 'update', 'delete', 'setPermissions'] as const
export type PermissionPolicyActionType = (typeof PermissionPolicyActionValues)[number]

export const ActorValues = ['anonymous', 'user'] as const
export type ActorType = (typeof ActorValues)[number]

// ==== Audit Entry Schema ====

export type AuditActorEntry =
  | {actorType: 'actor'; actorId: schema.ActorPublicId} // If actorType is 'user', actorId is UserActorId
  | {actorType: 'anonymous'; actorId?: undefined} // If actorType is 'anonymous', actorId is non-existant

export const AuditEntry = z.object({
  actor: z.union([
    z.object({
      actorType: z.literal('actor'), // For regular actors
      actorId: z.string().transform((val) => val as schema.ActorPublicId) // Must be a valid ActorId
    }),
    z.object({
      actorType: z.literal('anonymous'), // For anonymous users
      actorId: z.undefined()
    })
  ]),
  actionType: z.enum(PermissionPolicyActionValues),
  patches: z.array(z.object({}).transform((val) => val as Patch)),
  inversePatches: z.array(z.object({}).transform((val) => val as Patch))
})

export type AuditEntrySchema = Readonly<z.infer<typeof AuditEntry>>

// ==== Version 1 Policy Schema ====
const BasePolicySchema = z.object({
  version: z.literal(0).default(0)
})

export const PermissionPolicyV1VisibilityValues = ['private', 'public'] as const
export type PermissionPolicyV1VisibilityType = (typeof PermissionPolicyV1VisibilityValues)[number]

export const PermissionPolicyV1 = BasePolicySchema.extend({
  version: z.literal(1).default(1),
  visibility: z.enum(PermissionPolicyV1VisibilityValues).default('private'),
  ownerId: z
    .string()
    .nonempty()
    .transform((val) => val as schema.ActorPublicId), // Reference to actor
  publicPermissions: z.array(z.enum(PermissionPolicyActionValues)).optional(), // Applies when public
  actorPermissions: z
    .record(
      z.string().transform((val) => val as schema.ActorPublicId), // Actor ID
      z.array(z.enum(PermissionPolicyActionValues))
    )
    .default({})
})

// Example policy JSON:
// {
//   version: 1,
//   visibility: "private", // or "public"
//   ownerId: "actor_123",
//   publicPermissions: ["view"], // optional public access
//   actorPermissions: {
//     "actor_456": ["view", "edit"], // specific user/API key
//     "actor_789": ["view"] // read-only access
//   }
// }

export type PermissionPolicyV1Schema = z.infer<typeof PermissionPolicyV1>

export type Policy = PermissionPolicyV1Schema

// ==== CASL Ability Builder ====

// https://github.com/stalniy/casl/discussions/812
const lambdaMatcher = (matchConditions: MatchConditions) => matchConditions

type Subject = 'all' | 'Policy' | (ForcedSubject<'Policy'> & Policy)
type Action = PermissionPolicyActionType
type AppAbility = PureAbility<[Action, Subject], MatchConditions>

export function abilityForActor(actor: AuditActorEntry) {
  // const actor = resolveActorEntry(actorEntry)

  const {can, build} = new AbilityBuilder<AppAbility>(PureAbility)

  if (actor.actorType === 'actor') {
    can(
      ['create', 'read', 'update', 'delete', 'setPermissions'],
      'Policy',
      (policy) => policy.ownerId === actor.actorId
    )

    can(['create'], 'Policy', (policy) => {
      const actorPermission = policy.actorPermissions[actor.actorId]
      if (actorPermission?.includes('create')) {
        return true
      }
      return false
    })
    can(['read'], 'Policy', (policy) => {
      const actorPermission = policy.actorPermissions[actor.actorId]
      if (actorPermission?.includes('read')) {
        return true
      }
      return false
    })
    can(['update'], 'Policy', (policy) => {
      const actorPermission = policy.actorPermissions[actor.actorId]
      if (actorPermission?.includes('update')) {
        return true
      }
      return false
    })
    can(['delete'], 'Policy', (policy) => {
      const actorPermission = policy.actorPermissions[actor.actorId]
      if (actorPermission?.includes('delete')) {
        return true
      }
      return false
    })
    can(['setPermissions'], 'Policy', (policy) => {
      const actorPermission = policy.actorPermissions[actor.actorId]
      if (actorPermission?.includes('setPermissions')) {
        return true
      }
      return false
    })
  }
  // if (actor.actorType === 'anonymous') {
  can('read', 'Policy', (policy) => {
    const publicPermission = policy.publicPermissions
    if (policy.visibility === 'public' && publicPermission?.includes('read')) {
      return true
    }
    return false
  })
  // }

  return build({
    conditionsMatcher: lambdaMatcher
  })
}

// Permission Model Structure
// A Google Docs-like permission system typically has these components:

// Resource-based permissions (e.g., project-level)
// Role-based access control (owner, editor, viewer)
// Share capabilities (individuals, groups, public)
// Inheritance of permissions (from organizations to projects)

// export type PermissionPrincipalType =
//   | 'user' // Individual user
//   | 'team' // Team of users
//   | 'org' // Entire organization
//   | 'everyone' // Public access
//   | 'external-email'
// export type PermissionRoleType =
//   | 'owner' // Full control including permission management
//   | 'editor' // Can modify content
//   | 'viewer' // Read-only access
//   | 'commenter'
// export type PermissionVisibilityType =
//   | 'private' // Only explicit permissions
//   | 'team' // Visible to specific teams
//   | 'org' // Visible to entire organization
//   | 'public' // Visible to anyone
//   | 'link' // Visible through specific link
// export type PermissionResourceType =
//   | 'project'
//   | 'file' // unused for now
//   | 'all' // Special type for admin access to everything

// export function resolveActorEntry(actorEntry: AuditActorEntry | typeof schema.actor.$inferSelect): AuditActorEntry {
//   if ('actorType' in actorEntry) {
//     if (actorEntry.actorType === 'actor') {
//       return {actorType: actorEntry.actorType, actorId: actorEntry.actorId}
//     } else if (actorEntry.actorType === 'anonymous') {
//       return {actorType: actorEntry.actorType}
//     }
//   }
//   return {actorType: 'actor', actorId: actorEntry.id}
// }

// ==== Policy Manager ====
// class PolicyManager {
//   // Create initial policy
//   static createDefault(ownerId: schema.UserId): PermissionPolicyV1 {
//     return PermissionPolicyV1Schema.parse({
//       version: 1,
//       ownerId,
//       sharing: {
//         linkAccess: 'none',
//         allowedDomains: [],
//         allowedUsers: {}
//       }
//     });
//   }

//   // Apply updates with audit trail
//   static async updatePolicy(
//     policyId: number,
//     updateFn: (draft: PermissionPolicyV1) => void,
//     userId?: schema.UserId
//   ) {
//     const [current] = await db.select()
//       .from(permissionPolicies)
//       .where(eq(permissionPolicies.id, policyId));

//     if (!current) throw new Error('Policy not found');

//     // Generate patches with Immer
// const [updatedPolicy, patches, inversePatches] = produceWithPatches(current.policy, (draft) => {
//   updateFn(draft)
//   draft.updatedAt = new Date()
// })

//     // Validate and add audit entry
//     const validated = PermissionPolicyV1Schema.parse({
//       ...updatedPolicy,
//       auditLog: [
//         ...updatedPolicy.auditLog,
//         {
//           timestamp: new Date(),
//           userId,
//           action: 'update',
//           patches,
//           inversePatches
//         }
//       ]
//     });

//     // Save updated policy
//     const [updated] = await db.update(permissionPolicies)
//       .set({
//         policy: validated,
//         updatedAt: new Date()
//       })
//       .where(eq(permissionPolicies.id, policyId))
//       .returning();

//     return updated!;
//   }

//   // Migration system
//   static async migratePolicy(policyId: number) {
//     const [current] = await db.select()
//       .from(permissionPolicies)
//       .where(eq(permissionPolicies.id, policyId));

//     if (!current) throw new Error('Policy not found');

//     // Example migration logic
//     const migrated = current.policy.version === 1
//       ? current.policy // Add migration logic here when version increases
//       : current.policy;

//     await db.update(permissionPolicies)
//       .set({ policy: migrated })
//       .where(eq(permissionPolicies.id, policyId));
//   }
// }

// ==== Usage Examples ====

// Create new policy
// const newPolicy = PolicyManager.createDefault('user_123' as UserId);
// const [created] = await db.insert(permissionPolicies)
//   .values({ policy: newPolicy })
//   .returning();

// Update policy to allow public view
// await PolicyManager.updatePolicy(
//   created.id,
//   draft => {
//     draft.publicAccess = 'view';
//     draft.sharing.linkAccess = 'view';
//   },
//   'admin_1' as UserId
// );

// Add user permission
// await PolicyManager.updatePolicy(
//   created.id,
//   draft => {
//     draft.sharing.allowedUsers['user_456'] = 'edit';
//   },
//   'admin_1' as UserId
// );

// Rollback implementation
// async function rollbackPolicy(policyId: number, targetVersion: number) {
//   const [current] = await db.select()
//     .from(permissionPolicies)
//     .where(eq(permissionPolicies.id, policyId));

//   if (!current) throw new Error('Policy not found');

//   const entriesToRevert = current.policy.auditLog
//     .filter(entry =>
//       entry.action === 'update' &&
//       current.policy.version > targetVersion
//     )
//     .reverse();

//   let rolledBack = current.policy;
//   for (const entry of entriesToRevert) {
//     rolledBack = applyPatches(rolledBack, entry.inversePatches);
//   }

//   await db.update(permissionPolicies)
//     .set({ policy: rolledBack })
//     .where(eq(permissionPolicies.id, policyId));
// }

// ==== Schema Migration Setup ====
// Add when version 2 is needed
// const MigrationRegistry = {
//   1: (policy: any) => PermissionPolicyV1Schema.parse(policy),
//   // 2: (policy) => migrateV1ToV2(policy)
// };

// async function loadPolicyWithMigrations(policyId: number) {
//   const [raw] = await db.select()
//     .from(permissionPolicies)
//     .where(eq(permissionPolicies.id, policyId));

//   if (!raw) return null;

//   let policy = raw.policy;
//   while (MigrationRegistry[policy.version + 1]) {
//     policy = MigrationRegistry[policy.version + 1](policy);
//   }

//   return policy;
// }
