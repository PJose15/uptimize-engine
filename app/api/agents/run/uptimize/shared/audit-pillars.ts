/**
 * UptimizeAI 6-Pillar Operational Audit Framework - V3
 *
 * Each pillar has TWO components:
 * 1. DISCOVERY (Agent 3) - Diagnose the problem, make you look smart in sales calls
 * 2. DELIVERY (Agent 4) - Implement the solution, close the deal
 *
 * The 6 Pillars:
 * 1. Shadow Ops - Off-system work
 * 2. Exception Library - Edge cases that break workflows
 * 3. Audit Trail - Provability / compliance
 * 4. Knowledge & Decisions - Tribal knowledge + decision authority
 * 5. Handoffs & SLAs - Context loss + time-based accountability
 * 6. Channels & Evidence - Scattered comms + proof requirements
 *
 * Mission: Diagnose the chaos (builds trust) AND prescribe the cure (closes the deal).
 */

// ============================================================================
// PILLAR 1: SHADOW OPS
// ============================================================================

/**
 * DISCOVERY: Where does work escape your systems?
 * DELIVERY: Native workflow automation that captures it
 */

export interface ShadowOpsTask {
  task: string;
  frequency: "daily" | "weekly" | "monthly" | "ad_hoc";
  impact: "high" | "medium" | "low";
  why_it_exists: string;
  current_tool_used: string;  // "WhatsApp", "spreadsheet", "memory", "text", etc.
  hours_per_week_estimate?: number;
}

export interface ShadowOpsDiscovery {
  top_invisible_tasks_ranked: ShadowOpsTask[];
  off_system_channels: string[];  // Where work lives outside official tools
  context_loss_points: string[];  // Where info gets lost
  audit_gaps: string[];  // What can't be proven
  density_score_0_10: number;
  density_rationale: string;
}

export interface ShadowOpsDelivery {
  workflows_to_build: Array<{
    workflow_name: string;
    shadow_ops_eliminated: string[];
    execution_mode: "native" | "mcp" | "hybrid";
    estimated_hours_saved_weekly: number;
  }>;
  channels_to_consolidate: string[];
  automation_priority_order: string[];
}

export const SHADOW_OPS_DISCOVERY_QUESTIONS = [
  // The "makes you look smart" questions
  "Walk me through a typical lead/request from the moment it comes in. Where does it actually live?",
  "What work happens outside your tools — WhatsApp, texts, DMs, spreadsheets, sticky notes?",
  "Where do you rely on memory or 'that one person who just knows'?",
  "If I asked you to show me the history of a specific customer interaction from 3 months ago, how many places would you have to check?",
  "Where do you chase customers for missing info? How does that conversation happen?",
  "What's the thing you do every day that you wish 'just happened automatically'?",
  "Where do approvals slow everything down because they happen over text/Slack/email?",
  "What would break if your phone died and you lost your text history?",
];

// ============================================================================
// PILLAR 2: EXCEPTION LIBRARY
// ============================================================================

/**
 * DISCOVERY: What edge cases break your processes?
 * DELIVERY: Exception routing + handling rules
 */

export interface Exception {
  exception_name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "ad_hoc";
  impact: "high" | "medium" | "low";
  current_handling: string;  // How it's handled today (usually manual)
  desired_handling: string;  // How it should be handled
  rework_time_minutes?: number;
  customer_impact?: string;
  who_handles_it?: string;
}

export interface ExceptionDiscovery {
  top_exceptions_ranked: Exception[];
  exception_count_weekly_estimate: number;
  most_disruptive_exception: string;
  most_frequent_exception: string;
  exception_handling_cost_estimate: string;
  patterns_observed: string[];  // Common themes
}

export interface ExceptionDelivery {
  exception_routing_rules: Array<{
    exception_type: string;
    trigger_condition: string;
    auto_handle_or_escalate: "auto" | "escalate" | "hybrid";
    handling_steps: string[];
    escalation_path: string;
    sla_minutes?: number;
  }>;
  exceptions_to_productize: string[];  // Turn into standard flows
  fallback_behaviors: Array<{
    failure_mode: string;
    fallback_action: string;
  }>;
}

