/**
 * Portal Mock Data — Simulated Client Agent Data
 *
 * Shapes exactly match what real APIs will return.
 * Swap this import for real API calls when ready.
 */

// ============================================================================
// TYPES (exported for use in portal pages)
// ============================================================================

export interface AgentInfo {
    id: string;
    name: string;
    description: string;
    status: "active" | "paused" | "maintenance";
    deployed_at: string;
    industry: string;
}

export interface ClientInfo {
    id: string;
    name: string;
    company: string;
    agent: AgentInfo;
}

export interface ActivityEntry {
    id: string;
    timestamp: string;
    action: string;
    description: string;
    status: "completed" | "pending" | "failed" | "skipped";
    pillar: string;
    tool_used: string | null;
    cost_usd: number;
    duration_ms: number;
}

export interface ApprovalItem {
    id: string;
    timestamp: string;
    action: string;
    description: string;
    risk_level: "low" | "medium" | "high";
    affected_system: string;
    reason: string;
    status: "pending" | "approved" | "denied" | "expired";
    decided_at: string | null;
    decided_by: string | null;
    note: string | null;
}

export interface PillarMetric {
    pillar: string;
    label: string;
    icon: string;
    before: number;
    after: number;
    unit: string;
    trend: "up" | "down" | "flat";
    description: string;
}

export interface PermissionGroup {
    category: string;
    icon: string;
    tools: PermissionTool[];
}

export interface PermissionTool {
    id: string;
    name: string;
    access: "read" | "write" | "execute" | "none";
    description: string;
    last_used: string | null;
}

export interface AuditEntry {
    id: string;
    timestamp: string;
    action: string;
    tool: string;
    status: "success" | "denied" | "failed" | "approved";
    approved_by: string | null;
    cost_usd: number;
    details: string;
}

// ============================================================================
// MOCK CLIENT
// ============================================================================

export const mockClient: ClientInfo = {
    id: "client_001",
    name: "Sarah Chen",
    company: "Meridian Logistics",
    agent: {
        id: "agent_meridian_ops",
        name: "Ops Handler",
        description: "Manages freight coordination, driver scheduling, and exception handling",
        status: "active",
        deployed_at: "2026-01-15T09:00:00Z",
        industry: "logistics",
    },
};

// ============================================================================
// MOCK ACTIVITY
// ============================================================================

export const mockActivity: ActivityEntry[] = [
    {
        id: "act_001",
        timestamp: "2026-02-25T15:30:00Z",
        action: "Processed incoming shipment requests",
        description: "Reviewed 12 new shipment requests, auto-matched 9 to available carriers based on route and rate history. 3 flagged for manual review.",
        status: "completed",
        pillar: "Shadow Ops",
        tool_used: "CRM",
        cost_usd: 0.02,
        duration_ms: 4500,
    },
    {
        id: "act_002",
        timestamp: "2026-02-25T14:15:00Z",
        action: "Resolved driver scheduling conflict",
        description: "Detected double-booking for Driver #47 (routes ATL→MIA and ATL→JAX). Reassigned JAX route to Driver #52 who had availability.",
        status: "completed",
        pillar: "Exceptions",
        tool_used: "Calendar",
        cost_usd: 0.01,
        duration_ms: 3200,
    },
    {
        id: "act_003",
        timestamp: "2026-02-25T13:45:00Z",
        action: "Generated weekly performance report",
        description: "Compiled KPI report: 94% on-time delivery (up from 87%), 12 exceptions handled (8 auto-resolved), $4,200 estimated savings this week.",
        status: "completed",
        pillar: "Audit Trail",
        tool_used: null,
        cost_usd: 0.03,
        duration_ms: 8100,
    },
    {
        id: "act_004",
        timestamp: "2026-02-25T11:00:00Z",
        action: "Updated rate sheets from carrier responses",
        description: "Received 4 carrier rate updates via email. Updated rate comparison spreadsheet. Flagged 2 carriers with >15% increases for review.",
        status: "completed",
        pillar: "Knowledge",
        tool_used: "Email",
        cost_usd: 0.01,
        duration_ms: 5600,
    },
    {
        id: "act_005",
        timestamp: "2026-02-25T10:30:00Z",
        action: "Escalated customs hold to ops manager",
        description: "Shipment #SH-9482 held at customs (missing phytosanitary certificate). Notified ops manager with document requirements and carrier contact.",
        status: "completed",
        pillar: "Handoffs",
        tool_used: "Slack",
        cost_usd: 0.005,
        duration_ms: 2100,
    },
    {
        id: "act_006",
        timestamp: "2026-02-25T09:00:00Z",
        action: "Morning status check — all systems operational",
        description: "Verified 3 active routes on track. No overnight exceptions. 2 deliveries confirmed completed. Updated status board.",
        status: "completed",
        pillar: "Channels",
        tool_used: null,
        cost_usd: 0.01,
        duration_ms: 3800,
    },
    {
        id: "act_007",
        timestamp: "2026-02-24T16:00:00Z",
        action: "Attempted to send follow-up to stale lead",
        description: "Lead #L-312 has been inactive for 14 days. Attempted to generate follow-up email but missing last contact notes.",
        status: "failed",
        pillar: "Shadow Ops",
        tool_used: "Email",
        cost_usd: 0.005,
        duration_ms: 1200,
    },
    {
        id: "act_008",
        timestamp: "2026-02-24T14:30:00Z",
        action: "Auto-categorized 23 incoming support tickets",
        description: "Sorted tickets by priority and type. 15 routine (auto-responded), 5 billing (routed to finance), 3 urgent (escalated to on-call).",
        status: "completed",
        pillar: "Exceptions",
        tool_used: "CRM",
        cost_usd: 0.02,
        duration_ms: 6700,
    },
];

