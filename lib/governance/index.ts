/**
 * Governance Layer — Exports
 *
 * The trust foundation for agentic operations.
 * See docs/governance-policy.md for the full policy.
 */

export {
    ToolPermissionChecker,
    getPermissionChecker,
    PermissionLevel,
    type AgentPermissions,
    type ToolPermission,
    type PermissionCheckResult,
} from "./tool-permissions";

export {
    ApprovalGateEngine,
    getApprovalGateEngine,
    checkToolGate,
    type ApprovalRequest,
    type ApprovalStatus,
    type GateCheckResult,
    type AuditRecord,
} from "./approval-gates";