export const EXCEPTION_DISCOVERY_QUESTIONS = [
  // The "makes you look smart" questions
  "What are the top 5 things that go wrong every week? Not the catastrophes — the annoying recurring stuff.",
  "When something breaks, what happens next? Walk me through the last time.",
  "Which exception creates the most rework or customer complaints?",
  "How much time per week do you spend handling exceptions vs. the happy path?",
  "Who's the person that gets pulled into every fire drill? What do they do?",
  "Which exception, if it disappeared tomorrow, would make the biggest difference?",
  "When an exception happens, how do you know about it? Proactively or when someone complains?",
  "What's the exception that costs you the most money but nobody tracks?",
];

// ============================================================================
// PILLAR 3: AUDIT TRAIL
// ============================================================================

/**
 * DISCOVERY: What can't you prove happened?
 * DELIVERY: Immutable event logging + compliance-ready records
 */

export interface AuditGap {
  process_area: string;
  what_cant_be_proven: string;
  risk_level: "high" | "medium" | "low";
  compliance_implication?: string;
  dispute_frequency?: string;
}

export interface AuditTrailDiscovery {
  completeness_score_0_100: number;
  gaps: AuditGap[];
  what_is_logged_today: string[];
  what_is_not_logged: string[];
  compliance_requirements?: string[];
  dispute_history: string[];  // Past disputes where you couldn't prove what happened
}

export interface AuditTrailDelivery {
  events_to_log: Array<{
    event_type: string;
    trigger: string;
    data_captured: string[];
    retention_days: number;
  }>;
  audit_fields_per_entity: Record<string, string[]>;
  compliance_reports_needed: string[];
  dispute_prevention_measures: string[];
}

export const AUDIT_TRAIL_DISCOVERY_QUESTIONS = [
  // The "makes you look smart" questions
  "If a customer disputes what was said or promised, can you prove it? Show me how.",
  "What decisions are made that aren't documented anywhere?",
  "Have you ever lost a dispute because you couldn't prove what happened?",
  "Do you have any compliance requirements for record-keeping? Are you confident you meet them?",
  "Where do things happen that no one can verify later?",
  "If you had to show an auditor or regulator your records for the last 90 days, what would be missing?",
  "When someone says 'I never agreed to that' — what do you do?",
  "What would you need to prove in court if a customer sued you tomorrow?",
];

// ============================================================================
// PILLAR 4: KNOWLEDGE & DECISIONS
// ============================================================================

/**
 * DISCOVERY: Who knows what? Where is expertise undocumented?
 * DELIVERY: Decision rights matrix + authority + thresholds
 */

export interface TribalKnowledgeItem {
  knowledge_name: string;
  description: string;
  held_by: string;  // Person's name or role
  critical_for: string;  // What process/decision it enables
  documented_anywhere: boolean;
  backup_person_exists: boolean;
  risk_if_lost: "high" | "medium" | "low";
}

export interface DecisionType {
  decision_name: string;
  examples: string[];
  current_approver: string;
  should_be_approver: string;
  threshold?: string;  // $ amount, risk level, etc.
  required_evidence: string[];
  current_sla?: string;
  desired_sla?: string;
}

export interface KnowledgeDecisionsDiscovery {
  // Tribal Knowledge (what's in people's heads)
  critical_knowledge_items: TribalKnowledgeItem[];
  key_person_dependencies: Array<{
    person: string;
    role: string;
    knowledge_areas: string[];
    bus_factor_risk: "high" | "medium" | "low";  // What happens if they leave/are sick?
  }>;
  undocumented_decision_rules: string[];

  // Decision Chaos (who approves what)
  decision_types: DecisionType[];
  unclear_authority_areas: string[];  // Where no one knows who decides
  bottleneck_approvers: string[];  // People who approve everything
  tribal_knowledge_score_0_10: number;  // Higher = more risk
}

export interface KnowledgeDecisionsDelivery {
  // Codify tribal knowledge
  knowledge_to_document: Array<{
    knowledge_area: string;
    documentation_format: "SOP" | "decision_tree" | "checklist" | "FAQ" | "video";
    owner: string;
  }>;

  // Decision Rights Matrix
  decision_rights_matrix: Array<{
    decision_type: string;
    approver_role: string;
    threshold: string;
    required_evidence: string[];
    sla_hours: number;
    escalation_if_no_response: string;
  }>;

  approval_workflows_to_build: string[];
  auto_approve_rules: Array<{
    condition: string;
    auto_decision: string;
  }>;
}

