import {eq, sql} from 'drizzle-orm'
import { type Patch, type WritableDraft} from 'immer'
import * as schema from '@/db/schema'
import {db as database} from '../db/db'
import {
  abilityForActor,
  type AuditActorEntry,
  type PermissionPolicyActionType,
  PermissionPolicyV1,
  type Policy
} from './permission-policy-schema'
import {subject} from '@casl/ability'

export async function userCannotProjectAction(
  db: typeof database,
  actionType: PermissionPolicyActionType,
  user: {id: schema.UserId} | null,
  subjectPolicyId: schema.SubjectPolicyId
): Promise<boolean> {
  const actor = await userActor(db, user)
  const subjectPolicy = await projectSubjectPolicy(db, subjectPolicyId)
  const abilities = abilityForActor(actor)
  return abilities.cannot(actionType, subject('Policy', subjectPolicy.policy))
}

export async function userActor(
  db: typeof database,
  user: {id: schema.UserId} | null
): Promise<AuditActorEntry> {
  if (!user) {
    return {actorType: 'anonymous'}
  }
  const [actor] = await db.select().from(schema.actor).where(eq(schema.actor.userId, user.id))
  return {actorType: 'actor', actorId: actor.publicId}
}

export async function projectSubjectPolicy(db: typeof database, subjectPolicyId: schema.SubjectPolicyId) {
  const [subjectPolicy] = await db
    .select()
    .from(schema.subjectPolicy)
    .where(eq(schema.subjectPolicy.id, subjectPolicyId))
    .limit(1)
  return subjectPolicy
}

export function createDefaultPolicy(ownerId: schema.ActorPublicId) {
  const defaultPolicy: Policy = {
    version: 1,
    ownerId: ownerId,
    visibility: 'private',
    actorPermissions: {},
    publicPermissions: []
  }
  return PermissionPolicyV1.parse(defaultPolicy)
}

export interface updatePolicyArgs {
  db: typeof database
  policy: WritableDraft<Policy>
  patches: Patch[]
  inversePatches: Patch[]
  subjectPolicyId: schema.SubjectPolicyId
  actor: AuditActorEntry
  actionType: PermissionPolicyActionType
}
export async function updatePolicy(args: updatePolicyArgs) {
  const {db, policy, patches, inversePatches, actor, actionType, subjectPolicyId} = args

  const [subjectPolicy] = await db
    .update(schema.subjectPolicy)
    .set({
      policy,
      updatedAt: sql`now()`
    })
    .where(eq(schema.subjectPolicy.id, subjectPolicyId))
    .returning()

  await db.insert(schema.policyAuditEntry).values({
    subjectPolicyId: subjectPolicyId,
    entry: {
      actionType: actionType,
      actor: actor,
      patches,
      inversePatches
    }
  })
  return subjectPolicy
}
