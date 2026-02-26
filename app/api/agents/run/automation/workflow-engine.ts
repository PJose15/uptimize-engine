/**
 * UptimizeAI Built-in Automation Workflow Engine
 *
 * V3 Addition: Allows agents to execute automations directly without requiring
 * external tools like Make/Zapier/Airtable. The automation logic lives IN the agent.
 *
 * If the client HAS external tools, we can integrate with them via MCP.
 * If they DON'T, we execute workflows natively here.
 */

import { logger } from "../logger";

// ============================================================================
// TYPES
// ============================================================================

export type WorkflowStepType =
  | "trigger"
  | "condition"
  | "action"
  | "transform"
  | "delay"
  | "loop"
  | "parallel"
  | "exception_handler";

export type TriggerType =
  | "webhook"
  | "schedule"
  | "event"
  | "manual"
  | "mcp_event";

export type ActionType =
  | "send_email"
  | "send_sms"
  | "send_slack"
  | "send_webhook"
  | "update_record"
  | "create_record"
  | "delete_record"
  | "call_api"
  | "call_mcp_tool"
  | "run_sub_workflow"
  | "log_audit_event"
  | "notify_human"
  | "wait_for_approval";

export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  value?: unknown;
  source?: "input" | "previous_step" | "context" | "mcp";
}

export interface WorkflowCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "not_contains" | "exists" | "not_exists" | "regex";
  value: unknown;
  and?: WorkflowCondition[];
  or?: WorkflowCondition[];
}

export interface ExceptionPath {
  exception_name: string;
  trigger_condition: WorkflowCondition;
  behavior: "retry" | "fallback" | "escalate" | "skip" | "abort" | "custom";
  max_retries?: number;
  retry_delay_ms?: number;
  fallback_value?: unknown;
  escalation_channel?: string;
  custom_handler?: string;
  logging: {
    log_level: "info" | "warn" | "error";
    message_template: string;
    include_context: boolean;
  };
}

export interface WorkflowStep {
  step_id: string;
  step_name: string;
  step_type: WorkflowStepType;
  description?: string;

  // For triggers
  trigger_config?: {
    trigger_type: TriggerType;
    webhook_path?: string;
    schedule_cron?: string;
    event_name?: string;
    mcp_server?: string;
  };

  // For conditions
  condition?: WorkflowCondition;
  true_branch?: string;  // step_id to go to if true
  false_branch?: string; // step_id to go to if false

  // For actions
  action_config?: {
    action_type: ActionType;
    target?: string;
    payload?: Record<string, unknown>;
    mcp_tool_name?: string;
    mcp_server?: string;
    timeout_ms?: number;
    retry_config?: {
      max_retries: number;
      backoff_ms: number;
    };
  };

  // For transforms
  transform_config?: {
    input_mapping: Record<string, string>;
    output_mapping: Record<string, string>;
    transform_function?: string;
  };

  // For delays
  delay_ms?: number;

  // For loops
  loop_config?: {
    collection_source: string;
    item_variable: string;
    max_iterations?: number;
    parallel?: boolean;
  };

  // For parallel execution
  parallel_steps?: string[];

  // Exception handling
  exception_paths?: ExceptionPath[];

  // Audit trail
  audit_event?: {
    event_type: string;
    include_input: boolean;
    include_output: boolean;
  };

  // Next step (if not conditional)
  next_step?: string;
}

export interface WorkflowDefinition {
  workflow_id: string;
  workflow_name: string;
  version: string;
  description: string;

  // Categorization
  problem_solved: string;  // Maps to pain categories
  shadow_ops_eliminated: string[];  // What invisible work this removes

  // Input/Output
  input_schema: Record<string, WorkflowVariable>;
  output_schema: Record<string, WorkflowVariable>;

  // Steps
  steps: WorkflowStep[];
  entry_point: string;  // First step_id

  // Global exception handling
  global_exception_paths: ExceptionPath[];

