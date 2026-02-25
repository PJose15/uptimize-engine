/**
 * Tool Types — External Tool Abstraction
 *
 * Parallel to the Skills framework but for external tool calls.
 * Every MCP/API tool call goes through this registry for logging,
 * rate limiting, and governance enforcement.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ToolDefinition {
    /** Unique tool ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** What this tool does */
    description: string;
    /** Tool category */
    category: ToolCategory;
    /** Target system (e.g., "slack", "hubspot", "email") */
    target_system: string;
    /** Whether this tool writes to external systems */
    writes_external: boolean;
    /** Whether this tool's action is reversible */
    reversible: boolean;
    /** Estimated cost per call (USD) */
    estimated_cost_usd: number;
    /** Rate limit: max calls per minute */
    rate_limit_per_minute: number;
    /** Required parameters */
    parameters: ToolParameter[];
}

export interface ToolParameter {
    name: string;
    description: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    required: boolean;
    default?: unknown;
}

export type ToolCategory =
    | "search"        // Web/data search
    | "crm"           // CRM operations
    | "communication" // Email, SMS, Slack
    | "calendar"      // Scheduling
    | "storage"       // File/data storage
    | "analytics"     // Reporting/metrics
    | "integration";  // External API calls

export interface ToolCallRecord {
    call_id: string;
    tool_id: string;
    agent_id: string;
    timestamp: string;
    parameters: Record<string, unknown>;
    result: unknown;
    success: boolean;
    error: string | null;
    latency_ms: number;
    cost_usd: number;
}

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export class ToolRegistry {
    private tools: Map<string, ToolDefinition> = new Map();
    private callLog: ToolCallRecord[] = [];
    private callCounts: Map<string, { count: number; window_start: number }> = new Map();
    private maxLogSize: number;

    constructor(maxLogSize: number = 5_000) {
        this.maxLogSize = maxLogSize;
    }

    /**
     * Register a tool
     */
    register(tool: ToolDefinition): void {
        this.tools.set(tool.id, tool);
    }

    /**
     * Get a tool definition
     */
    get(toolId: string): ToolDefinition | undefined {
        return this.tools.get(toolId);
    }

    /**
     * List all tools
     */
    listAll(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    /**
     * List tools by category
     */
    listByCategory(category: ToolCategory): ToolDefinition[] {
        return this.listAll().filter(t => t.category === category);
    }

    /**
     * Check rate limit before calling a tool
     */
    checkRateLimit(toolId: string): { allowed: boolean; remaining: number; reset_in_ms: number } {
        const tool = this.tools.get(toolId);
        if (!tool) return { allowed: false, remaining: 0, reset_in_ms: 0 };

        const now = Date.now();
        const windowMs = 60_000; // 1 minute window
        const key = toolId;

        let counter = this.callCounts.get(key);
        if (!counter || (now - counter.window_start) >= windowMs) {
            counter = { count: 0, window_start: now };
            this.callCounts.set(key, counter);
        }

        const remaining = tool.rate_limit_per_minute - counter.count;
        const resetIn = windowMs - (now - counter.window_start);

        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            reset_in_ms: resetIn,
        };
    }

    /**
     * Record a tool call (increments rate limit counter + logs)
     */
    recordCall(record: ToolCallRecord): void {
        this.callLog.push(record);

        // Increment rate limit counter
        const counter = this.callCounts.get(record.tool_id);
        if (counter) counter.count++;

        // Trim log
        if (this.callLog.length > this.maxLogSize) {
            this.callLog = this.callLog.slice(-this.maxLogSize);
        }
    }

    /**
     * Get recent call log
     */
    getCallLog(limit: number = 50): ToolCallRecord[] {
        return this.callLog.slice(-limit).reverse();
    }

    /**
     * Get call log for a specific agent
     */
    getAgentCallLog(agentId: string, limit: number = 50): ToolCallRecord[] {
        return this.callLog
            .filter(r => r.agent_id === agentId)
            .slice(-limit)
            .reverse();
    }

    /**
     * Get stats
     */
    getStats(): {
        total_tools: number;
        total_calls: number;
        by_category: Record<string, number>;
        success_rate: number;
        total_cost_usd: number;
    } {
        const byCategory: Record<string, number> = {};
        for (const tool of this.tools.values()) {
            byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
        }

        const successCalls = this.callLog.filter(r => r.success).length;

        return {
            total_tools: this.tools.size,
            total_calls: this.callLog.length,
            by_category: byCategory,
            success_rate: this.callLog.length > 0 ? successCalls / this.callLog.length : 1,
            total_cost_usd: Number(
                this.callLog.reduce((sum, r) => sum + r.cost_usd, 0).toFixed(6)
            ),
        };
    }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _registry: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
    if (!_registry) {
        _registry = new ToolRegistry();
    }
    return _registry;
}
