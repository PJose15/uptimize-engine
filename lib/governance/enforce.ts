/**
 * Governance Enforcement
 *
 * The permission matrix and the approval gate engine both existed and were
 * both unreachable: `checkGate()` had no callers, so nothing an agent did was
 * ever actually gated. The portal's permissions page rendered a policy that
 * the runtime did not enforce.
 *
 * This module is the chokepoint. Any call an agent makes to a system outside
 * this process goes through `withGovernance`, which decides before the call
 * runs — not after — whether it may happen at all.
 */

import { PermissionLevel } from './tool-permissions';
import { checkToolGate } from './approval-gates';
import { logAuditEntry } from '../portal-events';

export interface GovernedAction {
    /** Permission-matrix agent id, e.g. "agent1" */
    agentId: string;
    /** Tool name as registered in the matrix, e.g. "web_search" */
    toolName: string;
    level: PermissionLevel;
    /** Human-readable description shown in the approval queue */
    actionDescription?: string;
    targetSystem?: string;
    inputSummary?: string;
    estimatedCostUsd?: number;
    batchSize?: number;
    /** Whether the effect can be undone — recorded on the audit trail */
    reversible?: boolean;
    /** Approval already granted for this action, to resume a queued call */
    approvalId?: string;
    clientId?: string;
}

export type GovernedOutcome<T> =
    | { status: 'executed'; value: T }
    | { status: 'denied'; reason: string }
    | { status: 'awaiting_approval'; approvalId: string; reason: string };

/**
 * Run an external action under governance.
 *
 * The action executes only on `proceed`. When approval is required, the call
 * does NOT run — the caller receives the approval id to resume with once a
 * human decides. That is the whole point: a queued action must not have
 * already happened.
 */
export async function withGovernance<T>(
    action: GovernedAction,
    execute: () => Promise<T>,
): Promise<GovernedOutcome<T>> {
    const gate = await checkToolGate(action.agentId, action.toolName, action.level, {
        estimatedCostUsd: action.estimatedCostUsd ?? 0,
        batchSize: action.batchSize ?? 1,
        targetSystem: action.targetSystem ?? 'external',
        inputSummary: action.inputSummary ?? '',
        actionDescription: action.actionDescription ?? `${action.agentId} calling ${action.toolName}`,
        reversible: action.reversible ?? false,
        approvalId: action.approvalId,
        clientId: action.clientId,
    });

    if (gate.action === 'blocked') {
        return { status: 'denied', reason: gate.permission_check.reason };
    }

    if (gate.action === 'queued_for_approval') {
        return {
            status: 'awaiting_approval',
            approvalId: gate.approval_request!.request_id,
            reason: gate.permission_check.reason,
        };
    }

    // checkGate has already audited the *gate decision*. The call itself has
    // not happened yet, so its outcome is recorded here — otherwise an external
    // write that throws is permanently audited as having succeeded.
    try {
        const value = await execute();
        return { status: 'executed', value };
    } catch (err) {
        await logAuditEntry({
            action: `tool_call_failed: ${action.agentId} → ${action.toolName}`,
            tool: action.toolName,
            status: 'failed',
            costUsd: action.estimatedCostUsd ?? 0,
            details: `${action.targetSystem ?? 'external'}: ${err instanceof Error ? err.message : String(err)}`,
        }).catch(() => {});

        throw err;
    }
}

/**
 * Error thrown when a governed action cannot proceed.
 *
 * `approvalId` is set when the action is waiting on a human rather than
 * refused outright, so a caller can surface it or retry with it later.
 */
export class GovernanceError extends Error {
    readonly approvalId?: string;
    readonly awaitingApproval: boolean;

    constructor(message: string, approvalId?: string) {
        super(message);
        this.name = 'GovernanceError';
        this.approvalId = approvalId;
        this.awaitingApproval = approvalId !== undefined;
    }
}

/**
 * Strict form of `withGovernance` for call sites that cannot express a
 * tri-state result — returns the value or throws GovernanceError.
 */
export async function enforceGovernance<T>(
    action: GovernedAction,
    execute: () => Promise<T>,
): Promise<T> {
    const outcome = await withGovernance(action, execute);

    if (outcome.status === 'executed') return outcome.value;

    if (outcome.status === 'awaiting_approval') {
        throw new GovernanceError(
            `${action.toolName} requires approval before it can run: ${outcome.reason}`,
            outcome.approvalId,
        );
    }

    throw new GovernanceError(`${action.toolName} denied: ${outcome.reason}`);
}