// ============================================================================
// MOCK APPROVALS
// ============================================================================

export const mockApprovals: ApprovalItem[] = [
    {
        id: "apr_001",
        timestamp: "2026-02-25T15:45:00Z",
        action: "Send rate negotiation email to FastLane Carriers",
        description: "Agent wants to send an email to negotiate a 10% rate reduction based on volume commitment. Email draft attached.",
        risk_level: "medium",
        affected_system: "Email",
        reason: "External communication requires approval per governance policy",
        status: "pending",
        decided_at: null,
        decided_by: null,
        note: null,
    },
    {
        id: "apr_002",
        timestamp: "2026-02-25T14:00:00Z",
        action: "Update 15 records in HubSpot CRM",
        description: "Batch update: mark 15 leads as 'contacted' and add follow-up dates based on last interaction.",
        risk_level: "medium",
        affected_system: "HubSpot CRM",
        reason: "Batch operations on >10 records require approval",
        status: "pending",
        decided_at: null,
        decided_by: null,
        note: null,
    },
    {
        id: "apr_003",
        timestamp: "2026-02-24T16:30:00Z",
        action: "Create Slack channel for new client onboarding",
        description: "New client 'Pacific Freight' starting onboarding. Agent wants to create #pacific-freight-ops channel and invite team.",
        risk_level: "low",
        affected_system: "Slack",
        reason: "External system write requires approval",
        status: "approved",
        decided_at: "2026-02-24T16:45:00Z",
        decided_by: "Sarah Chen",
        note: "Approved — go ahead",
    },
    {
        id: "apr_004",
        timestamp: "2026-02-24T11:00:00Z",
        action: "Send automated rate quote to prospect",
        description: "Prospect requested quote for ATL→LAX corridor. Agent generated competitive rate based on historical data.",
        risk_level: "high",
        affected_system: "Email",
        reason: "Financial communication to external party",
        status: "denied",
        decided_at: "2026-02-24T11:30:00Z",
        decided_by: "Sarah Chen",
        note: "Need to verify the rate — our ATL→LAX rates changed last week",
    },
];

// ============================================================================
// MOCK 6-PILLAR METRICS
// ============================================================================

