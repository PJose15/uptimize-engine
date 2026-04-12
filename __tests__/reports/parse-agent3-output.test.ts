import { describe, it, expect } from 'vitest';
import {
  parseAgent3Output,
  derivePillarCards,
  deriveRiskLevel,
  type PillarCard,
} from '@/lib/parse-agent3-output';
import type { Agent3Output } from '@/app/api/agents/run/uptimize/agent-3-sales-engineer/types';

// ---------------------------------------------------------------------------
// Fixture: full valid Agent 3 output
// ---------------------------------------------------------------------------

const FULL_OUTPUT: Agent3Output = {
  pre_call_brief: {
    lead_id: 'lead-001',
    hypotheses: ['Ops bottleneck in fulfillment'],
    must_answer_questions: ['What CRM?'],
    meeting_goal: 'Qualify and discover leaks',
  },
  discovery_notes_structured: {
    current_process_map: ['Step 1', 'Step 2'],
    leaks: [
      {
        leak_name: 'Manual invoicing',
        where_it_happens: 'Finance dept',
        symptoms: 'Late payments',
        root_cause_guess: 'No automation',
      },
      {
        leak_name: 'Duplicate data entry',
        where_it_happens: 'Ops team',
        symptoms: 'Errors in orders',
        root_cause_guess: 'No system integration',
      },
    ],
    impact: { time_cost: '20h/week', revenue_cost: '$5k/mo', quality_cost: 'High error rate' },
    success_criteria: ['Reduce manual work by 50%'],
    constraints: ['Must use Salesforce'],
    decision_process: {
      decision_maker: 'VP Ops',
      stakeholders: ['CTO', 'CFO'],
      budget_range_known: true,
      timeline: 'Q2 2026',
      procurement_notes: 'Standard PO process',
    },
  },
  shadow_ops_map: {
    top_invisible_tasks_ranked: [
      { task: 'Manual Slack triage', estimated_weekly_hours: 5, frequency: 'daily', impact: 'high', why_it_exists: 'No ticketing system' },
      { task: 'Spreadsheet reconciliation', estimated_weekly_hours: 3, frequency: 'weekly', impact: 'medium', why_it_exists: 'Disconnected tools' },
    ],
    off_system_channels: ['WhatsApp group', 'Personal email'],
    context_loss_points: ['Shift handover', 'Client escalation notes'],
    audit_gaps: ['No approval trail for refunds'],
  },
  exception_library: {
    top_exceptions_ranked: [
      {
        exception_name: 'Rush order override',
        frequency: 'weekly',
        impact: 'high',
        current_handling: 'Manual Slack ping to manager',
        desired_handling: 'Automated approval workflow',
      },
      {
        exception_name: 'Price mismatch',
        frequency: 'daily',
        impact: 'medium',
        current_handling: 'Email chain',
        desired_handling: 'Auto-sync pricing engine',
      },
    ],
    exception_metrics_assumptions: ['Based on 3-month sample'],
    exceptions_to_productize: ['Rush order override'],
  },
  value_calc: {
    dollar_value_summary: '$6,000/month leaking from manual invoicing and reconciliation',
    assumptions: ['40h work week', '$75/hr blended rate'],
    time_saved_per_week_hours: 20,
    cost_per_hour_assumption: 75,
    monthly_value_estimate: 6000,
    notes: 'Conservative estimate',
  },
  solution_blueprint: {
    phase_1: {
      goal: 'Automate invoicing',
      deliverables: ['Invoice bot', 'Payment tracker'],
      leaks_addressed: ['Manual invoicing', 'Payment tracking gaps'],
      time_to_value: '4 weeks',
      dependencies: ['API access'],
    },
    phase_2: {
      goal: 'Integrate CRM',
      deliverables: ['Salesforce connector', 'Data sync'],
      leaks_addressed: ['CRM data inconsistency'],
      time_to_value: '6 weeks',
      dependencies: ['Phase 1'],
    },
    phase_3_optional: {
      goal: 'AI assistant',
      deliverables: ['Triage bot'],
      leaks_addressed: ['Manual triage overhead'],
      time_to_value: '8 weeks',
      dependencies: ['Phase 2'],
    },
    kpis_to_track: ['Time saved/week', 'Error rate', 'Invoice cycle time'],
  },
  proposal_sow: {
    summary: 'End-to-end ops automation',
    deliverables: ['Invoice bot', 'CRM integration'],
    timeline: '18 weeks',
    pricing_options: [
      { option_name: 'Starter', price: '$15,000', what_included: ['Phase 1 only'], best_for: 'Quick wins' },
      { option_name: 'Growth', price: '$30,000', what_included: ['Phase 1+2'], best_for: 'Full integration' },
    ],
    client_responsibilities: ['API credentials', 'Stakeholder access'],
    assumptions_exclusions: ['Excludes data migration'],
    change_request_process: 'Written CR with 48h review',
    acceptance_criteria: ['All KPIs met for 2 consecutive weeks'],
    exception_paths_committed: ['Rush order workflow'],
    audit_trail_commitment: ['All approvals logged'],
  },
  close_plan: {
    primary_objections_expected: ['Budget concerns'],
    responses: ['ROI within 3 months'],
    next_steps: ['Sign SOW', 'Kick-off call', 'Phase 1 sprint planning'],
    follow_up_schedule: [
      { day_offset: 1, message: 'Send SOW' },
      { day_offset: 3, message: 'Check-in call' },
      { day_offset: 7, message: 'Follow up on signatures' },
    ],
  },
  handoff_to_agent4_spec: {
    build_modules: ['Invoice Bot', 'CRM Connector'],
    integrations: ['Salesforce', 'Stripe'],
    agent_specs_needed: ['Triage Agent'],
    risks: ['API rate limits'],
    definition_of_done: ['All tests pass', 'KPIs trackable'],
    top_exceptions_to_handle: ['Rush order override'],
    audit_trail_fields_required: ['approval_timestamp', 'approver_id'],
  },
};