  // Audit configuration
  audit_config: {
    log_all_steps: boolean;
    log_inputs: boolean;
    log_outputs: boolean;
    retention_days: number;
  };

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WorkflowExecutionContext {
  execution_id: string;
  workflow_id: string;
  started_at: string;
  variables: Record<string, unknown>;
  current_step: string;
  step_history: Array<{
    step_id: string;
    started_at: string;
    completed_at?: string;
    status: "running" | "completed" | "failed" | "skipped";
    input?: unknown;
    output?: unknown;
    error?: string;
  }>;
  audit_trail: AuditEvent[];
  status: "running" | "completed" | "failed" | "paused" | "waiting_approval";
}

export interface AuditEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  step_id?: string;
  actor: string;  // "system" | "user:{id}" | "agent:{id}"
  action: string;
  details: Record<string, unknown>;
  before_state?: unknown;
  after_state?: unknown;
}

export interface WorkflowExecutionResult {
  success: boolean;
  execution_id: string;
  workflow_id: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  output?: Record<string, unknown>;
  error?: {
    step_id: string;
    error_type: string;
    message: string;
    recoverable: boolean;
  };
  audit_trail: AuditEvent[];
  exceptions_handled: Array<{
    step_id: string;
    exception_name: string;
    handling_result: string;
  }>;
}

// ============================================================================
// WORKFLOW ENGINE
// ============================================================================

