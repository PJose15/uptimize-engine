/**
 * Tool Permissions — Governance Layer
 * 
 * Per-agent permission matrix that enforces what each agent can and cannot do.
 * This is the code enforcement of docs/governance-policy.md
 */

// ============================================================================
// TYPES
// ============================================================================

export enum PermissionLevel {
    READ = "READ",
    WRITE_INTERNAL = "WRITE_INTERNAL",
    WRITE_EXTERNAL = "WRITE_EXTERNAL",
    EXECUTE = "EXECUTE",
    ADMIN = "ADMIN",
}

export interface ToolPermission {
    tool_name: string;
    level: PermissionLevel;
    requires_approval: boolean;
    max_cost_usd?: number;
    description: string;
}

export interface AgentPermissions {
    agent_id: string;
    agent_name: string;
    allowed_levels: PermissionLevel[];
    tool_permissions: ToolPermission[];
    max_cost_per_action_usd: number;
    max_batch_size: number;
    can_write_external: boolean;
    can_execute: boolean;
}

export interface PermissionCheckResult {
    allowed: boolean;
    reason: string;
    requires_approval: boolean;
    permission_level: PermissionLevel;
    agent_id: string;
    tool_name: string;
    timestamp: string;
}

// ============================================================================
// DEFAULT AGENT PERMISSION MATRIX
// ============================================================================