// ---------------------------------------------------------------------------
// parseAgent3Output
// ---------------------------------------------------------------------------

describe('parseAgent3Output', () => {
  it('parses a valid full output object', () => {
    const result = parseAgent3Output(FULL_OUTPUT);
    expect(result).not.toBeNull();
    expect(result!.pre_call_brief.lead_id).toBe('lead-001');
    expect(result!.shadow_ops_map.top_invisible_tasks_ranked).toHaveLength(2);
    expect(result!.value_calc.monthly_value_estimate).toBe(6000);
  });

  it('parses a JSON string', () => {
    const result = parseAgent3Output(JSON.stringify(FULL_OUTPUT));
    expect(result).not.toBeNull();
    expect(result!.value_calc.monthly_value_estimate).toBe(6000);
  });

  it('returns null for null input', () => {
    expect(parseAgent3Output(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseAgent3Output(undefined)).toBeNull();
  });

  it('returns null for invalid JSON string', () => {
    expect(parseAgent3Output('not json')).toBeNull();
  });

  it('returns null for an array', () => {
    expect(parseAgent3Output([1, 2, 3])).toBeNull();
  });

  it('returns null for an object with no known keys', () => {
    expect(parseAgent3Output({ foo: 'bar' })).toBeNull();
  });

  it('fills defaults for partial output', () => {
    const partial = {
      value_calc: { monthly_value_estimate: 3000 },
    };
    const result = parseAgent3Output(partial);
    expect(result).not.toBeNull();
    // value_calc merged with defaults
    expect(result!.value_calc.monthly_value_estimate).toBe(3000);
    expect(result!.value_calc.assumptions).toEqual([]);
    // other sections get defaults
    expect(result!.shadow_ops_map.top_invisible_tasks_ranked).toEqual([]);
    expect(result!.exception_library.top_exceptions_ranked).toEqual([]);
    expect(result!.discovery_notes_structured.leaks).toEqual([]);
    expect(result!.close_plan.next_steps).toEqual([]);
  });

  it('handles empty shadow_ops_map gracefully', () => {
    const data = { ...FULL_OUTPUT, shadow_ops_map: {} };
    const result = parseAgent3Output(data);
    expect(result).not.toBeNull();
    expect(result!.shadow_ops_map.top_invisible_tasks_ranked).toEqual([]);
    expect(result!.shadow_ops_map.off_system_channels).toEqual([]);
  });

  it('unwraps Agent3Result wrapper (success + data)', () => {
    const wrapped = {
      success: true,
      message: 'Agent 3 completed',
      data: FULL_OUTPUT,
      metadata: { provider: 'anthropic', model: 'claude', timestamp: '2026-01-01', latencyMs: 500 },
    };
    const result = parseAgent3Output(wrapped);
    expect(result).not.toBeNull();
    expect(result!.value_calc.monthly_value_estimate).toBe(6000);
    expect(result!.shadow_ops_map.top_invisible_tasks_ranked).toHaveLength(2);
  });

  it('unwraps Agent3Result from JSON string', () => {
    const wrapped = {
      success: true,
      message: 'done',
      data: FULL_OUTPUT,
    };
    const result = parseAgent3Output(JSON.stringify(wrapped));
    expect(result).not.toBeNull();
    expect(result!.pre_call_brief.lead_id).toBe('lead-001');
  });

  it('returns null for Agent3Result with no data (failed run)', () => {
    const failed = {
      success: false,
      message: 'Agent 3 failed',
      error: { type: 'timeout', details: 'Timed out', timestamp: '2026-01-01' },
    };
    const result = parseAgent3Output(failed);
    expect(result).toBeNull();
  });

  it('coerces null array fields to empty arrays', () => {
    const data = {
      value_calc: {
        assumptions: null,
        monthly_value_estimate: 5000,
      },
      shadow_ops_map: {
        top_invisible_tasks_ranked: null,
        off_system_channels: null,
      },
      close_plan: {
        next_steps: null,
        follow_up_schedule: null,
      },
    };
    const result = parseAgent3Output(data);
    expect(result).not.toBeNull();
    expect(result!.value_calc.assumptions).toEqual([]);
    expect(result!.shadow_ops_map.top_invisible_tasks_ranked).toEqual([]);
    expect(result!.shadow_ops_map.off_system_channels).toEqual([]);
    expect(result!.close_plan.next_steps).toEqual([]);
    expect(result!.close_plan.follow_up_schedule).toEqual([]);
  });

  it('coerces string numbers to actual numbers', () => {
    const data = {
      value_calc: {
        monthly_value_estimate: '8000',
        time_saved_per_week_hours: '15',
        cost_per_hour_assumption: '100',
      },
    };
    const result = parseAgent3Output(data);
    expect(result).not.toBeNull();
    expect(result!.value_calc.monthly_value_estimate).toBe(8000);
    expect(typeof result!.value_calc.monthly_value_estimate).toBe('number');
    expect(result!.value_calc.time_saved_per_week_hours).toBe(15);
    expect(result!.value_calc.cost_per_hour_assumption).toBe(100);
  });

  it('deep-merges partial phase blocks in solution_blueprint', () => {
    const data = {
      solution_blueprint: {
        phase_1: { goal: 'Automate invoicing' },
        // phase_2 missing entirely
        // phase_3_optional missing entirely
        // kpis_to_track missing
      },
    };
    const result = parseAgent3Output(data);
    expect(result).not.toBeNull();
    // phase_1 should have goal but default arrays
    expect(result!.solution_blueprint.phase_1.goal).toBe('Automate invoicing');
    expect(result!.solution_blueprint.phase_1.deliverables).toEqual([]);
    expect(result!.solution_blueprint.phase_1.time_to_value).toBe('');
    // phase_2 and phase_3 should get full defaults
    expect(result!.solution_blueprint.phase_2.goal).toBe('');
    expect(result!.solution_blueprint.phase_2.deliverables).toEqual([]);
    expect(result!.solution_blueprint.phase_3_optional.deliverables).toEqual([]);
    // kpis_to_track should default to []
    expect(result!.solution_blueprint.kpis_to_track).toEqual([]);
  });

  it('deep-merges partial impact and decision_process in discovery_notes', () => {
    const data = {
      discovery_notes_structured: {
        impact: { time_cost: '10h/week' },
        decision_process: { decision_maker: 'CEO' },
      },
    };
    const result = parseAgent3Output(data);
    expect(result).not.toBeNull();
    expect(result!.discovery_notes_structured.impact.time_cost).toBe('10h/week');
    expect(result!.discovery_notes_structured.impact.revenue_cost).toBe('');
    expect(result!.discovery_notes_structured.impact.quality_cost).toBe('');
    expect(result!.discovery_notes_structured.decision_process.decision_maker).toBe('CEO');
    expect(result!.discovery_notes_structured.decision_process.stakeholders).toEqual([]);
    expect(result!.discovery_notes_structured.decision_process.budget_range_known).toBe(false);
  });

  it('unwraps Agent3Result wrapper with partial Agent3Output inside', () => {
    const wrapped = {
      success: true,
      message: 'done',
      data: {
        value_calc: { monthly_value_estimate: 1500 },
        shadow_ops_map: {
          top_invisible_tasks_ranked: [
            { task: 'Manual triage', frequency: 'daily', impact: 'high', why_it_exists: 'No system' },
          ],
        },
      },
    };
    const result = parseAgent3Output(wrapped);
    expect(result).not.toBeNull();
    expect(result!.value_calc.monthly_value_estimate).toBe(1500);
    expect(result!.shadow_ops_map.top_invisible_tasks_ranked).toHaveLength(1);
    // Defaults filled for missing sections
    expect(result!.close_plan.next_steps).toEqual([]);
    expect(result!.solution_blueprint.phase_1.deliverables).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// derivePillarCards
// ---------------------------------------------------------------------------

describe('derivePillarCards', () => {
  it('produces correct number of pillars from full output', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    // Full output has data in all 6 categories
    expect(pillars).toHaveLength(6);
  });

  it('names pillars correctly', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    const names = pillars.map(p => p.name);
    expect(names).toContain('Shadow Ops');
    expect(names).toContain('Off-System Channels');
    expect(names).toContain('Context & Knowledge Loss');
    expect(names).toContain('Audit Gaps');
    expect(names).toContain('Exception Handling');
    expect(names).toContain('Process Leaks');
  });

  it('assigns proportional cost to each pillar', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    // 6000 / 6 = 1000 per pillar
    for (const p of pillars) {
      expect(p.estimatedCost).toBe(1000);
    }
  });

  it('omits empty pillars', () => {
    const emptyData = parseAgent3Output({ value_calc: { monthly_value_estimate: 1000 } })!;
    const pillars = derivePillarCards(emptyData);
    expect(pillars).toHaveLength(0);
  });

  it('derives correct severity from shadow ops', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    const shadowOps = pillars.find(p => p.name === 'Shadow Ops')!;
    // One high + one medium → highest is high
    expect(shadowOps.severity).toBe('high');
  });

  it('derives correct severity from exception handling', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    const exceptions = pillars.find(p => p.name === 'Exception Handling')!;
    // One high + one medium → highest is high
    expect(exceptions.severity).toBe('high');
  });

  it('maps findings correctly for shadow ops', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    const shadowOps = pillars.find(p => p.name === 'Shadow Ops')!;
    expect(shadowOps.findings).toHaveLength(2);
    expect(shadowOps.findings[0].name).toBe('Manual Slack triage');
  });

  it('maps findings correctly for process leaks', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    const leaks = pillars.find(p => p.name === 'Process Leaks')!;
    expect(leaks.findings).toHaveLength(2);
    expect(leaks.findings[0].name).toBe('Manual invoicing');
  });
});

