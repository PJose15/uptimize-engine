/**
 * Shared TypeScript types for the Agent Orchestrator
 */

export enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTH_ERROR = "AUTH_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    MODEL_ERROR = "MODEL_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export enum ProviderName {
    GEMINI = "gemini",
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    PERPLEXITY = "perplexity",
}

export interface RequestMetadata {
    requestId: string;
    timestamp: string;
    taskLength: number;
}

export interface ResponseMetadata {
    agent?: string;
    provider: string;
    model: string;
    timestamp: string;
    latencyMs: number;
    tokensUsed?: number;
}

export type AgentMode = "fast" | "balanced" | "quality";

export interface AgentRequest {
    task: string;
    mode?: AgentMode;
    context?: string;
    preferences?: Record<string, unknown>;
}

export interface UsageInfo {
    totalTokens: number;
    estimatedCostUSD: number;
    providerCosts: Array<{
        provider: string;
        tokens: number;
        costUSD: number;
    }>;
}

export interface AgentResult {
    success: boolean;
    message: string;
    data?: {
        provider: string;
        model: string;
        timestamp: string;
        latencyMs: number;
        tokensUsed?: number;
        result?: any;  // Structured output from specialized agents (e.g., ZGO parsed JSON)
    };
    usage?: UsageInfo;
    error?: {
        type: ErrorType;
        details: string;
        timestamp: string;
    };
}

export interface ProviderConfig {
    name: ProviderName;
    model: string;
    timeoutMs: number;
    maxTokens?: number;
    temperature?: number;
}

export interface OrchestrationError extends Error {
    type: ErrorType;
    provider?: string;
    originalError?: unknown;
}

// ============================================================================
// AGENT CHECKLIST TYPES
// ============================================================================

/**
 * Checklist status for an agent
 */
export type AgentChecklistStatus =
    | "draft"           // Checklist created but not complete
    | "in_review"       // Ready for review
    | "approved"        // Approved by reviewer
    | "shipped"         // Deployed to production
    | "deprecated";     // No longer active

/**
 * Ship gate readiness status
 */
export type ShipReadiness =
    | "not_ready"       // Has blocking issues
    | "ready_for_review" // Passed validation, awaiting approval
    | "approved"        // Approved for shipping
    | "shipped"         // Live in production
    | "blocked"         // Has unresolved blockers
    | "rolled_back";    // Was shipped but rolled back

/**
 * Agent metadata including checklist status
 */
export interface AgentMetadata {
    agent_id: string;
    agent_name: string;
    agent_type: AgentType;
    version: string;
    checklist_status: AgentChecklistStatus;
    ship_readiness: ShipReadiness;
    last_validated: string;
    validation_score: number; // 0-100
    can_ship: boolean;
    blocking_issues_count: number;
    warnings_count: number;
}

/**
 * Agent type identifier
 */
export type AgentType =
    | "agent-1-market-intelligence"
    | "agent-2-outbound-appointment"
    | "agent-3-sales-engineer"
    | "agent-4-systems-delivery"
    | "agent-5-client-success"
    | "agent-6-brand-content"
    | "agent-7-paid-acquisition"
    | "agent-8-partnerships"
    | "agent-9-finance-pricing"
    | "agent-10-platform-infrastructure";

/**
 * Extended agent result with checklist status
 */
export interface AgentResultWithStatus extends AgentResult {
    agent_metadata?: AgentMetadata;
}

/**
 * Agent registry entry
 */
export interface AgentRegistryEntry {
    agent_id: string;
    agent_name: string;
    agent_type: AgentType;
    implementation_path: string;
    checklist_path: string;
    is_implemented: boolean;
    is_production_ready: boolean;
    metadata?: AgentMetadata;
}

/**
 * Full agent registry
 */
export interface AgentRegistry {
    version: string;
    last_updated: string;
    agents: AgentRegistryEntry[];
    summary: {
        total: number;
        implemented: number;
        production_ready: number;
        draft: number;
    };
}
