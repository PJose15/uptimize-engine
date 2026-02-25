/**
 * Pipeline State Machine — Unified Orchestration
 *
 * Replaces the sequential fire-and-forget agent calls with a durable,
 * idempotent state machine. Every run has a run_id, every step has a
 * step_id, and the pipeline can replay safely without duplicating actions.
 */

// ============================================================================
// TYPES
// ============================================================================

export enum PipelineStage {
    INITIALIZED = "INITIALIZED",
    INTEL = "INTEL",
    DISCOVERY = "DISCOVERY",
    ENGINEERING = "ENGINEERING",
    DELIVERY = "DELIVERY",
    SUCCESS = "SUCCESS",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
}

export enum StepStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED",
    RETRYING = "RETRYING",
}

export interface HandoffEnvelope {
    /** ID of the agent producing this handoff */
    from_agent: string;
    /** ID of the agent consuming this handoff */
    to_agent: string;
    /** Structured data contract */
    payload: Record<string, unknown>;
    /** Confidence in the output quality */
    confidence: "high" | "medium" | "low";
    /** Flags for downstream agents */
    flags: string[];
    /** Timestamp of creation */
    created_at: string;
    /** Hash of the payload for deduplication */
    payload_hash: string;
}

export interface PipelineStep {
    step_id: string;
    run_id: string;
    agent_id: string;
    agent_name: string;
    stage: PipelineStage;
    status: StepStatus;
    /** Input handoff from previous agent */
    input_envelope: HandoffEnvelope | null;
    /** Output handoff for next agent */
    output_envelope: HandoffEnvelope | null;
    /** Raw agent result */
    result: Record<string, unknown> | null;
    /** Error if failed */
    error: string | null;
    /** Execution metadata */
    started_at: string | null;
    completed_at: string | null;
    duration_ms: number;
    cost_usd: number;
    /** Provider/model used */
    provider: string | null;
    model: string | null;
    /** Retry tracking */
    attempt_number: number;
    max_attempts: number;
    /** Idempotency key — prevents re-execution of completed steps */
    idempotency_key: string;
}

export interface PipelineState {
    run_id: string;
    created_at: string;
    updated_at: string;
    stage: PipelineStage;
    /** Original input */
    leads_input: string;
    /** All steps in this run */
    steps: PipelineStep[];
    /** Current step index */
    current_step_index: number;
    /** Total cost across all steps */
    total_cost_usd: number;
    /** Total duration */
    total_duration_ms: number;
    /** Client/workspace scope */
    workspace_id: string;
    /** Metadata tags */
    tags: Record<string, string>;
    /** Error if the pipeline failed */
    error: string | null;
}

export interface PipelineEvent {
    event_id: string;
    run_id: string;
    event_type: PipelineEventType;
    stage: PipelineStage;
    agent_id: string | null;
    timestamp: string;
    data: Record<string, unknown>;
}

export type PipelineEventType =
    | "pipeline.started"
    | "pipeline.stage_entered"
    | "pipeline.stage_completed"
    | "pipeline.completed"
    | "pipeline.failed"
    | "pipeline.cancelled"
    | "step.started"
    | "step.completed"
    | "step.failed"
    | "step.retrying"
    | "approval.requested"
    | "approval.granted"
    | "approval.denied";

// ============================================================================
// PIPELINE STATE MACHINE
// ============================================================================

/** Stage transition map — defines valid transitions */
const STAGE_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
    [PipelineStage.INITIALIZED]: [PipelineStage.INTEL, PipelineStage.FAILED, PipelineStage.CANCELLED],
    [PipelineStage.INTEL]: [PipelineStage.DISCOVERY, PipelineStage.FAILED, PipelineStage.CANCELLED],
    [PipelineStage.DISCOVERY]: [PipelineStage.ENGINEERING, PipelineStage.FAILED, PipelineStage.CANCELLED],
    [PipelineStage.ENGINEERING]: [PipelineStage.DELIVERY, PipelineStage.FAILED, PipelineStage.CANCELLED],
    [PipelineStage.DELIVERY]: [PipelineStage.SUCCESS, PipelineStage.FAILED, PipelineStage.CANCELLED],
    [PipelineStage.SUCCESS]: [PipelineStage.COMPLETE, PipelineStage.FAILED, PipelineStage.CANCELLED],
    [PipelineStage.COMPLETE]: [],
    [PipelineStage.FAILED]: [],
    [PipelineStage.CANCELLED]: [],
};

/** Maps pipeline stages to agent IDs */
const STAGE_TO_AGENT: Record<string, { id: string; name: string }> = {
    [PipelineStage.INTEL]: { id: "agent1", name: "Market Intelligence" },
    [PipelineStage.DISCOVERY]: { id: "agent2", name: "Discovery & Diagnosis" },
    [PipelineStage.ENGINEERING]: { id: "agent3", name: "Sales Engineer" },
    [PipelineStage.DELIVERY]: { id: "agent4", name: "Systems Delivery" },
    [PipelineStage.SUCCESS]: { id: "agent5", name: "Client Success" },
};