// ---------------------------------------------------------------------------
// deriveRiskLevel
// ---------------------------------------------------------------------------

describe('deriveRiskLevel', () => {
  it('returns Critical when 3+ high-severity pillars', () => {
    const pillars: PillarCard[] = [
      { name: 'A', severity: 'high', findings: [], estimatedCost: 0 },
      { name: 'B', severity: 'high', findings: [], estimatedCost: 0 },
      { name: 'C', severity: 'high', findings: [], estimatedCost: 0 },
    ];
    expect(deriveRiskLevel(pillars)).toBe('Critical');
  });

  it('returns High when 1-2 high-severity pillars', () => {
    const pillars: PillarCard[] = [
      { name: 'A', severity: 'high', findings: [], estimatedCost: 0 },
      { name: 'B', severity: 'medium', findings: [], estimatedCost: 0 },
    ];
    expect(deriveRiskLevel(pillars)).toBe('High');
  });

  it('returns Medium when 2+ medium-severity pillars and no high', () => {
    const pillars: PillarCard[] = [
      { name: 'A', severity: 'medium', findings: [], estimatedCost: 0 },
      { name: 'B', severity: 'medium', findings: [], estimatedCost: 0 },
    ];
    expect(deriveRiskLevel(pillars)).toBe('Medium');
  });

  it('returns Low when all pillars are low severity', () => {
    const pillars: PillarCard[] = [
      { name: 'A', severity: 'low', findings: [], estimatedCost: 0 },
    ];
    expect(deriveRiskLevel(pillars)).toBe('Low');
  });

  it('returns Low for empty pillars', () => {
    expect(deriveRiskLevel([])).toBe('Low');
  });

  it('returns Critical for full output data', () => {
    const pillars = derivePillarCards(FULL_OUTPUT);
    // Full output: Shadow Ops=high, Off-System=medium, Context Loss=high, Audit Gaps=high, Exceptions=high, Leaks=high
    // 5 high → Critical
    expect(deriveRiskLevel(pillars)).toBe('Critical');
  });
});