export const KNOWLEDGE_DECISIONS_DISCOVERY_QUESTIONS = [
  // Tribal Knowledge questions (makes you look smart)
  "Who's the person everyone asks when they don't know what to do?",
  "What happens when that person is on vacation or sick?",
  "What institutional knowledge would you lose if your best ops person quit tomorrow?",
  "How do new hires learn 'how things really work here' vs. what's in the handbook?",
  "Are there decisions that only one person knows how to make?",
  "What 'rules' exist only in people's heads, not in any documentation?",

  // Decision Rights questions (makes you look smart)
  "Who can approve a refund? A discount? A change order? An exception?",
  "What's the $ threshold before you need to escalate?",
  "Who's the bottleneck that has to approve everything?",
  "When someone's not sure if they can make a call, what do they do?",
  "What decisions get stuck waiting for approval?",
  "Have you ever had a problem because someone approved something they shouldn't have?",
];

// ============================================================================
// PILLAR 5: HANDOFFS & SLAs
// ============================================================================

/**
 * DISCOVERY: Where does context get lost between people/systems?
 * DELIVERY: SLA timers + escalation paths + stuck-case automation
 */

export interface HandoffPoint {
  handoff_name: string;
  from_role: string;
  from_system: string;
  to_role: string;
  to_system: string;
  frequency: "per_lead" | "per_project" | "daily" | "weekly";
  context_loss_points: string[];
  friction_score_0_10: number;
  current_workaround: string;
  time_lost_per_handoff_minutes?: number;
}

export interface SLAGap {
  process_step: string;
  current_response_time: string;
  desired_response_time: string;
  what_happens_when_missed: string;
  who_is_accountable: string;
}

export interface HandoffsSLAsDiscovery {
  handoffs: HandoffPoint[];
  total_handoffs_per_lead_or_project: number;
  highest_friction_handoff: string;
  total_context_loss_score_0_10: number;

  sla_gaps: SLAGap[];
  stuck_case_patterns: string[];  // Where things get stuck and why
  escalation_chaos: string[];  // Where escalation paths are unclear

  time_lost_to_handoffs_weekly_hours?: number;
}

export interface HandoffsSLAsDelivery {
  // Reduce handoffs
  handoffs_to_eliminate: string[];
  handoffs_to_automate: string[];
  context_preservation_rules: Array<{
    handoff: string;
    required_fields: string[];
    auto_populated_from: string;
  }>;

  // SLA enforcement
  sla_timers: Array<{
    process_step: string;
    sla_minutes: number;
    reminder_at_minutes: number;
    escalation_at_minutes: number;
    escalation_to: string;
    auto_action_if_expired?: string;
  }>;

  // Stuck case automation
  stuck_case_rules: Array<{
    condition: string;  // "no response in X hours"
    action: string;  // "auto-escalate to manager"
  }>;

  escalation_playbook: Array<{
    trigger: string;
    level_1: string;
    level_2: string;
    level_3: string;
  }>;
}

export const HANDOFFS_SLAS_DISCOVERY_QUESTIONS = [
  // Handoff questions (makes you look smart)
  "When work passes from sales to delivery, what information gets lost?",
  "How many times does a lead/request change hands before it's complete?",
  "At which handoff do you have to ask 'wait, what's the context here?'",
  "Where do you have to repeat information that should already be known?",
  "Which handoff causes the most delays or errors?",
  "If you could eliminate one handoff entirely, which would it be?",

  // SLA questions (makes you look smart)
  "What's your response time target? Do you actually hit it?",
  "When something gets stuck, how long before someone notices?",
  "What happens when a case sits untouched for 2 days? Does anyone escalate?",
  "Who's responsible when something falls through the cracks? How do you know it did?",
  "Have you ever lost a customer because you were too slow?",
  "What's the longest a customer has waited for something that should have been quick?",
];

// ============================================================================
// PILLAR 6: CHANNELS & EVIDENCE
// ============================================================================

/**
 * DISCOVERY: Where is info scattered? What channels have critical data?
 * DELIVERY: Evidence requirements + system of record + channel consolidation
 */

export interface CommunicationChannel {
  channel_name: string;
  channel_type: "email" | "slack" | "text" | "whatsapp" | "phone" | "in_person" | "dm" | "portal" | "other";
  business_critical_info_pct: number;  // What % of important info flows here?
  searchable: boolean;
  audit_ready: boolean;  // Can you produce records if needed?
  official_or_shadow: "official" | "shadow";
  retention_days?: number;
  who_uses_it: string[];
}

