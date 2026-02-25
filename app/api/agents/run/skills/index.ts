/**
 * Skill Registry — Loading, Composing, and Executing Skills
 *
 * Skills are reusable agent capabilities. This registry manages them.
 */

import type {
    Skill,
    SkillInput,
    SkillResult,
    SkillComposition,
    SkillCategory,
    PillarName,
} from "./skill-types";

// ============================================================================
// REGISTRY
// ============================================================================

export class SkillRegistry {
    private skills: Map<string, Skill> = new Map();
    private compositions: Map<string, SkillComposition> = new Map();

    /**
     * Register a skill
     */
    register(skill: Skill): void {
        if (this.skills.has(skill.id)) {
            console.warn(`Skill "${skill.id}" already registered. Overwriting.`);
        }
        this.skills.set(skill.id, skill);
    }

    /**
     * Register multiple skills at once
     */
    registerAll(skills: Skill[]): void {
        for (const skill of skills) {
            this.register(skill);
        }
    }

    /**
     * Get a skill by ID
     */
    get(skillId: string): Skill | undefined {
        return this.skills.get(skillId);
    }

    /**
     * List all registered skills
     */
    listAll(): Skill[] {
        return Array.from(this.skills.values());
    }

    /**
     * List skills by category
     */
    listByCategory(category: SkillCategory): Skill[] {
        return this.listAll().filter(s => s.category === category);
    }

    /**
     * List skills by pillar
     */
    listByPillar(pillar: PillarName): Skill[] {
        return this.listAll().filter(s =>
            s.pillars.some(p => p.pillar === pillar)
        );
    }

    /**
     * Compose a prompt from a skill, filling in variables
     */
    composePrompt(skillId: string, variables: Record<string, unknown>): string | null {
        const skill = this.skills.get(skillId);
        if (!skill) return null;

        let prompt = skill.prompt_template;

        // Validate required variables
        for (const variable of skill.input_variables) {
            if (variable.required && !(variable.name in variables)) {
                console.error(`Missing required variable "${variable.name}" for skill "${skillId}"`);
                return null;
            }
        }

        // Substitute variables
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            const stringValue = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
            prompt = prompt.replaceAll(placeholder, stringValue);
        }

        return prompt;
    }

    /**
     * Register a skill composition
     */
    registerComposition(composition: SkillComposition): void {
        this.compositions.set(composition.id, composition);
    }

    /**
     * Get a composition by ID
     */
    getComposition(compositionId: string): SkillComposition | undefined {
        return this.compositions.get(compositionId);
    }

    /**
     * Get ordered skills for a composition (resolving dependencies)
     */
    getExecutionOrder(compositionId: string): Skill[] {
        const composition = this.compositions.get(compositionId);
        if (!composition) return [];

        const ordered: Skill[] = [];
        const visited = new Set<string>();

        const visit = (skillId: string) => {
            if (visited.has(skillId)) return;
            visited.add(skillId);

            const skill = this.skills.get(skillId);
            if (!skill) return;

            // Visit dependencies first
            for (const dep of skill.depends_on) {
                visit(dep);
            }

            ordered.push(skill);
        };

        for (const skillId of composition.skills) {
            visit(skillId);
        }

        return ordered;
    }

    /**
     * Get registry stats
     */
    getStats(): {
        total_skills: number;
        by_category: Record<string, number>;
        by_pillar: Record<string, number>;
        compositions: number;
    } {
        const byCategory: Record<string, number> = {};
        const byPillar: Record<string, number> = {};

        for (const skill of this.skills.values()) {
            byCategory[skill.category] = (byCategory[skill.category] || 0) + 1;
            for (const mapping of skill.pillars) {
                byPillar[mapping.pillar] = (byPillar[mapping.pillar] || 0) + 1;
            }
        }

        return {
            total_skills: this.skills.size,
            by_category: byCategory,
            by_pillar: byPillar,
            compositions: this.compositions.size,
        };
    }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _registry: SkillRegistry | null = null;