const DEFAULT_PERMISSIONS: Record<string, AgentPermissions> = {
    agent1: {
        agent_id: "agent1",
        agent_name: "Market Intelligence",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL],
        tool_permissions: [
            { tool_name: "web_search", level: PermissionLevel.READ, requires_approval: false, description: "Search the web for prospect intelligence" },
            { tool_name: "linkedin_search", level: PermissionLevel.READ, requires_approval: false, description: "Search LinkedIn for decision makers" },
            { tool_name: "review_aggregator", level: PermissionLevel.READ, requires_approval: false, description: "Aggregate reviews from platforms" },
            { tool_name: "save_target_pack", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Save analyzed target pack to pipeline state" },
        ],
        max_cost_per_action_usd: 2.00,
        max_batch_size: 50,
        can_write_external: false,
        can_execute: false,
    },

    agent2: {
        agent_id: "agent2",
        agent_name: "Outbound & Appointment",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "read_crm", level: PermissionLevel.READ, requires_approval: false, description: "Read CRM records" },
            { tool_name: "create_crm_contact", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Create contact in client CRM" },
            { tool_name: "send_email", level: PermissionLevel.EXECUTE, requires_approval: true, description: "Send outbound email" },
            { tool_name: "schedule_meeting", level: PermissionLevel.EXECUTE, requires_approval: true, description: "Schedule a calendar meeting" },
            { tool_name: "save_campaign", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Save campaign template internally" },
        ],
        max_cost_per_action_usd: 5.00,
        max_batch_size: 25,
        can_write_external: true,
        can_execute: true,
    },

    agent3: {
        agent_id: "agent3",
        agent_name: "Sales Engineer",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL],
        tool_permissions: [
            { tool_name: "read_pipeline_state", level: PermissionLevel.READ, requires_approval: false, description: "Read current pipeline state" },
            { tool_name: "read_crm", level: PermissionLevel.READ, requires_approval: false, description: "Read CRM data for proposal context" },
            { tool_name: "save_proposal", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Save proposal/SOW internally" },
            { tool_name: "save_audit_findings", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Save 6-pillar audit results" },
        ],
        max_cost_per_action_usd: 3.00,
        max_batch_size: 10,
        can_write_external: false,
        can_execute: false,
    },

    agent4: {
        agent_id: "agent4",
        agent_name: "Systems Delivery",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "read_proposal", level: PermissionLevel.READ, requires_approval: false, description: "Read approved proposal" },
            { tool_name: "create_workflow", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Create workflow in client system" },
            { tool_name: "configure_integration", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Configure tool integrations" },
            { tool_name: "deploy_agent", level: PermissionLevel.EXECUTE, requires_approval: true, description: "Deploy an agent to a target environment" },
            { tool_name: "save_handoff_kit", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Save handoff documentation" },
        ],
        max_cost_per_action_usd: 10.00,
        max_batch_size: 5,
        can_write_external: true,
        can_execute: true,
    },

    agent5: {
        agent_id: "agent5",
        agent_name: "Client Success",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "read_kpis", level: PermissionLevel.READ, requires_approval: false, description: "Read client KPI data" },
            { tool_name: "read_tickets", level: PermissionLevel.READ, requires_approval: false, description: "Read support tickets" },
            { tool_name: "update_health_score", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Update client health score" },
            { tool_name: "create_report", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Generate and share client report" },
            { tool_name: "create_proof_asset", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Create testimonial/case study draft" },
        ],
        max_cost_per_action_usd: 3.00,
        max_batch_size: 10,
        can_write_external: true,
        can_execute: false,
    },

    // ------------------------------------------------------------------
    // Agents 6-13
    //
    // checkPermission() denies unknown agents by default, so an agent absent
    // from this matrix cannot make a governed call at all. These entries exist
    // so agents 6-13 fail on policy rather than on being unregistered — and so
    // the portal's permissions page reflects the whole fleet, not just 1-5.
    // ------------------------------------------------------------------

    agent6: {
        agent_id: "agent6",
        agent_name: "Closer & Onboarding",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "read_proposal", level: PermissionLevel.READ, requires_approval: false, description: "Read the proposal under negotiation" },
            { tool_name: "save_close_plan", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Save close plan and objection handling" },
            { tool_name: "store_client_credential", level: PermissionLevel.WRITE_INTERNAL, requires_approval: true, description: "Store an encrypted client integration credential" },
            { tool_name: "send_contract", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Send a contract for signature" },
        ],
        max_cost_per_action_usd: 3.00,
        max_batch_size: 5,
        can_write_external: true,
        can_execute: false,
    },

    agent7: {
        agent_id: "agent7",
        agent_name: "Nurture",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "web_search", level: PermissionLevel.READ, requires_approval: false, description: "Search for re-engagement signals" },
            { tool_name: "read_nurture_records", level: PermissionLevel.READ, requires_approval: false, description: "Read the nurture queue" },
            { tool_name: "update_nurture_record", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Update touch schedule and readiness" },
            { tool_name: "send_nurture_touch", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Send a nurture message to a dormant lead" },
        ],
        max_cost_per_action_usd: 2.00,
        max_batch_size: 25,
        can_write_external: true,
        can_execute: false,
    },

    agent8: {
        agent_id: "agent8",
        agent_name: "Intelligence Keeper",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL],
        tool_permissions: [
            { tool_name: "read_learning_events", level: PermissionLevel.READ, requires_approval: false, description: "Read collected learning events" },
            { tool_name: "read_pipeline_history", level: PermissionLevel.READ, requires_approval: false, description: "Read historical pipeline runs" },
            { tool_name: "save_learning", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Persist an anonymized learning" },
            { tool_name: "update_playbook", level: PermissionLevel.WRITE_INTERNAL, requires_approval: true, description: "Change agent playbooks from learned patterns" },
        ],
        max_cost_per_action_usd: 2.00,
        max_batch_size: 50,
        can_write_external: false,
        can_execute: false,
    },

    agent9: {
        agent_id: "agent9",
        agent_name: "Revenue Intelligence",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL],
        tool_permissions: [
            { tool_name: "read_portfolio", level: PermissionLevel.READ, requires_approval: false, description: "Read client portfolio state" },
            { tool_name: "read_invoices", level: PermissionLevel.READ, requires_approval: false, description: "Read invoice and payment records" },
            { tool_name: "save_portfolio_pattern", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Record a detected portfolio pattern" },
            { tool_name: "update_portfolio_health", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Update client health scores" },
        ],
        max_cost_per_action_usd: 2.00,
        max_batch_size: 50,
        can_write_external: false,
        can_execute: false,
    },

    agent10: {
        agent_id: "agent10",
        agent_name: "Content",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "web_search", level: PermissionLevel.READ, requires_approval: false, description: "Research content angles" },
            { tool_name: "save_content_draft", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Save a draft for review" },
            { tool_name: "publish_content", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Publish content to an external platform" },
        ],
        max_cost_per_action_usd: 3.00,
        max_batch_size: 10,
        can_write_external: true,
        can_execute: false,
    },

    agent11: {
        agent_id: "agent11",
        agent_name: "Business Development",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "web_search", level: PermissionLevel.READ, requires_approval: false, description: "Research prospects and partners" },
            { tool_name: "read_bd_records", level: PermissionLevel.READ, requires_approval: false, description: "Read the BD pipeline" },
            { tool_name: "update_bd_record", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Advance a BD record's stage" },
            { tool_name: "contact_prospect", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Reach out to a prospect or partner" },
        ],
        max_cost_per_action_usd: 3.00,
        max_batch_size: 25,
        can_write_external: true,
        can_execute: false,
    },

    agent12: {
        agent_id: "agent12",
        agent_name: "Compliance & Invoicing",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL, PermissionLevel.WRITE_EXTERNAL],
        tool_permissions: [
            { tool_name: "read_compliance_records", level: PermissionLevel.READ, requires_approval: false, description: "Read contract and BAA records" },
            { tool_name: "read_invoices", level: PermissionLevel.READ, requires_approval: false, description: "Read invoice records" },
            { tool_name: "create_invoice", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Draft an invoice" },
            { tool_name: "send_invoice", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Send an invoice to a client" },
            { tool_name: "send_renewal_alert", level: PermissionLevel.WRITE_EXTERNAL, requires_approval: true, description: "Notify a client of an expiring contract" },
        ],
        max_cost_per_action_usd: 2.00,
        max_batch_size: 25,
        can_write_external: true,
        can_execute: false,
    },

    agent13: {
        agent_id: "agent13",
        agent_name: "Internal Ops",
        allowed_levels: [PermissionLevel.READ, PermissionLevel.WRITE_INTERNAL],
        tool_permissions: [
            { tool_name: "read_calendar", level: PermissionLevel.READ, requires_approval: false, description: "Read the operating calendar" },
            { tool_name: "read_commitments", level: PermissionLevel.READ, requires_approval: false, description: "Read open commitments" },
            { tool_name: "save_commitment", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Capture a commitment from a call or email" },
            { tool_name: "update_commitment", level: PermissionLevel.WRITE_INTERNAL, requires_approval: false, description: "Complete or defer a commitment" },
        ],
        max_cost_per_action_usd: 1.00,
        max_batch_size: 50,
        can_write_external: false,
        can_execute: false,
    },
};

// ============================================================================
// PERMISSION CHECKER
// ============================================================================

export class ToolPermissionChecker {
    private permissions: Record<string, AgentPermissions>;
    private overrides: Map<string, Partial<AgentPermissions>> = new Map();

    constructor(customPermissions?: Record<string, AgentPermissions>) {
        this.permissions = customPermissions || { ...DEFAULT_PERMISSIONS };
    }

    /**
     * Check if an agent is allowed to use a specific tool
     */
    checkPermission(
        agentId: string,
        toolName: string,
        level: PermissionLevel,
        estimatedCostUsd: number = 0,
        batchSize: number = 1
    ): PermissionCheckResult {
        const timestamp = new Date().toISOString();
        const agentPerms = this.getAgentPermissions(agentId);

        // Agent not found
        if (!agentPerms) {
            return {
                allowed: false,
                reason: `Unknown agent: ${agentId}. Deny by default.`,
                requires_approval: false,
                permission_level: level,
                agent_id: agentId,
                tool_name: toolName,
                timestamp,
            };
        }

        // Check permission level
        if (!agentPerms.allowed_levels.includes(level)) {
            return {
                allowed: false,
                reason: `Agent ${agentPerms.agent_name} does not have ${level} permission`,
                requires_approval: false,
                permission_level: level,
                agent_id: agentId,
                tool_name: toolName,
                timestamp,
            };
        }

        // Check specific tool permission
        const toolPerm = agentPerms.tool_permissions.find(tp => tp.tool_name === toolName);
        if (!toolPerm) {
            return {
                allowed: false,
                reason: `Tool "${toolName}" not in allowed list for Agent ${agentPerms.agent_name}. Deny by default.`,
                requires_approval: false,
                permission_level: level,
                agent_id: agentId,
                tool_name: toolName,
                timestamp,
            };
        }

        // Check cost threshold
        if (estimatedCostUsd > agentPerms.max_cost_per_action_usd) {
            return {
                allowed: false,
                reason: `Estimated cost $${estimatedCostUsd.toFixed(2)} exceeds agent limit of $${agentPerms.max_cost_per_action_usd.toFixed(2)}`,
                requires_approval: true,
                permission_level: level,
                agent_id: agentId,
                tool_name: toolName,
                timestamp,
            };
        }

        // Check batch size
        if (batchSize > agentPerms.max_batch_size) {
            return {
                allowed: false,
                reason: `Batch size ${batchSize} exceeds agent limit of ${agentPerms.max_batch_size}`,
                requires_approval: true,
                permission_level: level,
                agent_id: agentId,
                tool_name: toolName,
                timestamp,
            };
        }

        // Check external write capability
        if (level === PermissionLevel.WRITE_EXTERNAL && !agentPerms.can_write_external) {
            return {
                allowed: false,
                reason: `Agent ${agentPerms.agent_name} is not allowed to write to external systems`,
                requires_approval: false,
                permission_level: level,
                agent_id: agentId,
                tool_name: toolName,
                timestamp,
            };
        }

        // Check execute capability
        if (level === PermissionLevel.EXECUTE && !agentPerms.can_execute) {
            return {
                allowed: false,
                reason: `Agent ${agentPerms.agent_name} is not allowed to execute actions`,
                requires_approval: false,
                permission_level: level,
                agent_id: agentId,
                tool_name: toolName,
                timestamp,
            };
        }

        // Allowed — but may require approval
        return {
            allowed: true,
            reason: toolPerm.requires_approval
                ? `Allowed but requires approval: ${toolPerm.description}`
                : `Allowed: ${toolPerm.description}`,
            requires_approval: toolPerm.requires_approval,
            permission_level: level,
            agent_id: agentId,
            tool_name: toolName,
            timestamp,
        };
    }

    /**
     * Get agent permissions with overrides applied
     */
    private getAgentPermissions(agentId: string): AgentPermissions | null {
        const base = this.permissions[agentId];
        if (!base) return null;

        const override = this.overrides.get(agentId);
        if (!override) return base;

        return { ...base, ...override };
    }

    /**
     * Apply a client-specific permission override
     */
    setOverride(agentId: string, override: Partial<AgentPermissions>): void {
        this.overrides.set(agentId, override);
    }

    /**
     * Clear all overrides
     */
    clearOverrides(): void {
        this.overrides.clear();
    }

    /**
     * Get all permissions for an agent (for display/debugging)
     */
    getPermissions(agentId: string): AgentPermissions | null {
        return this.getAgentPermissions(agentId);
    }

    /**
     * List all registered agents and their permission summaries
     */
    listAgents(): Array<{
        agent_id: string;
        agent_name: string;
        levels: PermissionLevel[];
        tool_count: number;
        can_write_external: boolean;
        can_execute: boolean;
    }> {
        return Object.values(this.permissions).map(p => ({
            agent_id: p.agent_id,
            agent_name: p.agent_name,
            levels: p.allowed_levels,
            tool_count: p.tool_permissions.length,
            can_write_external: p.can_write_external,
            can_execute: p.can_execute,
        }));
    }
}

// Singleton instance
let _checker: ToolPermissionChecker | null = null;

export function getPermissionChecker(): ToolPermissionChecker {
    if (!_checker) {
        _checker = new ToolPermissionChecker();
    }
    return _checker;
}
