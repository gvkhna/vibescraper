import { subject } from '@casl/ability'
import { eq as sqlEq, sql } from 'drizzle-orm'
import type { Patch, WritableDraft } from 'immer'

import * as schema from '@/db/schema'
import { db as database } from '../db/db'

import {
  abilityForActor,
  type AuditActorEntry,
  type PermissionPolicyActionType,
  PermissionPolicyV1,
  type Policy
} from './permission-policy-schema'

export async function userCannotProjectAction(
  db: typeof database,
  actionType: PermissionPolicyActionType,
  user: { id: schema.UserId } | null,
  subjectPolicyId: schema.SubjectPolicyId
): Promise<boolean> {
  const actor = await userActor(db, user)
  const subjectPolicy = await projectSubjectPolicy(db, subjectPolicyId)
  const abilities = abilityForActor(actor)
  return abilities.cannot(actionType, subject('Policy', subjectPolicy.policy))
}

export async function userActor(
  db: typeof database,
  user: { id: schema.UserId } | null
): Promise<AuditActorEntry> {
  if (!user) {
    return { actorType: 'anonymous' }
  }
  const actor = await db.query.actor.findFirst({
    where: (table, { eq }) => eq(table.userId, user.id)
  })
  if (!actor) {
    throw new Error('User actor not found!')
  }
  return { actorType: 'actor', actorId: actor.publicId }
}

export async function projectSubjectPolicy(db: typeof database, subjectPolicyId: schema.SubjectPolicyId) {
  const subjectPolicy = await db.query.subjectPolicy.findFirst({
    where: (table, { eq }) => eq(table.id, subjectPolicyId)
  })
  if (!subjectPolicy) {
    throw new Error('Project subjectPolicy not found!')
  }
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
  const { db, policy, patches, inversePatches, actor, actionType, subjectPolicyId } = args

  const [subjectPolicy] = await db
    .update(schema.subjectPolicy)
    .set({
      policy,
      updatedAt: sql`now()`
    })
    .where(sqlEq(schema.subjectPolicy.id, subjectPolicyId))
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