export class PipelineStateMachine {
    private state: PipelineState;
    private events: PipelineEvent[] = [];
    private completedIdempotencyKeys: Set<string> = new Set();

    constructor(runId: string, leadsInput: string, workspaceId: string = "default") {
        this.state = {
            run_id: runId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stage: PipelineStage.INITIALIZED,
            leads_input: leadsInput,
            steps: [],
            current_step_index: -1,
            total_cost_usd: 0,
            total_duration_ms: 0,
            workspace_id: workspaceId,
            tags: {},
            error: null,
        };

        this.initializeSteps();
        this.emitEvent("pipeline.started", PipelineStage.INITIALIZED, null, {});
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    /** Get current pipeline state (immutable snapshot) */
    getState(): Readonly<PipelineState> {
        return { ...this.state };
    }

    /** Get current stage */
    getStage(): PipelineStage {
        return this.state.stage;
    }

    /** Get all events */
    getEvents(): PipelineEvent[] {
        return [...this.events];
    }

    /** Transition to the next stage */
    transitionTo(nextStage: PipelineStage): boolean {
        const validTransitions = STAGE_TRANSITIONS[this.state.stage];
        if (!validTransitions.includes(nextStage)) {
            console.error(
                `Invalid transition: ${this.state.stage} → ${nextStage}. ` +
                `Valid: ${validTransitions.join(", ")}`
            );
            return false;
        }

        const prevStage = this.state.stage;
        this.state.stage = nextStage;
        this.state.updated_at = new Date().toISOString();

        this.emitEvent("pipeline.stage_entered", nextStage, STAGE_TO_AGENT[nextStage]?.id || null, {
            from: prevStage,
            to: nextStage,
        });

        return true;
    }

    /** Start a step (marks it as running, checks idempotency) */
    startStep(stage: PipelineStage): PipelineStep | null {
        const step = this.state.steps.find(s => s.stage === stage);
        if (!step) return null;

        // Idempotency check — if already completed, don't re-run
        if (this.completedIdempotencyKeys.has(step.idempotency_key)) {
            console.log(`Step ${step.step_id} already completed (idempotent). Skipping.`);
            return step;
        }

        if (step.status === StepStatus.COMPLETED) {
            this.completedIdempotencyKeys.add(step.idempotency_key);
            return step;
        }

        step.status = StepStatus.RUNNING;
        step.started_at = new Date().toISOString();
        step.attempt_number += 1;
        this.state.current_step_index = this.state.steps.indexOf(step);
        this.state.updated_at = new Date().toISOString();

        this.emitEvent("step.started", stage, step.agent_id, {
            step_id: step.step_id,
            attempt: step.attempt_number,
        });

        return step;
    }

    /** Complete a step with results */
    completeStep(
        stage: PipelineStage,
        result: Record<string, unknown>,
        options: {
            cost_usd?: number;
            provider?: string;
            model?: string;
            confidence?: "high" | "medium" | "low";
            flags?: string[];
        } = {}
    ): boolean {
        const step = this.state.steps.find(s => s.stage === stage);
        if (!step) return false;

        const now = new Date().toISOString();
        step.status = StepStatus.COMPLETED;
        step.completed_at = now;
        step.result = result;
        step.cost_usd = options.cost_usd || 0;
        step.provider = options.provider || null;
        step.model = options.model || null;

        if (step.started_at) {
            step.duration_ms = new Date(now).getTime() - new Date(step.started_at).getTime();
        }

        // Build output handoff envelope
        const nextAgent = this.getNextAgent(stage);
        step.output_envelope = {
            from_agent: step.agent_id,
            to_agent: nextAgent?.id || "pipeline_complete",
            payload: result,
            confidence: options.confidence || "medium",
            flags: options.flags || [],
            created_at: now,
            payload_hash: this.hashPayload(result),
        };

        // Set input envelope for next step
        if (nextAgent) {
            const nextStep = this.state.steps.find(s => s.agent_id === nextAgent.id);
            if (nextStep) {
                nextStep.input_envelope = step.output_envelope;
            }
        }

        // Update totals
        this.state.total_cost_usd += step.cost_usd;
        this.state.total_duration_ms += step.duration_ms;
        this.state.updated_at = now;

        // Mark as completed for idempotency
        this.completedIdempotencyKeys.add(step.idempotency_key);

        this.emitEvent("step.completed", stage, step.agent_id, {
            step_id: step.step_id,
            duration_ms: step.duration_ms,
            cost_usd: step.cost_usd,
            confidence: options.confidence,
        });

        return true;
    }

    /** Fail a step */
    failStep(stage: PipelineStage, error: string): boolean {
        const step = this.state.steps.find(s => s.stage === stage);
        if (!step) return false;

        const now = new Date().toISOString();

        // Check if we can retry
        if (step.attempt_number < step.max_attempts) {
            step.status = StepStatus.RETRYING;
            step.error = error;
            this.state.updated_at = now;

            this.emitEvent("step.retrying", stage, step.agent_id, {
                step_id: step.step_id,
                attempt: step.attempt_number,
                max_attempts: step.max_attempts,
                error,
            });

            return true;
        }

        // Max retries reached — fail the step
        step.status = StepStatus.FAILED;
        step.completed_at = now;
        step.error = error;

        if (step.started_at) {
            step.duration_ms = new Date(now).getTime() - new Date(step.started_at).getTime();
        }

        this.state.updated_at = now;

        this.emitEvent("step.failed", stage, step.agent_id, {
            step_id: step.step_id,
            error,
            attempts: step.attempt_number,
        });

        return true;
    }

    /** Cancel the pipeline */
    cancel(): void {
        this.state.stage = PipelineStage.CANCELLED;
        this.state.updated_at = new Date().toISOString();

        // Mark any running steps as failed
        for (const step of this.state.steps) {
            if (step.status === StepStatus.RUNNING || step.status === StepStatus.RETRYING) {
                step.status = StepStatus.FAILED;
                step.error = "Pipeline cancelled";
                step.completed_at = new Date().toISOString();
            }
            if (step.status === StepStatus.PENDING) {
                step.status = StepStatus.SKIPPED;
            }
        }

        this.emitEvent("pipeline.cancelled", PipelineStage.CANCELLED, null, {});
    }

    /** Mark the entire pipeline as complete */
    complete(): void {
        this.state.stage = PipelineStage.COMPLETE;
        this.state.updated_at = new Date().toISOString();

        this.emitEvent("pipeline.completed", PipelineStage.COMPLETE, null, {
            total_cost_usd: this.state.total_cost_usd,
            total_duration_ms: this.state.total_duration_ms,
            steps_completed: this.state.steps.filter(s => s.status === StepStatus.COMPLETED).length,
        });
    }

    /** Fail the entire pipeline */
    fail(error: string): void {
        this.state.stage = PipelineStage.FAILED;
        this.state.error = error;
        this.state.updated_at = new Date().toISOString();

        this.emitEvent("pipeline.failed", PipelineStage.FAILED, null, { error });
    }

    /** Export state for persistence */
    serialize(): string {
        return JSON.stringify({
            state: this.state,
            events: this.events,
            completedKeys: Array.from(this.completedIdempotencyKeys),
        });
    }

    /** Restore state from persistence (for replay) */
    static deserialize(json: string): PipelineStateMachine {
        const { state, events, completedKeys } = JSON.parse(json);
        const machine = Object.create(PipelineStateMachine.prototype);
        machine.state = state;
        machine.events = events;
        machine.completedIdempotencyKeys = new Set(completedKeys);
        return machine;
    }

    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================

    /** Initialize all five pipeline steps */
    private initializeSteps(): void {
        const stages = [
            PipelineStage.INTEL,
            PipelineStage.DISCOVERY,
            PipelineStage.ENGINEERING,
            PipelineStage.DELIVERY,
            PipelineStage.SUCCESS,
        ];

        for (const stage of stages) {
            const agent = STAGE_TO_AGENT[stage];
            const step: PipelineStep = {
                step_id: `step_${this.state.run_id}_${stage.toLowerCase()}`,
                run_id: this.state.run_id,
                agent_id: agent.id,
                agent_name: agent.name,
                stage,
                status: StepStatus.PENDING,
                input_envelope: null,
                output_envelope: null,
                result: null,
                error: null,
                started_at: null,
                completed_at: null,
                duration_ms: 0,
                cost_usd: 0,
                provider: null,
                model: null,
                attempt_number: 0,
                max_attempts: 3,
                idempotency_key: `${this.state.run_id}_${stage}_v1`,
            };

            this.state.steps.push(step);
        }
    }

    /** Get the next agent after a given stage */
    private getNextAgent(stage: PipelineStage): { id: string; name: string } | null {
        const stageOrder = [
            PipelineStage.INTEL,
            PipelineStage.DISCOVERY,
            PipelineStage.ENGINEERING,
            PipelineStage.DELIVERY,
            PipelineStage.SUCCESS,
        ];
        const idx = stageOrder.indexOf(stage);
        if (idx < 0 || idx >= stageOrder.length - 1) return null;
        return STAGE_TO_AGENT[stageOrder[idx + 1]];
    }

    /** Emit a pipeline event */
    private emitEvent(
        type: PipelineEventType,
        stage: PipelineStage,
        agentId: string | null,
        data: Record<string, unknown>
    ): void {
        this.events.push({
            event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            run_id: this.state.run_id,
            event_type: type,
            stage,
            agent_id: agentId,
            timestamp: new Date().toISOString(),
            data,
        });
    }

    /** Simple hash for payload deduplication */
    private hashPayload(payload: Record<string, unknown>): string {
        const str = JSON.stringify(payload);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `ph_${Math.abs(hash).toString(36)}`;
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new pipeline run
 */
export function createPipelineRun(
    leadsInput: string,
    workspaceId: string = "default"
): PipelineStateMachine {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return new PipelineStateMachine(runId, leadsInput, workspaceId);
}
