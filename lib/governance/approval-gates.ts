/**
 * Approval Gates — Governance Layer
 *
 * Intercepts agent tool calls and enforces approval requirements.
 * Actions that require human approval are queued, logged, and held
 * until approved or expired.
 */

import {
    ToolPermissionChecker,
    PermissionLevel,
    PermissionCheckResult,
    getPermissionChecker,
} from "./tool-permissions";
import { logAuditEntry, createApprovalIfNeeded } from "../portal-events";

// ============================================================================
// TYPES
// ============================================================================

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";

export interface ApprovalRequest {
    request_id: string;
    agent_id: string;
    tool_name: string;
    permission_level: PermissionLevel;
    action_description: string;
    estimated_cost_usd: number;
    batch_size: number;
    input_summary: string;
    created_at: string;
    expires_at: string;
    status: ApprovalStatus;
    decided_by: string | null;
    decided_at: string | null;
    decision_reason: string | null;
}

export interface GateCheckResult {
    action: "proceed" | "blocked" | "queued_for_approval";
    permission_check: PermissionCheckResult;
    approval_request?: ApprovalRequest;
    audit_record: AuditRecord;
}

export interface AuditRecord {
    audit_id: string;
    timestamp: string;
    agent_id: string;
    action_type: "tool_call" | "data_read" | "data_write" | "approval_request" | "approval_decision";
    tool_name: string;
    target_system: string;
    input_hash: string;
    result: "success" | "denied" | "failed" | "expired" | "queued";
    cost_usd: number;
    approval_required: boolean;
    approved_by: string | null;
    reversible: boolean;
    rollback_id: string | null;
}

// ============================================================================
// APPROVAL GATE ENGINE
// ============================================================================

export class ApprovalGateEngine {
    private permissionChecker: ToolPermissionChecker;
    private pendingApprovals: Map<string, ApprovalRequest> = new Map();
    private auditLog: AuditRecord[] = [];
    private approvalTimeoutMs: number;

    constructor(approvalTimeoutMs: number = 24 * 60 * 60 * 1000) {
        this.permissionChecker = getPermissionChecker();
        this.approvalTimeoutMs = approvalTimeoutMs;
    }

    /**
     * Main entry point: check if an agent action can proceed
     */
    async checkGate(
        agentId: string,
        toolName: string,
        level: PermissionLevel,
        options: {
            estimatedCostUsd?: number;
            batchSize?: number;
            targetSystem?: string;
            inputSummary?: string;
            actionDescription?: string;
            reversible?: boolean;
        } = {}
    ): Promise<GateCheckResult> {
        const {
            estimatedCostUsd = 0,
            batchSize = 1,
            targetSystem = "internal",
            inputSummary = "",
            actionDescription = `${agentId} calling ${toolName}`,
            reversible = false,
        } = options;

        // Step 1: Permission check
        const permResult = this.permissionChecker.checkPermission(
            agentId,
            toolName,
            level,
            estimatedCostUsd,
            batchSize
        );

        // Step 2: If denied outright, log and return
        if (!permResult.allowed) {
            const auditRecord = this.createAuditRecord({
                agentId,
                toolName,
                targetSystem,
                actionType: "tool_call",
                result: "denied",
                costUsd: 0,
                approvalRequired: false,
                reversible,
            });

            return {
                action: "blocked",
                permission_check: permResult,
                audit_record: auditRecord,
            };
        }

        // Step 3: If approval required, queue it
        if (permResult.requires_approval) {
            const approvalRequest = this.createApprovalRequest({
                agentId,
                toolName,
                level,
                actionDescription,
                estimatedCostUsd,
                batchSize,
                inputSummary,
            });

            const auditRecord = this.createAuditRecord({
                agentId,
                toolName,
                targetSystem,
                actionType: "approval_request",
                result: "queued",
                costUsd: estimatedCostUsd,
                approvalRequired: true,
                reversible,
            });

            return {
                action: "queued_for_approval",
                permission_check: permResult,
                approval_request: approvalRequest,
                audit_record: auditRecord,
            };
        }

        // Step 4: Allowed without approval — proceed
        const auditRecord = this.createAuditRecord({
            agentId,
            toolName,
            targetSystem,
            actionType: level === PermissionLevel.READ ? "data_read" : "data_write",
            result: "success",
            costUsd: estimatedCostUsd,
            approvalRequired: false,
            reversible,
        });

        return {
            action: "proceed",
            permission_check: permResult,
            audit_record: auditRecord,
        };
    }

    /**
     * Approve a pending request
     */
    approveRequest(requestId: string, approvedBy: string, reason?: string): ApprovalRequest | null {
        const request = this.pendingApprovals.get(requestId);
        if (!request || request.status !== "pending") return null;

        request.status = "approved";
        request.decided_by = approvedBy;
        request.decided_at = new Date().toISOString();
        request.decision_reason = reason || "Approved";

        this.createAuditRecord({
            agentId: request.agent_id,
            toolName: request.tool_name,
            targetSystem: "governance",
            actionType: "approval_decision",
            result: "success",
            costUsd: request.estimated_cost_usd,
            approvalRequired: true,
            approvedBy,
            reversible: false,
        });

        return request;
    }