export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecutionContext> = new Map();
  private mcpClient?: MCPClientInterface;

  constructor(mcpClient?: MCPClientInterface) {
    this.mcpClient = mcpClient;
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.workflow_id, workflow);
    logger.info("Workflow registered", {}, {
      workflow_id: workflow.workflow_id,
      workflow_name: workflow.workflow_name
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    input: Record<string, unknown>,
    options?: {
      execution_id?: string;
      actor?: string;
      dry_run?: boolean;
    }
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const executionId = options?.execution_id || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        execution_id: executionId,
        workflow_id: workflowId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: 0,
        error: {
          step_id: "init",
          error_type: "WORKFLOW_NOT_FOUND",
          message: `Workflow ${workflowId} not found`,
          recoverable: false,
        },
        audit_trail: [],
        exceptions_handled: [],
      };
    }

    // Initialize execution context
    const context: WorkflowExecutionContext = {
      execution_id: executionId,
      workflow_id: workflowId,
      started_at: new Date().toISOString(),
      variables: { ...input },
      current_step: workflow.entry_point,
      step_history: [],
      audit_trail: [],
      status: "running",
    };

    this.executions.set(executionId, context);

    // Log audit event for execution start
    this.logAuditEvent(context, {
      event_type: "workflow_started",
      actor: options?.actor || "system",
      action: "execute_workflow",
      details: { input, dry_run: options?.dry_run },
    });

    try {
      // Execute steps
      let currentStepId: string | undefined = workflow.entry_point;
      const exceptionsHandled: Array<{ step_id: string; exception_name: string; handling_result: string }> = [];

      while (currentStepId) {
        const step = workflow.steps.find(s => s.step_id === currentStepId);
        if (!step) {
          throw new Error(`Step ${currentStepId} not found in workflow`);
        }

        context.current_step = currentStepId;

        try {
          const stepResult = await this.executeStep(step, context, workflow, options?.dry_run);

          // Record step in history
          context.step_history.push({
            step_id: currentStepId,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: "completed",
            input: stepResult.input,
            output: stepResult.output,
          });

          // Update variables with output
          if (stepResult.output) {
            Object.assign(context.variables, stepResult.output);
          }

          // Determine next step
          currentStepId = stepResult.next_step;

        } catch (stepError) {
          // Try to handle exception
          const handled = await this.handleException(step, stepError, context, workflow);

          if (handled.recovered) {
            exceptionsHandled.push({
              step_id: currentStepId!,
              exception_name: handled.exception_name,
              handling_result: handled.handling_result,
            });
            currentStepId = handled.next_step;
          } else {
            // Unrecoverable error
            context.status = "failed";
            context.step_history.push({
              step_id: currentStepId!,
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              status: "failed",
              error: stepError instanceof Error ? stepError.message : String(stepError),
            });

            this.logAuditEvent(context, {
              event_type: "workflow_failed",
              actor: "system",
              action: "execution_error",
              details: { step_id: currentStepId!, error: stepError instanceof Error ? stepError.message : String(stepError) },
            });

            return {
              success: false,
              execution_id: executionId,
              workflow_id: workflowId,
              started_at: context.started_at,
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
              error: {
                step_id: currentStepId!,
                error_type: "STEP_EXECUTION_ERROR",
                message: stepError instanceof Error ? stepError.message : String(stepError),
                recoverable: false,
              },
              audit_trail: context.audit_trail,
              exceptions_handled: exceptionsHandled,
            };
          }
        }
      }

      // Workflow completed successfully
      context.status = "completed";

      this.logAuditEvent(context, {
        event_type: "workflow_completed",
        actor: "system",
        action: "execution_complete",
        details: { output: context.variables },
      });

      return {
        success: true,
        execution_id: executionId,
        workflow_id: workflowId,
        started_at: context.started_at,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        output: context.variables as Record<string, unknown>,
        audit_trail: context.audit_trail,
        exceptions_handled: exceptionsHandled,
      };

    } catch (error) {
      context.status = "failed";

      return {
        success: false,
        execution_id: executionId,
        workflow_id: workflowId,
        started_at: context.started_at,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error: {
          step_id: context.current_step,
          error_type: "EXECUTION_ERROR",
          message: error instanceof Error ? error.message : String(error),
          recoverable: false,
        },
        audit_trail: context.audit_trail,
        exceptions_handled: [],
      };
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition,
    dryRun?: boolean
  ): Promise<{ input?: unknown; output?: unknown; next_step?: string }> {

    // Log audit event if configured
    if (step.audit_event || workflow.audit_config.log_all_steps) {
      this.logAuditEvent(context, {
        event_type: step.audit_event?.event_type || "step_executed",
        actor: "system",
        action: step.step_name,
        details: { step_type: step.step_type },
      });
    }

    switch (step.step_type) {
      case "trigger":
        // Triggers are entry points, just pass through
        return { next_step: step.next_step };

      case "condition":
        const conditionMet = this.evaluateCondition(step.condition!, context.variables);
        return {
          next_step: conditionMet ? step.true_branch : step.false_branch,
        };

      case "action":
        if (dryRun) {
          logger.info("Dry run: would execute action", {}, {
            step_id: step.step_id,
            action_type: step.action_config?.action_type
          });
          return { next_step: step.next_step };
        }
        const actionOutput = await this.executeAction(step.action_config!, context);
        return { output: actionOutput, next_step: step.next_step };

      case "transform":
        const transformedData = this.executeTransform(step.transform_config!, context.variables);
        return { output: transformedData, next_step: step.next_step };

      case "delay":
        if (!dryRun && step.delay_ms) {
          await new Promise(resolve => setTimeout(resolve, step.delay_ms));
        }
        return { next_step: step.next_step };

      case "loop":
        // Execute loop iterations
        const loopOutput = await this.executeLoop(step, context, workflow, dryRun);
        return { output: loopOutput, next_step: step.next_step };

      case "parallel":
        // Execute parallel steps
        const parallelOutput = await this.executeParallel(step, context, workflow, dryRun);
        return { output: parallelOutput, next_step: step.next_step };

      default:
        return { next_step: step.next_step };
    }
  }

  /**
   * Evaluate a condition against variables
   */
  private evaluateCondition(condition: WorkflowCondition, variables: Record<string, unknown>): boolean {
    const fieldValue = this.getNestedValue(variables, condition.field);
    const targetValue = condition.value;

    let result = false;
    switch (condition.operator) {
      case "eq": result = fieldValue === targetValue; break;
      case "neq": result = fieldValue !== targetValue; break;
      case "gt": result = (fieldValue as number) > (targetValue as number); break;
      case "lt": result = (fieldValue as number) < (targetValue as number); break;
      case "gte": result = (fieldValue as number) >= (targetValue as number); break;
      case "lte": result = (fieldValue as number) <= (targetValue as number); break;
      case "contains": result = String(fieldValue).includes(String(targetValue)); break;
      case "not_contains": result = !String(fieldValue).includes(String(targetValue)); break;
      case "exists": result = fieldValue !== undefined && fieldValue !== null; break;
      case "not_exists": result = fieldValue === undefined || fieldValue === null; break;
      case "regex": result = new RegExp(String(targetValue)).test(String(fieldValue)); break;
    }

    // Handle AND conditions
    if (condition.and?.length) {
      result = result && condition.and.every(c => this.evaluateCondition(c, variables));
    }

    // Handle OR conditions
    if (condition.or?.length) {
      result = result || condition.or.some(c => this.evaluateCondition(c, variables));
    }

    return result;
  }

  /**
   * Execute an action step
   */
  private async executeAction(
    config: NonNullable<WorkflowStep["action_config"]>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, unknown>> {
    switch (config.action_type) {
      case "call_mcp_tool":
        if (!this.mcpClient) {
          throw new Error("MCP client not configured");
        }
        return await this.mcpClient.callTool(
          config.mcp_server!,
          config.mcp_tool_name!,
          config.payload || {}
        );

      case "send_webhook":
        const webhookResponse = await fetch(config.target!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.interpolatePayload(config.payload || {}, context.variables)),
        });
        return { status: webhookResponse.status, ok: webhookResponse.ok };

      case "log_audit_event":
        this.logAuditEvent(context, {
          event_type: "custom_audit",
          actor: "workflow",
          action: config.target || "log",
          details: config.payload || {},
        });
        return { logged: true };

      case "update_record":
      case "create_record":
      case "delete_record":
        // These would integrate with a data store or MCP
        logger.info("Record operation", {}, { action: config.action_type, target: config.target, payload: config.payload });
        return { success: true, action: config.action_type };

      case "notify_human":
        // Queue notification for human review
        logger.info("Human notification queued", {}, { target: config.target, payload: config.payload });
        return { queued: true, notification_type: config.target };

      case "wait_for_approval":
        // In a real implementation, this would pause and wait
        logger.info("Waiting for approval", {}, { target: config.target });
        return { approval_pending: true };

      default:
        logger.warn("Unknown action type", {}, { action_type: config.action_type });
        return {};
    }
  }

  /**
   * Execute transform step
   */
  private executeTransform(
    config: NonNullable<WorkflowStep["transform_config"]>,
    variables: Record<string, unknown>
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    for (const [outputKey, inputPath] of Object.entries(config.output_mapping)) {
      output[outputKey] = this.getNestedValue(variables, inputPath);
    }

    return output;
  }

  /**
   * Execute loop step
   */
  private async executeLoop(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition,
    dryRun?: boolean
  ): Promise<Record<string, unknown>> {
    const config = step.loop_config!;
    const collection = this.getNestedValue(context.variables, config.collection_source) as unknown[];

    if (!Array.isArray(collection)) {
      throw new Error(`Loop collection ${config.collection_source} is not an array`);
    }

    const results: unknown[] = [];
    const maxIterations = config.max_iterations || collection.length;

    for (let i = 0; i < Math.min(collection.length, maxIterations); i++) {
      context.variables[config.item_variable] = collection[i];
      context.variables[`${config.item_variable}_index`] = i;

      // Execute nested steps would go here
      results.push({ index: i, item: collection[i] });
    }

    return { loop_results: results, iterations: results.length };
  }

  /**
   * Execute parallel steps
   */
  private async executeParallel(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition,
    dryRun?: boolean
  ): Promise<Record<string, unknown>> {
    const parallelStepIds = step.parallel_steps || [];
    const parallelSteps = parallelStepIds.map(id => workflow.steps.find(s => s.step_id === id)).filter(Boolean);

    const results = await Promise.all(
      parallelSteps.map(async (s) => {
        if (!s) return { step_id: "unknown", result: null };
        try {
          const result = await this.executeStep(s, context, workflow, dryRun);
          return { step_id: s.step_id, result };
        } catch (error) {
          return { step_id: s.step_id, error: error instanceof Error ? error.message : String(error) };
        }
      })
    );

    return { parallel_results: results };
  }

  /**
   * Handle an exception
   */
  private async handleException(
    step: WorkflowStep,
    error: unknown,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition
  ): Promise<{ recovered: boolean; exception_name: string; handling_result: string; next_step?: string }> {
    // Check step-level exception paths first
    const allPaths = [...(step.exception_paths || []), ...workflow.global_exception_paths];

    for (const path of allPaths) {
      // In a real implementation, we'd evaluate the trigger condition
      // For now, we'll match based on error message patterns
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logAuditEvent(context, {
        event_type: "exception_handled",
        actor: "system",
        action: path.behavior,
        details: {
          exception_name: path.exception_name,
          error_message: errorMessage,
          step_id: step.step_id,
        },
      });

      switch (path.behavior) {
        case "retry":
          // Retry logic would go here
          return {
            recovered: false,
            exception_name: path.exception_name,
            handling_result: "retry_exhausted"
          };

        case "fallback":
          return {
            recovered: true,
            exception_name: path.exception_name,
            handling_result: "fallback_used",
            next_step: step.next_step,
          };

        case "skip":
          return {
            recovered: true,
            exception_name: path.exception_name,
            handling_result: "step_skipped",
            next_step: step.next_step,
          };

        case "escalate":
          logger.warn("Escalating exception", {}, {
            exception: path.exception_name,
            channel: path.escalation_channel
          });
          return {
            recovered: false,
            exception_name: path.exception_name,
            handling_result: "escalated"
          };

        default:
          break;
      }
    }

    return {
      recovered: false,
      exception_name: "unhandled",
      handling_result: "no_handler_found"
    };
  }

  /**
   * Log an audit event
   */
  private logAuditEvent(context: WorkflowExecutionContext, event: Omit<AuditEvent, "event_id" | "timestamp">): void {
    const auditEvent: AuditEvent = {
      event_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      step_id: context.current_step,
      ...event,
    };
    context.audit_trail.push(auditEvent);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
    }, obj as unknown);
  }

  /**
   * Interpolate variables in payload
   */
  private interpolatePayload(payload: Record<string, unknown>, variables: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
        const varPath = value.slice(2, -2).trim();
        result[key] = this.getNestedValue(variables, varPath);
      } else if (typeof value === "object" && value !== null) {
        result[key] = this.interpolatePayload(value as Record<string, unknown>, variables);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all registered workflows
   */
  getRegisteredWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }
}