export function getSkillRegistry(): SkillRegistry {
    if (!_registry) {
        _registry = new SkillRegistry();
        registerBuiltinSkills(_registry);
    }
    return _registry;
}

// ============================================================================
// BUILT-IN SKILLS
// ============================================================================

function registerBuiltinSkills(registry: SkillRegistry): void {
    registry.registerAll([
        {
            id: "shadow-ops-discovery",
            name: "Shadow Ops Discovery",
            description: "Discover invisible off-system work across an organization",
            version: "1.0.0",
            category: "discovery",
            prompt_template: `Analyze the following business context and identify Shadow Operations — invisible, off-system work that happens in WhatsApp, spreadsheets, DMs, sticky notes, and people's heads.

## Business Context
{{business_context}}

## Industry
{{industry}}

## Team Size
{{team_size}}

## Output Requirements
Return a JSON object with:
- shadow_ops_found: array of discovered shadow ops, each with: description, estimated_hours_per_week, severity (1-10), evidence, affected_roles
- total_estimated_hours: total recoverable hours per week
- top_3_priorities: the most impactful shadow ops to address first
- confidence: your confidence in these findings (high/medium/low)`,
            input_variables: [
                { name: "business_context", description: "Description of the business and its operations", required: true, type: "string" },
                { name: "industry", description: "Industry vertical", required: true, type: "string" },
                { name: "team_size", description: "Number of people on the team", required: false, type: "number", default: 10 },
            ],
            output_schema: {
                type: "object",
                required: ["shadow_ops_found", "total_estimated_hours", "top_3_priorities", "confidence"],
            },
            pillars: [{ pillar: "shadow_ops", contribution: "primary" }],
            task_requirements: { needs_web_search: false, reasoning_depth: "deep", needs_structured_json: true },
            depends_on: [],
        },

        {
            id: "exception-mapping",
            name: "Exception Mapping",
            description: "Map exceptions and edge cases that break standard workflows",
            version: "1.0.0",
            category: "analysis",
            prompt_template: `Analyze the following operational workflows and map all exceptions — edge cases, workarounds, and scenarios where the standard process breaks down.

## Workflows
{{workflows}}

## Current Pain Points
{{pain_points}}

## Output Requirements
Return a JSON object with:
- exceptions: array of exceptions, each with: description, frequency (daily/weekly/monthly), current_handling (how it's dealt with now), impact_severity (1-10), affected_workflow
- exception_rate: estimated percentage of work that's exception-based
- auto_handle_candidates: exceptions that could be automatically resolved by an agent
- escalation_required: exceptions that always need human judgment`,
            input_variables: [
                { name: "workflows", description: "Description of operational workflows", required: true, type: "string" },
                { name: "pain_points", description: "Known pain points and issues", required: false, type: "string", default: "Not specified" },
            ],
            output_schema: {
                type: "object",
                required: ["exceptions", "exception_rate", "auto_handle_candidates"],
            },
            pillars: [{ pillar: "exceptions", contribution: "primary" }],
            task_requirements: { needs_web_search: false, reasoning_depth: "deep", needs_structured_json: true },
            depends_on: [],
        },

        {
            id: "roi-calculation",
            name: "ROI Calculation",
            description: "Calculate and project ROI from operational improvements",
            version: "1.0.0",
            category: "measurement",
            prompt_template: `Calculate the ROI of deploying autonomous agents to address the following operational issues:

## Shadow Ops Discovered
{{shadow_ops}}

## Exceptions Mapped
{{exceptions}}

## Current Costs
{{current_costs}}

## Output Requirements
Return a JSON object with:
- monthly_savings_usd: estimated monthly savings
- roi_percentage: ROI as a percentage
- payback_period_months: months until investment is recovered
- breakdown_by_pillar: savings broken down by each 6-pillar category
- conservative_estimate: most conservative projection
- optimistic_estimate: best-case projection`,
            input_variables: [
                { name: "shadow_ops", description: "Shadow ops findings", required: true, type: "string" },
                { name: "exceptions", description: "Exception mapping results", required: true, type: "string" },
                { name: "current_costs", description: "Current operational costs and team size", required: true, type: "string" },
            ],
            output_schema: {
                type: "object",
                required: ["monthly_savings_usd", "roi_percentage", "payback_period_months"],
            },
            pillars: [
                { pillar: "shadow_ops", contribution: "secondary" },
                { pillar: "exceptions", contribution: "secondary" },
            ],
            task_requirements: { needs_web_search: false, reasoning_depth: "medium", needs_structured_json: true },
            depends_on: ["shadow-ops-discovery", "exception-mapping"],
        },

        {
            id: "audit-reporting",
            name: "Audit Reporting",
            description: "Generate 6-pillar audit reports with before/after metrics",
            version: "1.0.0",
            category: "measurement",
            prompt_template: `Generate a comprehensive 6-pillar audit report for the following client:

## Client Name
{{client_name}}

## Engagement Period
{{period}}

## Pillar Data
{{pillar_data}}

## Output Requirements
Return a JSON object with a report for each of the 6 pillars:
1. Shadow Ops: hours_before, hours_after, reduction_percentage
2. Exceptions: count_before, count_after, auto_handle_rate
3. Audit Trail: completeness_before, completeness_after
4. Knowledge: decisions_documented, single_point_failures_eliminated
5. Handoffs: sla_hit_rate_before, sla_hit_rate_after, stuck_cases_resolved
6. Channels: evidence_capture_rate, findability_score

Plus overall: total_roi, summary, recommendations`,
            input_variables: [
                { name: "client_name", description: "Client name", required: true, type: "string" },
                { name: "period", description: "Reporting period", required: true, type: "string" },
                { name: "pillar_data", description: "Raw pillar metrics data", required: true, type: "string" },
            ],
            output_schema: {
                type: "object",
                required: ["pillars", "total_roi", "summary"],
            },
            pillars: [
                { pillar: "shadow_ops", contribution: "primary" },
                { pillar: "exceptions", contribution: "primary" },
                { pillar: "audit_trail", contribution: "primary" },
                { pillar: "knowledge", contribution: "primary" },
                { pillar: "handoffs", contribution: "primary" },
                { pillar: "channels", contribution: "primary" },
            ],
            task_requirements: { needs_web_search: false, reasoning_depth: "medium", needs_structured_json: true },
            depends_on: [],
        },

        {
            id: "proposal-generation",
            name: "Proposal Generation",
            description: "Generate client proposals/SOWs based on audit findings",
            version: "1.0.0",
            category: "generation",
            prompt_template: `Generate an operator-grade proposal for the following client based on audit findings:

## Client Profile
{{client_profile}}

## Audit Findings
{{audit_findings}}

## Pricing Model
{{pricing_model}}

## Output Requirements
Return a JSON object with:
- executive_summary: 2-3 paragraph summary
- problem_statement: quantified pain
- proposed_solution: what we'll deploy (agents, workflows, integrations)
- deliverables: list of concrete deliverables with timelines
- pricing: pricing breakdown
- expected_outcomes: projected 6-pillar improvements
- timeline: implementation timeline
- terms: standard engagement terms`,
            input_variables: [
                { name: "client_profile", description: "Client industry, size, context", required: true, type: "string" },
                { name: "audit_findings", description: "6-pillar audit results", required: true, type: "string" },
                { name: "pricing_model", description: "Pricing structure to use", required: false, type: "string", default: "Standard monthly retainer" },
            ],
            output_schema: {
                type: "object",
                required: ["executive_summary", "problem_statement", "proposed_solution", "deliverables", "expected_outcomes"],
            },
            pillars: [],
            task_requirements: { needs_web_search: false, reasoning_depth: "deep", needs_structured_json: true },
            depends_on: ["shadow-ops-discovery", "exception-mapping"],
        },
    ]);
}