export const mockPillarMetrics: PillarMetric[] = [
    {
        pillar: "shadow_ops",
        label: "Shadow Ops",
        icon: "👻",
        before: 18,
        after: 5,
        unit: "hrs/week",
        trend: "down",
        description: "Off-system work moved into tracked workflows",
    },
    {
        pillar: "exceptions",
        label: "Exceptions",
        icon: "⚡",
        before: 24,
        after: 8,
        unit: "per week",
        trend: "down",
        description: "Edge cases auto-resolved without human intervention",
    },
    {
        pillar: "audit_trail",
        label: "Audit Trail",
        icon: "📋",
        before: 34,
        after: 97,
        unit: "% complete",
        trend: "up",
        description: "Actions with full provability chain",
    },
    {
        pillar: "knowledge",
        label: "Knowledge",
        icon: "🧠",
        before: 2,
        after: 0,
        unit: "single points",
        trend: "down",
        description: "Single-person dependencies eliminated",
    },
    {
        pillar: "handoffs",
        label: "Handoffs & SLAs",
        icon: "🤝",
        before: 62,
        after: 94,
        unit: "% on-time",
        trend: "up",
        description: "Cross-team handoffs completed within SLA",
    },
    {
        pillar: "channels",
        label: "Channels & Evidence",
        icon: "📎",
        before: 41,
        after: 89,
        unit: "% captured",
        trend: "up",
        description: "Decisions with evidence trail and findability",
    },
];

// ============================================================================
// MOCK PERMISSIONS
// ============================================================================

export const mockPermissions: PermissionGroup[] = [
    {
        category: "CRM",
        icon: "👥",
        tools: [
            { id: "crm_read", name: "Read contacts & deals", access: "read", description: "View contact info, deal stages, and notes", last_used: "2026-02-25T15:30:00Z" },
            { id: "crm_write", name: "Update records", access: "write", description: "Modify contact fields, deal status, add notes", last_used: "2026-02-25T14:15:00Z" },
            { id: "crm_create", name: "Create new records", access: "write", description: "Add new contacts, deals, or activities", last_used: "2026-02-24T11:00:00Z" },
        ],
    },
    {
        category: "Email",
        icon: "✉️",
        tools: [
            { id: "email_read", name: "Read emails", access: "read", description: "Read incoming emails and attachments", last_used: "2026-02-25T11:00:00Z" },
            { id: "email_send", name: "Send emails", access: "execute", description: "Send emails on behalf of the team (requires approval)", last_used: "2026-02-24T16:30:00Z" },
            { id: "email_draft", name: "Draft emails", access: "write", description: "Create email drafts for review", last_used: "2026-02-25T15:45:00Z" },
        ],
    },
    {
        category: "Calendar",
        icon: "📅",
        tools: [
            { id: "cal_read", name: "View schedule", access: "read", description: "Check team availability and scheduled events", last_used: "2026-02-25T14:15:00Z" },
            { id: "cal_write", name: "Create events", access: "write", description: "Schedule meetings and block time", last_used: "2026-02-24T10:00:00Z" },
        ],
    },
    {
        category: "Slack",
        icon: "💬",
        tools: [
            { id: "slack_read", name: "Read messages", access: "read", description: "Monitor specified channels for relevant updates", last_used: "2026-02-25T10:30:00Z" },
            { id: "slack_send", name: "Send messages", access: "execute", description: "Post messages and alerts (requires approval for external)", last_used: "2026-02-25T10:30:00Z" },
            { id: "slack_create", name: "Create channels", access: "execute", description: "Create new channels (requires approval)", last_used: "2026-02-24T16:45:00Z" },
        ],
    },
    {
        category: "Analytics",
        icon: "📊",
        tools: [
            { id: "analytics_read", name: "Read metrics", access: "read", description: "Access performance data and KPIs", last_used: "2026-02-25T13:45:00Z" },
            { id: "analytics_report", name: "Generate reports", access: "execute", description: "Create and distribute performance reports", last_used: "2026-02-25T13:45:00Z" },
        ],
    },
];

// ============================================================================
// MOCK AUDIT LOG
// ============================================================================