export interface EvidenceGap {
  decision_or_event: string;
  evidence_required: string;
  evidence_currently_captured: boolean;
  where_its_stored: string;
  findable_in_dispute: boolean;
}

export interface ChannelsEvidenceDiscovery {
  // Channel inventory
  channel_inventory: CommunicationChannel[];
  primary_channel: string;
  shadow_channels: string[];  // Unofficial channels where work happens
  chaos_score_0_10: number;
  single_source_of_truth: boolean;
  critical_info_in_shadow_channels_pct: number;

  // Evidence gaps
  evidence_gaps: EvidenceGap[];
  proof_requirements_by_decision: Array<{
    decision_type: string;
    proof_needed: string[];
    currently_captured: boolean;
  }>;
}

export interface ChannelsEvidenceDelivery {
  // Channel consolidation
  channels_to_eliminate: string[];
  channels_to_integrate: string[];
  recommended_primary_channel: string;
  channel_routing_rules: Array<{
    message_type: string;
    should_go_to: string;
    auto_capture_to: string;
  }>;

  // Evidence requirements
  evidence_requirements_by_exception: Array<{
    exception_type: string;
    required_evidence: string[];
    auto_capture_method: string;
  }>;

  // System of record
  system_of_record_design: {
    primary_entities: string[];
    required_attachments_per_entity: Record<string, string[]>;
    auto_logging_rules: string[];
    retention_policy: string;
  };
}

export const CHANNELS_EVIDENCE_DISCOVERY_QUESTIONS = [
  // Channel questions (makes you look smart)
  "If I asked you to find the communication history with a specific client from 6 months ago, where would you look? How many places?",
  "What % of important client info lives in personal text threads?",
  "Which channel has the most 'lost' information?",
  "Do you have a single source of truth, or is info scattered across multiple systems?",
  "What conversations happen in DMs/texts that should be documented elsewhere?",
  "Which communication channel would break your business if it disappeared?",

  // Evidence questions (makes you look smart)
  "When you approve a refund/discount/exception, what proof do you attach?",
  "If a customer says 'I was promised X', can you pull up the exact conversation?",
  "What evidence do you need to win a chargeback? Do you have it?",
  "When you make a decision, do you document why? Where?",
  "What would you need to show in a lawsuit? Could you find it?",
  "Have you ever lost a dispute because you couldn't find the evidence?",
];

// ============================================================================
// COMBINED 6-PILLAR AUDIT (FULL FRAMEWORK)
// ============================================================================

export interface SixPillarAuditDiscovery {
  // The discovery components (Agent 3)
  shadow_ops: ShadowOpsDiscovery;
  exceptions: ExceptionDiscovery;
  audit_trail: AuditTrailDiscovery;
  knowledge_decisions: KnowledgeDecisionsDiscovery;
  handoffs_slas: HandoffsSLAsDiscovery;
  channels_evidence: ChannelsEvidenceDiscovery;

  // Overall assessment
  overall_ops_health_score_0_100: number;
  priority_ranking: Array<{
    pillar: string;
    severity_score: number;
    priority: 1 | 2 | 3 | 4 | 5 | 6;
    rationale: string;
    quick_win_available: boolean;
  }>;
}

export interface SixPillarAuditDelivery {
  // The delivery components (Agent 4)
  shadow_ops: ShadowOpsDelivery;
  exceptions: ExceptionDelivery;
  audit_trail: AuditTrailDelivery;
  knowledge_decisions: KnowledgeDecisionsDelivery;
  handoffs_slas: HandoffsSLAsDelivery;
  channels_evidence: ChannelsEvidenceDelivery;

  // Implementation roadmap
  phase_1_quick_wins: string[];
  phase_2_foundation: string[];
  phase_3_scale: string[];

  // Metrics to track
  success_metrics: Array<{
    metric_name: string;
    baseline: string;
    target: string;
    measurement_method: string;
  }>;
}

export interface CompleteSixPillarAudit {
  client_id: string;
  client_name: string;
  audit_date: string;
  auditor: string;

  discovery: SixPillarAuditDiscovery;
  delivery: SixPillarAuditDelivery;

  executive_summary: string;
  estimated_value_monthly: number;
  confidence_level: "high" | "medium" | "low";
}

// ============================================================================
// ALL DISCOVERY QUESTIONS (FOR AGENT 3)
// ============================================================================

