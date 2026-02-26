/**
 * Agent Output Validation Schemas
 * Validates AI responses before passing to next agent
 */

import { z } from 'zod';

// Agent 1: Market Intelligence Output
export const Agent1OutputSchema = z.object({
    target_pack_primary: z.array(z.object({
        name: z.string(),
        fit_score: z.number().min(0).max(100),
        company: z.string().optional(),
        role: z.string().optional(),
    })).optional(),
    qualified_leads: z.array(z.unknown()).optional(),
    shadow_ops: z.array(z.unknown()).optional(),
    pain_points: z.array(z.string()).optional(),
}).passthrough();  // Allow extra fields from AI

// Agent 2: Outbound Output
export const Agent2OutputSchema = z.object({
    message_library: z.array(z.unknown()).optional(),
    email_sequences: z.array(z.unknown()).optional(),
    linkedin_messages: z.array(z.unknown()).optional(),
    booked_meetings: z.array(z.unknown()).optional(),
}).passthrough();

// Agent 3: Sales Engineer Output
export const Agent3OutputSchema = z.object({
    pre_call_briefs: z.array(z.unknown()).optional(),
    proposals: z.array(z.unknown()).optional(),
    discovery_notes: z.unknown().optional(),
    handoff_spec: z.unknown().optional(),
}).passthrough();

// Agent 4: Systems Builder Output
export const Agent4OutputSchema = z.object({
    build_plan: z.unknown().optional(),
    workflow_specs: z.array(z.unknown()).optional(),
    handoff_kit: z.unknown().optional(),
    sops: z.array(z.unknown()).optional(),
}).passthrough();

// Agent 5: Client Success Output
export const Agent5OutputSchema = z.object({
    onboarding_plan: z.unknown().optional(),
    weekly_win_report: z.unknown().optional(),
    expansion_map: z.unknown().optional(),
    health_score: z.number().optional(),
}).passthrough();

// Map of agent number to schema
export const AGENT_SCHEMAS: Record<number, z.ZodSchema> = {
    1: Agent1OutputSchema,
    2: Agent2OutputSchema,
    3: Agent3OutputSchema,
    4: Agent4OutputSchema,
    5: Agent5OutputSchema,
};

/**
 * Validate agent output
 * Returns normalized output or throws with details
 */
export function validateAgentOutput(
    agentNumber: number,
    output: unknown
): { valid: boolean; data: unknown; errors?: string[] } {
    const schema = AGENT_SCHEMAS[agentNumber];

    if (!schema) {
        return { valid: true, data: output };
    }

    // Handle string outputs (sometimes AI returns JSON string)
    let parsed = output;
    if (typeof output === 'string') {
        try {
            parsed = JSON.parse(output);
        } catch {
            // Not JSON, wrap it
            parsed = { raw_output: output };
        }
    }

    const result = schema.safeParse(parsed);

    if (result.success) {
        return { valid: true, data: result.data };
    }

    // Log validation issues but don't fail hard
    console.warn(`Agent ${agentNumber} output validation warnings:`, result.error.issues);

    // Return the original data but flag as having issues
    return {
        valid: false,
        data: parsed,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
    };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse(input: unknown): unknown {
    if (typeof input !== 'string') return input;

    try {
        return JSON.parse(input);
    } catch {
        return { raw: input };
    }
}