// ============================================================================
// MCP CLIENT INTERFACE
// ============================================================================

export interface MCPClientInterface {
  callTool(server: string, toolName: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
  listTools(server: string): Promise<Array<{ name: string; description: string; inputSchema: unknown }>>;
  getResource(server: string, uri: string): Promise<unknown>;
}

// ============================================================================
// WORKFLOW TEMPLATES FOR COMMON PROBLEMS
// ============================================================================

export const WORKFLOW_TEMPLATES: Record<string, Partial<WorkflowDefinition>> = {
  lead_follow_up: {
    workflow_name: "Lead Follow-up Sequence",
    description: "Automated multi-touch follow-up for new leads",
    problem_solved: "Lead Handling Chaos",
    shadow_ops_eliminated: [
      "Manual reminder setting",
      "Spreadsheet tracking",
      "Memory-based follow-up timing",
    ],
  },

  appointment_confirmation: {
    workflow_name: "Appointment Confirmation & No-show Prevention",
    description: "Automated confirmations and reschedule handling",
    problem_solved: "Scheduling + No-Show Leakage",
    shadow_ops_eliminated: [
      "Manual confirmation calls",
      "Text message reminders from personal phone",
      "Calendar checking",
    ],
  },

  exception_triage: {
    workflow_name: "Exception Triage & Escalation",
    description: "Route exceptions to appropriate handlers with audit trail",
    problem_solved: "Exception Overload",
    shadow_ops_eliminated: [
      "Slack/DM escalation threads",
      "Who handles what confusion",
      "Lost context in handoffs",
    ],
  },

  data_reconciliation: {
    workflow_name: "Data Reconciliation & Audit",
    description: "Cross-check data sources and flag discrepancies",
    problem_solved: "Reconciliation/Audit Gap",
    shadow_ops_eliminated: [
      "Manual spreadsheet comparison",
      "End-of-month scramble",
      "No audit trail of changes",
    ],
  },
};

// Export singleton instance
export const workflowEngine = new WorkflowEngine();