export const mockAuditLog: AuditEntry[] = [
    { id: "aud_001", timestamp: "2026-02-25T15:45:00Z", action: "Requested approval: send email to FastLane Carriers", tool: "Approval Gate", status: "approved", approved_by: null, cost_usd: 0, details: "Pending client review" },
    { id: "aud_002", timestamp: "2026-02-25T15:30:00Z", action: "Matched 9 shipments to carriers", tool: "CRM", status: "success", approved_by: null, cost_usd: 0.02, details: "Auto-matched based on route history" },
    { id: "aud_003", timestamp: "2026-02-25T14:15:00Z", action: "Resolved scheduling conflict for Driver #47", tool: "Calendar", status: "success", approved_by: null, cost_usd: 0.01, details: "Reassigned JAX route to Driver #52" },
    { id: "aud_004", timestamp: "2026-02-25T14:00:00Z", action: "Requested approval: batch update 15 CRM records", tool: "Approval Gate", status: "approved", approved_by: null, cost_usd: 0, details: "Pending client review" },
    { id: "aud_005", timestamp: "2026-02-25T13:45:00Z", action: "Generated weekly KPI report", tool: "Analytics", status: "success", approved_by: null, cost_usd: 0.03, details: "94% on-time delivery, 12 exceptions handled" },
    { id: "aud_006", timestamp: "2026-02-25T11:00:00Z", action: "Updated carrier rate sheets", tool: "Email", status: "success", approved_by: null, cost_usd: 0.01, details: "4 carrier updates processed, 2 flagged" },
    { id: "aud_007", timestamp: "2026-02-25T10:30:00Z", action: "Escalated customs hold to ops manager", tool: "Slack", status: "success", approved_by: null, cost_usd: 0.005, details: "Shipment #SH-9482, missing phytosanitary cert" },
    { id: "aud_008", timestamp: "2026-02-25T09:00:00Z", action: "Morning systems check", tool: "Internal", status: "success", approved_by: null, cost_usd: 0.01, details: "All systems operational, 3 routes on track" },
    { id: "aud_009", timestamp: "2026-02-24T16:45:00Z", action: "Created Slack channel #pacific-freight-ops", tool: "Slack", status: "approved", approved_by: "Sarah Chen", cost_usd: 0.005, details: "Client onboarding channel" },
    { id: "aud_010", timestamp: "2026-02-24T16:30:00Z", action: "Requested approval: create Slack channel", tool: "Approval Gate", status: "approved", approved_by: "Sarah Chen", cost_usd: 0, details: "Approved by client" },
    { id: "aud_011", timestamp: "2026-02-24T14:30:00Z", action: "Categorized 23 support tickets", tool: "CRM", status: "success", approved_by: null, cost_usd: 0.02, details: "15 auto-responded, 5 routed, 3 escalated" },
    { id: "aud_012", timestamp: "2026-02-24T11:30:00Z", action: "Denied: send rate quote to prospect", tool: "Approval Gate", status: "denied", approved_by: "Sarah Chen", cost_usd: 0, details: "Rate verification needed" },
    { id: "aud_013", timestamp: "2026-02-24T11:00:00Z", action: "Requested approval: send rate quote email", tool: "Approval Gate", status: "denied", approved_by: "Sarah Chen", cost_usd: 0, details: "ATL→LAX corridor rate" },
];

// ============================================================================
// MOCK SUMMARY STATS
// ============================================================================

export const mockStats = {
    actions_today: 6,
    hours_saved_week: 13.2,
    pending_approvals: 2,
    health_score: 92,
    total_actions_month: 347,
    total_cost_month: 4.82,
    success_rate: 96,
    exceptions_auto_resolved: 67,
};

// ============================================================================
// TREND DATA
// ============================================================================

export const mockHoursSavedTrend = [
    { week: "Jan 20", hours: 6.4 },
    { week: "Jan 27", hours: 8.1 },
    { week: "Feb 3", hours: 9.7 },
    { week: "Feb 10", hours: 11.3 },
    { week: "Feb 17", hours: 12.8 },
    { week: "Feb 24", hours: 13.2 },
];

export const mockHealthScoreTrend = [
    { week: "Jan 20", score: 74 },
    { week: "Jan 27", score: 79 },
    { week: "Feb 3", score: 83 },
    { week: "Feb 10", score: 87 },
    { week: "Feb 17", score: 90 },
    { week: "Feb 24", score: 92 },
];
