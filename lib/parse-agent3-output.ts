import type {
  Agent3Output,
  ShadowOpsMap,
  ExceptionLibrary,
  DiscoveryNotesStructured,
  ValueCalc,
  SolutionBlueprint,
  PhaseBlock,
  ProposalSOW,
  ClosePlan,
} from '@/app/api/agents/run/uptimize/agent-3-sales-engineer/types';

// ---------------------------------------------------------------------------
// PillarCard — one "money leak" grouping shown in the report
// ---------------------------------------------------------------------------

export interface PillarFinding {
  name: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PillarCard {
  name: string;
  severity: 'high' | 'medium' | 'low';
  findings: PillarFinding[];
  estimatedCost: number; // proportional share of monthly_value_estimate
}

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

// ---------------------------------------------------------------------------
// Defaults — every nested field gets a safe fallback
// ---------------------------------------------------------------------------

const EMPTY_PHASE: PhaseBlock = {
  goal: '',
  deliverables: [],
  leaks_addressed: [],
  time_to_value: '',
  dependencies: [],
};

const EMPTY_SHADOW_OPS: ShadowOpsMap = {
  top_invisible_tasks_ranked: [],
  off_system_channels: [],
  context_loss_points: [],
  audit_gaps: [],
};

const EMPTY_EXCEPTION_LIBRARY: ExceptionLibrary = {
  top_exceptions_ranked: [],
  exception_metrics_assumptions: [],
  exceptions_to_productize: [],
};

const EMPTY_DISCOVERY: DiscoveryNotesStructured = {
  current_process_map: [],
  leaks: [],
  impact: { time_cost: '', revenue_cost: '', quality_cost: '' },
  success_criteria: [],
  constraints: [],
  decision_process: {
    decision_maker: '',
    stakeholders: [],
    budget_range_known: false,
    timeline: '',
    procurement_notes: '',
  },
};

const EMPTY_VALUE_CALC: ValueCalc = {
  dollar_value_summary: '',
  assumptions: [],
  time_saved_per_week_hours: 0,
  cost_per_hour_assumption: 0,
  monthly_value_estimate: 0,
  notes: '',
};

const EMPTY_BLUEPRINT: SolutionBlueprint = {
  phase_1: { ...EMPTY_PHASE },
  phase_2: { ...EMPTY_PHASE },
  phase_3_optional: { ...EMPTY_PHASE },
  kpis_to_track: [],
};

const EMPTY_PROPOSAL: ProposalSOW = {
  summary: '',
  deliverables: [],
  timeline: '',
  pricing_options: [],
  client_responsibilities: [],
  assumptions_exclusions: [],
  change_request_process: '',
  acceptance_criteria: [],
  exception_paths_committed: [],
  audit_trail_commitment: [],
};

const EMPTY_CLOSE_PLAN: ClosePlan = {
  primary_objections_expected: [],
  responses: [],
  next_steps: [],
  follow_up_schedule: [],
};

// ---------------------------------------------------------------------------
// Helpers for safe merging
// ---------------------------------------------------------------------------

/** Return value if it's a non-null object, otherwise empty object. */
function objOrEmpty(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** Coerce to array — returns [] for null, undefined, or non-arrays. */
function arrOrEmpty<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Coerce to number — handles string numbers from LLM. */
function numOrDefault(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!isNaN(n)) return n;
  }
  return fallback;
}

