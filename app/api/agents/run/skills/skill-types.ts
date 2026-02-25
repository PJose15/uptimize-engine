/**
 * Skill Types — Capability System
 *
 * A skill is a reusable agent capability:
 * prompt template + JSON output schema + validation.
 *
 * Agents compose skills rather than having monolithic system prompts.
 * This is the moat — allows building custom agents from building blocks.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Skill {
    /** Unique skill identifier */
    id: string;
    /** Human-readable name */
    name: string;
    /** What this skill does */
    description: string;
    /** Version for tracking changes */
    version: string;
    /** Skill category */
    category: SkillCategory;
    /** The prompt template (with {{variable}} placeholders) */
    prompt_template: string;
    /** Variables this skill expects */
    input_variables: SkillVariable[];
    /** JSON schema for expected output */
    output_schema: Record<string, unknown>;
    /** Which 6-pillar(s) this skill maps to */
    pillars: PillarMapping[];
    /** Task requirements for model selection */
    task_requirements: {
        needs_web_search: boolean;
        reasoning_depth: "shallow" | "medium" | "deep";
        needs_structured_json: boolean;
    };
    /** Dependencies — other skills that should run first */
    depends_on: string[];
}

export interface SkillVariable {
    name: string;
    description: string;
    required: boolean;
    type: "string" | "number" | "boolean" | "object" | "array";
    default?: unknown;
}

export type SkillCategory =
    | "discovery"    // Finding problems
    | "analysis"     // Analyzing data
    | "generation"   // Creating deliverables
    | "measurement"  // Tracking metrics
    | "communication"// Client-facing output
    | "integration"; // System connections

export interface PillarMapping {
    pillar: PillarName;
    contribution: "primary" | "secondary";
}

export type PillarName =
    | "shadow_ops"
    | "exceptions"
    | "audit_trail"
    | "knowledge"
    | "handoffs"
    | "channels";

// ============================================================================
// SKILL EXECUTION
// ============================================================================

export interface SkillInput {
    skill_id: string;
    variables: Record<string, unknown>;
    context?: Record<string, unknown>;
}

export interface SkillResult {
    skill_id: string;
    success: boolean;
    output: Record<string, unknown> | null;
    validation_errors: string[];
    execution_time_ms: number;
    model_used: string;
    cost_usd: number;
}

// ============================================================================
// SKILL COMPOSITION
// ============================================================================

export interface SkillComposition {
    /** Unique composition ID */
    id: string;
    /** Name of this composed agent/workflow */
    name: string;
    /** Ordered list of skills to execute */
    skills: string[];
    /** How skills chain together */
    chain_mode: "sequential" | "parallel" | "conditional";
    /** Conditions for conditional chaining */
    conditions?: Record<string, SkillCondition>;
    /** Industry overlay to apply */
    industry_overlay?: string;
}

export interface SkillCondition {
    skill_id: string;
    field: string;
    operator: "equals" | "greater_than" | "less_than" | "contains" | "exists";
    value: unknown;
    /** Which skill to run if condition is met */
    then_skill: string;
    /** Which skill to run if condition is not met */
    else_skill?: string;
}
