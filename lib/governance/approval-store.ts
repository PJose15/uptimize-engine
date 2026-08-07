/**
 * Approval Store — durable approval state
 *
 * ApprovalGateEngine kept pending approvals in an in-process Map while writing
 * a separate ApprovalItem row with no link back to it. Nothing reconciled the
 * two, so a human approving in the portal updated the row while the engine's
 * copy stayed pending forever — and on serverless the Map does not survive
 * between requests at all. A queued action could never resume.
 *
 * This module makes the ApprovalItem row the single source of truth: the id
 * the gate hands back IS the row id, so a portal decision is immediately
 * visible to the next gate check.
 */

import { prisma } from '@/lib/prisma';

/** How long a pending approval stays actionable before it lapses. */
export const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

export type ApprovalDecision = 'pending' | 'approved' | 'denied' | 'expired' | 'not_found';

export interface CreateApprovalParams {
    agentId: string;
    toolName: string;
    actionDescription: string;
    reason: string;
    estimatedCostUsd: number;
    batchSize: number;
    clientId?: string;
}

export interface CreatedApproval {
    approvalId: string;
    expiresAt: Date;
}

function riskLevelFor(estimatedCostUsd: number): string {
    if (estimatedCostUsd > 5) return 'high';
    if (estimatedCostUsd > 1) return 'medium';
    return 'low';
}

/**
 * Stable identity for the action an approval authorizes.
 *
 * Without this, an approval is just a status: a human approving one external
 * write would authorize any other approval-gated call the agent made within the
 * TTL, because the gate only ever asked "is this id approved?".
 */
export function approvalFingerprint(agentId: string, toolName: string): string {
    return `${agentId}::${toolName}`;
}

/**
 * Record a request for human approval. The returned id is the ApprovalItem
 * row id — pass it back into the gate on a later attempt to resume.
 */
export async function createApproval(params: CreateApprovalParams): Promise<CreatedApproval> {
    const item = await prisma.approvalItem.create({
        data: {
            action: params.actionDescription,
            description:
                `${params.agentId} wants to use ${params.toolName} ` +
                `(cost: $${params.estimatedCostUsd.toFixed(2)}, batch: ${params.batchSize})`,
            riskLevel: riskLevelFor(params.estimatedCostUsd),
            affectedSystem: approvalFingerprint(params.agentId, params.toolName),
            reason: params.reason,
            status: 'pending',
            // Never default to a real tenant: the portal scopes approvals by
            // clientId and 403s on mismatch, so filing someone else's pending
            // external write under client_001 both hides it from its owner and
            // offers it to an unrelated operator.
            clientId: params.clientId ?? 'unknown',
        },
    });

    return {
        approvalId: item.id,
        expiresAt: new Date(item.timestamp.getTime() + APPROVAL_TTL_MS),
    };
}

/**
 * Current decision for an approval.
 *
 * A row still marked pending past its TTL reads as expired even if the sweep
 * has not run yet — an approval must not become actionable again just because
 * a scheduled job was late.
 */
export async function getApprovalDecision(
    approvalId: string,
    expectedFingerprint?: string,
): Promise<ApprovalDecision> {
    const item = await prisma.approvalItem.findUnique({ where: { id: approvalId } });
    if (!item) return 'not_found';

    // An approval authorizes the action it was raised for, nothing else.
    // Presenting a valid id for a different agent or tool is a mismatch, not a
    // grant — treated as not_found so the caller queues its own request.
    if (expectedFingerprint && item.affectedSystem !== expectedFingerprint) {
        console.warn(
            `[approval-store] approval ${approvalId} was granted for ${item.affectedSystem}, ` +
            `presented for ${expectedFingerprint}`,
        );
        return 'not_found';
    }

    if (item.status === 'pending' && Date.now() - item.timestamp.getTime() > APPROVAL_TTL_MS) {
        return 'expired';
    }

    switch (item.status) {
        case 'approved':
        case 'denied':
        case 'expired':
            return item.status;
        default:
            return 'pending';
    }
}

/**
 * Mark lapsed pending approvals as expired. Safe to call repeatedly; returns
 * how many rows changed.
 */
export async function expireStaleApprovals(ttlMs: number = APPROVAL_TTL_MS): Promise<number> {
    const cutoff = new Date(Date.now() - ttlMs);

    const result = await prisma.approvalItem.updateMany({
        where: { status: 'pending', timestamp: { lt: cutoff } },
        data: { status: 'expired' },
    });

    return result.count;
}