/** Coerce to string — handles missing/null values. */
function strOrDefault(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

/** Deep-merge a PhaseBlock with safe defaults. */
function mergePhase(raw: unknown): PhaseBlock {
  const o = objOrEmpty(raw);
  return {
    goal: strOrDefault(o.goal, ''),
    deliverables: arrOrEmpty(o.deliverables),
    leaks_addressed: arrOrEmpty(o.leaks_addressed),
    time_to_value: strOrDefault(o.time_to_value, ''),
    dependencies: arrOrEmpty(o.dependencies),
  };
}

// ---------------------------------------------------------------------------
// parseAgent3Output — safely parse raw unknown into Agent3Output
// ---------------------------------------------------------------------------

export function parseAgent3Output(raw: unknown): Agent3Output | null {
  if (raw == null) return null;

  let obj: Record<string, unknown>;

  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  } else if (typeof raw === 'object' && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else {
    return null;
  }

  // Unwrap Agent3Result wrapper: { success, message, data: Agent3Output }
  if ('data' in obj && typeof obj.data === 'object' && obj.data !== null && 'success' in obj) {
    obj = obj.data as Record<string, unknown>;
  }

  // Must have at least one recognisable top-level key
  const knownKeys = [
    'pre_call_brief', 'discovery_notes_structured', 'shadow_ops_map',
    'exception_library', 'value_calc', 'solution_blueprint',
    'proposal_sow', 'close_plan', 'handoff_to_agent4_spec',
  ];
  const hasAny = knownKeys.some(k => k in obj);
  if (!hasAny) return null;

  // Deep-merge each section with safe defaults
  const pcb = objOrEmpty(obj.pre_call_brief);
  const dns = objOrEmpty(obj.discovery_notes_structured);
  const som = objOrEmpty(obj.shadow_ops_map);
  const exl = objOrEmpty(obj.exception_library);
  const vc = objOrEmpty(obj.value_calc);
  const sb = objOrEmpty(obj.solution_blueprint);
  const ps = objOrEmpty(obj.proposal_sow);
  const cp = objOrEmpty(obj.close_plan);
  const h4 = objOrEmpty(obj.handoff_to_agent4_spec);
  const dnsImpact = objOrEmpty(dns.impact);
  const dnsDecision = objOrEmpty(dns.decision_process);

  return {
    pre_call_brief: {
      lead_id: strOrDefault(pcb.lead_id, ''),
      hypotheses: arrOrEmpty(pcb.hypotheses),
      must_answer_questions: arrOrEmpty(pcb.must_answer_questions),
      meeting_goal: strOrDefault(pcb.meeting_goal, ''),
    },
    discovery_notes_structured: {
      current_process_map: arrOrEmpty(dns.current_process_map),
      leaks: arrOrEmpty(dns.leaks),
      impact: {
        time_cost: strOrDefault(dnsImpact.time_cost, ''),
        revenue_cost: strOrDefault(dnsImpact.revenue_cost, ''),
        quality_cost: strOrDefault(dnsImpact.quality_cost, ''),
      },
      success_criteria: arrOrEmpty(dns.success_criteria),
      constraints: arrOrEmpty(dns.constraints),
      decision_process: {
        decision_maker: strOrDefault(dnsDecision.decision_maker, ''),
        stakeholders: arrOrEmpty(dnsDecision.stakeholders),
        budget_range_known: dnsDecision.budget_range_known === true,
        timeline: strOrDefault(dnsDecision.timeline, ''),
        procurement_notes: strOrDefault(dnsDecision.procurement_notes, ''),
      },
    },
    shadow_ops_map: {
      top_invisible_tasks_ranked: arrOrEmpty(som.top_invisible_tasks_ranked),
      off_system_channels: arrOrEmpty(som.off_system_channels),
      context_loss_points: arrOrEmpty(som.context_loss_points),
      audit_gaps: arrOrEmpty(som.audit_gaps),
    },
    exception_library: {
      top_exceptions_ranked: arrOrEmpty(exl.top_exceptions_ranked),
      exception_metrics_assumptions: arrOrEmpty(exl.exception_metrics_assumptions),
      exceptions_to_productize: arrOrEmpty(exl.exceptions_to_productize),
    },
    value_calc: {
      dollar_value_summary: strOrDefault(vc.dollar_value_summary, ''),
      assumptions: arrOrEmpty(vc.assumptions),
      time_saved_per_week_hours: numOrDefault(vc.time_saved_per_week_hours, 0),
      cost_per_hour_assumption: numOrDefault(vc.cost_per_hour_assumption, 0),
      monthly_value_estimate: numOrDefault(vc.monthly_value_estimate, 0),
      notes: strOrDefault(vc.notes, ''),
    },
    solution_blueprint: {
      phase_1: mergePhase(sb.phase_1),
      phase_2: mergePhase(sb.phase_2),
      phase_3_optional: mergePhase(sb.phase_3_optional),
      kpis_to_track: arrOrEmpty(sb.kpis_to_track),
    },
    proposal_sow: {
      summary: strOrDefault(ps.summary, ''),
      deliverables: arrOrEmpty(ps.deliverables),
      timeline: strOrDefault(ps.timeline, ''),
      pricing_options: arrOrEmpty(ps.pricing_options),
      client_responsibilities: arrOrEmpty(ps.client_responsibilities),
      assumptions_exclusions: arrOrEmpty(ps.assumptions_exclusions),
      change_request_process: strOrDefault(ps.change_request_process, ''),
      acceptance_criteria: arrOrEmpty(ps.acceptance_criteria),
      exception_paths_committed: arrOrEmpty(ps.exception_paths_committed),
      audit_trail_commitment: arrOrEmpty(ps.audit_trail_commitment),
    },
    close_plan: {
      primary_objections_expected: arrOrEmpty(cp.primary_objections_expected),
      responses: arrOrEmpty(cp.responses),
      next_steps: arrOrEmpty(cp.next_steps),
      follow_up_schedule: arrOrEmpty(cp.follow_up_schedule),
    },
    handoff_to_agent4_spec: {
      build_modules: arrOrEmpty(h4.build_modules),
      integrations: arrOrEmpty(h4.integrations),
      agent_specs_needed: arrOrEmpty(h4.agent_specs_needed),
      risks: arrOrEmpty(h4.risks),
      definition_of_done: arrOrEmpty(h4.definition_of_done),
      top_exceptions_to_handle: arrOrEmpty(h4.top_exceptions_to_handle),
      audit_trail_fields_required: arrOrEmpty(h4.audit_trail_fields_required),
    },
  };
}

// ---------------------------------------------------------------------------
// derivePillarCards — group findings into up to 6 named pillars
// ---------------------------------------------------------------------------

export function derivePillarCards(data: Agent3Output): PillarCard[] {
  const monthlyValue = numOrDefault(data.value_calc?.monthly_value_estimate, 0);
  const pillars: PillarCard[] = [];

  // 1. Shadow Ops
  const shadowTasks = data.shadow_ops_map?.top_invisible_tasks_ranked ?? [];
  if (shadowTasks.length > 0) {
    pillars.push({
      name: 'Shadow Ops',
      severity: highestImpact(shadowTasks.map(t => t.impact)),
      findings: shadowTasks.map(t => ({
        name: t.task,
        detail: t.why_it_exists,
        severity: t.impact,
      })),
      estimatedCost: 0,
    });
  }

  // 2. Off-System Channels
  const channels = data.shadow_ops_map?.off_system_channels ?? [];
  if (channels.length > 0) {
    pillars.push({
      name: 'Off-System Channels',
      severity: 'medium',
      findings: channels.map(ch => ({
        name: ch,
        detail: 'Communication happening outside tracked systems',
        severity: 'medium' as const,
      })),
      estimatedCost: 0,
    });
  }

  // 3. Context & Knowledge Loss
  const contextLoss = data.shadow_ops_map?.context_loss_points ?? [];
  if (contextLoss.length > 0) {
    pillars.push({
      name: 'Context & Knowledge Loss',
      severity: 'high',
      findings: contextLoss.map(c => ({
        name: c,
        detail: 'Critical context lost during handoffs',
        severity: 'high' as const,
      })),
      estimatedCost: 0,
    });
  }

  // 4. Audit Gaps
  const auditGaps = data.shadow_ops_map?.audit_gaps ?? [];
  if (auditGaps.length > 0) {
    pillars.push({
      name: 'Audit Gaps',
      severity: 'high',
      findings: auditGaps.map(g => ({
        name: g,
        detail: 'Missing audit trail or compliance gap',
        severity: 'high' as const,
      })),
      estimatedCost: 0,
    });
  }

  // 5. Exception Handling
  const exceptions = data.exception_library?.top_exceptions_ranked ?? [];
  if (exceptions.length > 0) {
    pillars.push({
      name: 'Exception Handling',
      severity: highestImpact(exceptions.map(e => e.impact)),
      findings: exceptions.map(e => ({
        name: e.exception_name,
        detail: `Current: ${e.current_handling} → Desired: ${e.desired_handling}`,
        severity: e.impact,
      })),
      estimatedCost: 0,
    });
  }

  // 6. Process Leaks
  const leaks = data.discovery_notes_structured?.leaks ?? [];
  if (leaks.length > 0) {
    pillars.push({
      name: 'Process Leaks',
      severity: 'high',
      findings: leaks.map(l => ({
        name: l.leak_name,
        detail: `${l.symptoms} — Root cause: ${l.root_cause_guess}`,
        severity: 'high' as const,
      })),
      estimatedCost: 0,
    });
  }

  // Distribute monthly value proportionally
  if (pillars.length > 0 && monthlyValue > 0) {
    const share = monthlyValue / pillars.length;
    for (const p of pillars) {
      p.estimatedCost = Math.round(share);
    }
  }

  return pillars;
}

// ---------------------------------------------------------------------------
// deriveRiskLevel — overall risk from severity counts
// ---------------------------------------------------------------------------

export function deriveRiskLevel(pillars: PillarCard[]): RiskLevel {
  let highCount = 0;
  let mediumCount = 0;

  for (const p of pillars) {
    if (p.severity === 'high') highCount++;
    else if (p.severity === 'medium') mediumCount++;
  }

  if (highCount >= 3) return 'Critical';
  if (highCount >= 1) return 'High';
  if (mediumCount >= 2) return 'Medium';
  return 'Low';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function highestImpact(impacts: Array<'high' | 'medium' | 'low'>): 'high' | 'medium' | 'low' {
  if (impacts.includes('high')) return 'high';
  if (impacts.includes('medium')) return 'medium';
  return 'low';
}