    /**
     * Deny a pending request
     */
    denyRequest(requestId: string, deniedBy: string, reason?: string): ApprovalRequest | null {
        const request = this.pendingApprovals.get(requestId);
        if (!request || request.status !== "pending") return null;

        request.status = "denied";
        request.decided_by = deniedBy;
        request.decided_at = new Date().toISOString();
        request.decision_reason = reason || "Denied";

        this.createAuditRecord({
            agentId: request.agent_id,
            toolName: request.tool_name,
            targetSystem: "governance",
            actionType: "approval_decision",
            result: "denied",
            costUsd: 0,
            approvalRequired: true,
            approvedBy: deniedBy,
            reversible: false,
        });

        return request;
    }

    /**
     * Expire old pending requests
     */
    expireStaleRequests(): ApprovalRequest[] {
        const now = Date.now();
        const expired: ApprovalRequest[] = [];

        for (const [id, request] of this.pendingApprovals) {
            if (request.status === "pending" && new Date(request.expires_at).getTime() < now) {
                request.status = "expired";
                expired.push(request);

                this.createAuditRecord({
                    agentId: request.agent_id,
                    toolName: request.tool_name,
                    targetSystem: "governance",
                    actionType: "approval_decision",
                    result: "expired",
                    costUsd: 0,
                    approvalRequired: true,
                    reversible: false,
                });
            }
        }

        return expired;
    }

    /**
     * Get all pending approval requests
     */
    getPendingApprovals(): ApprovalRequest[] {
        return Array.from(this.pendingApprovals.values())
            .filter(r => r.status === "pending");
    }

    /**
     * Get audit log (most recent first)
     */
    getAuditLog(limit: number = 100): AuditRecord[] {
        return this.auditLog.slice(-limit).reverse();
    }

    /**
     * Get audit log for a specific agent
     */
    getAgentAuditLog(agentId: string, limit: number = 50): AuditRecord[] {
        return this.auditLog
            .filter(r => r.agent_id === agentId)
            .slice(-limit)
            .reverse();
    }

    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================

    private createApprovalRequest(params: {
        agentId: string;
        toolName: string;
        level: PermissionLevel;
        actionDescription: string;
        estimatedCostUsd: number;
        batchSize: number;
        inputSummary: string;
    }): ApprovalRequest {
        const now = new Date();
        const request: ApprovalRequest = {
            request_id: `apr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            agent_id: params.agentId,
            tool_name: params.toolName,
            permission_level: params.level,
            action_description: params.actionDescription,
            estimated_cost_usd: params.estimatedCostUsd,
            batch_size: params.batchSize,
            input_summary: params.inputSummary,
            created_at: now.toISOString(),
            expires_at: new Date(now.getTime() + this.approvalTimeoutMs).toISOString(),
            status: "pending",
            decided_by: null,
            decided_at: null,
            decision_reason: null,
        };

        this.pendingApprovals.set(request.request_id, request);

        // Also write to portal DB
        createApprovalIfNeeded({
            action: params.actionDescription,
            description: `${params.agentId} wants to use ${params.toolName} (cost: $${params.estimatedCostUsd.toFixed(2)}, batch: ${params.batchSize})`,
            riskLevel: params.estimatedCostUsd > 5 ? 'high' : params.estimatedCostUsd > 1 ? 'medium' : 'low',
            affectedSystem: params.toolName,
            reason: `${params.level} permission requires approval`,
        }).catch(() => {});

        return request;
    }

    private createAuditRecord(params: {
        agentId: string;
        toolName: string;
        targetSystem: string;
        actionType: AuditRecord["action_type"];
        result: AuditRecord["result"];
        costUsd: number;
        approvalRequired: boolean;
        approvedBy?: string;
        reversible: boolean;
    }): AuditRecord {
        const record: AuditRecord = {
            audit_id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date().toISOString(),
            agent_id: params.agentId,
            action_type: params.actionType,
            tool_name: params.toolName,
            target_system: params.targetSystem,
            input_hash: "",  // Populated by caller with actual hash
            result: params.result,
            cost_usd: params.costUsd,
            approval_required: params.approvalRequired,
            approved_by: params.approvedBy || null,
            reversible: params.reversible,
            rollback_id: null,
        };

        this.auditLog.push(record);

        // Also write to portal DB
        logAuditEntry({
            action: `${params.actionType}: ${params.agentId} → ${params.toolName}`,
            tool: params.toolName,
            status: params.result === 'queued' ? 'approved' : params.result,
            approvedBy: params.approvedBy || null,
            costUsd: params.costUsd,
            details: `Target: ${params.targetSystem}, Approval: ${params.approvalRequired}`,
        }).catch(() => {});

        return record;
    }

    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
}

// ============================================================================
// SINGLETON + CONVENIENCE
// ============================================================================

let _engine: ApprovalGateEngine | null = null;

export function getApprovalGateEngine(): ApprovalGateEngine {
    if (!_engine) {
        _engine = new ApprovalGateEngine();
    }
    return _engine;
}

/**
 * Convenience: check gate for a tool call
 */
export async function checkToolGate(
    agentId: string,
    toolName: string,
    level: PermissionLevel,
    options?: Parameters<ApprovalGateEngine["checkGate"]>[3]
): Promise<GateCheckResult> {
    return getApprovalGateEngine().checkGate(agentId, toolName, level, options);
}