export const ALL_DISCOVERY_QUESTIONS = {
  shadow_ops: SHADOW_OPS_DISCOVERY_QUESTIONS,
  exceptions: EXCEPTION_DISCOVERY_QUESTIONS,
  audit_trail: AUDIT_TRAIL_DISCOVERY_QUESTIONS,
  knowledge_decisions: KNOWLEDGE_DECISIONS_DISCOVERY_QUESTIONS,
  handoffs_slas: HANDOFFS_SLAS_DISCOVERY_QUESTIONS,
  channels_evidence: CHANNELS_EVIDENCE_DISCOVERY_QUESTIONS,
};

// ============================================================================
// PAIN CATEGORIES (Updated for V3 - Maps to Pillars)
// ============================================================================

export type PainCategory =
  // Traditional pain categories
  | "Lead Handling Chaos"
  | "Inbox/DM Overload"
  | "Scheduling + No-Show Leakage"
  | "CRM/Data Mess"
  | "Manual Reporting / No KPIs"
  | "Community Ops Burden"
  | "Fulfillment Bottlenecks"
  // Pillar-mapped categories (V3)
  | "Shadow Ops Overload"  // Pillar 1
  | "Exception Chaos"  // Pillar 2
  | "Audit/Compliance Gap"  // Pillar 3
  | "Tribal Knowledge Risk"  // Pillar 4
  | "Decision Bottlenecks"  // Pillar 4
  | "Handoff Friction"  // Pillar 5
  | "SLA Failures"  // Pillar 5
  | "Channel Chaos"  // Pillar 6
  | "Evidence Gaps";  // Pillar 6

export const PAIN_TO_PILLAR_MAP: Record<string, string> = {
  "Lead Handling Chaos": "shadow_ops",
  "Inbox/DM Overload": "channels_evidence",
  "Scheduling + No-Show Leakage": "exceptions",
  "CRM/Data Mess": "audit_trail",
  "Manual Reporting / No KPIs": "audit_trail",
  "Community Ops Burden": "shadow_ops",
  "Fulfillment Bottlenecks": "handoffs_slas",
  "Shadow Ops Overload": "shadow_ops",
  "Exception Chaos": "exceptions",
  "Audit/Compliance Gap": "audit_trail",
  "Tribal Knowledge Risk": "knowledge_decisions",
  "Decision Bottlenecks": "knowledge_decisions",
  "Handoff Friction": "handoffs_slas",
  "SLA Failures": "handoffs_slas",
  "Channel Chaos": "channels_evidence",
  "Evidence Gaps": "channels_evidence",
};

// ============================================================================
// PILLAR SUMMARY (For Sales Decks / Docs)
// ============================================================================

export const PILLAR_SUMMARIES = [
  {
    number: 1,
    name: "Shadow Ops",
    tagline: "Where does work escape your systems?",
    discovery_focus: "Find the invisible work living in texts, spreadsheets, and memory",
    delivery_focus: "Automate it with native workflows",
    key_question: "What would break if your phone died?",
  },
  {
    number: 2,
    name: "Exception Library",
    tagline: "What edge cases break your processes?",
    discovery_focus: "Map the recurring fires and their true cost",
    delivery_focus: "Build routing rules and handling automation",
    key_question: "What's the exception that costs you money but nobody tracks?",
  },
  {
    number: 3,
    name: "Audit Trail",
    tagline: "What can't you prove happened?",
    discovery_focus: "Find the gaps in your records and dispute history",
    delivery_focus: "Implement immutable logging and compliance-ready records",
    key_question: "If a customer sued you tomorrow, what couldn't you prove?",
  },
  {
    number: 4,
    name: "Knowledge & Decisions",
    tagline: "Who knows what? Who can approve what?",
    discovery_focus: "Map tribal knowledge and decision chaos",
    delivery_focus: "Codify expertise and build decision rights matrix",
    key_question: "What happens when your best person is out sick?",
  },
  {
    number: 5,
    name: "Handoffs & SLAs",
    tagline: "Where does context get lost? Where do things get stuck?",
    discovery_focus: "Find the friction points and stuck cases",
    delivery_focus: "Build SLA timers, escalation paths, and stuck-case automation",
    key_question: "When something sits untouched, how long before anyone notices?",
  },
  {
    number: 6,
    name: "Channels & Evidence",
    tagline: "Where is info scattered? What proof exists?",
    discovery_focus: "Inventory all channels and evidence gaps",
    delivery_focus: "Consolidate channels and build evidence capture requirements",
    key_question: "If I asked for a client's full history, how many places would you check?",
  },
];
