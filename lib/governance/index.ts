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

export {
    createApproval,
    getApprovalDecision,
    expireStaleApprovals,
    APPROVAL_TTL_MS,
    type ApprovalDecision,
} from "./approval-store";

/**
 * The enforcement chokepoint. Any call an agent makes to a system outside this
 * process goes through one of these — see lib/governance/enforce.ts.
 */
export {
    withGovernance,
    enforceGovernance,
    GovernanceError,
    type GovernedAction,
    type GovernedOutcome,
} from "./enforce";
