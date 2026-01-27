/**
 * UptimizeAI Shared Audit Pillars - V3
 *
 * The 6-Pillar Audit Framework:
 * 1. Shadow Ops - Off-system work
 * 2. Exception Library - Edge cases that break workflows
 * 3. Audit Trail - Provability / compliance
 * 4. Tribal Knowledge - Undocumented expertise (V3 NEW)
 * 5. Handoff Friction - Context loss between people/systems (V3 NEW)
 * 6. Channel Chaos - Scattered communication (V3 NEW)
 *
 * All six feed into the same mission:
 * Eliminate invisible work, prove what happened, and make operations bulletproof.
 */

// ============================================================================
// PILLAR 1: SHADOW OPS (V2)
// ============================================================================

export interface ShadowOpsTask {
  task: string;
  frequency: "daily" | "weekly" | "monthly" | "ad_hoc";
  impact: "high" | "medium" | "low";
  why_it_exists: string;
  current_tool_used: string;  // "WhatsApp", "spreadsheet", "memory", etc.
}

export interface ShadowOpsMap {
  top_invisible_tasks_ranked: ShadowOpsTask[];
  off_system_channels: string[];
  context_loss_points: string[];
  audit_gaps: string[];
  density_score_0_10: number;
  density_rationale: string;
}

// Discovery Questions for Shadow Ops
export const SHADOW_OPS_DISCOVERY_QUESTIONS = [
  "What work happens outside your tools — WhatsApp/text/DMs/spreadsheets?",
  "Where do you rely on memory or 'that one person'?",
  "Where do you chase customers for missing info?",
  "Where do approvals slow everything down?",
  "Where do you need double-checks because mistakes are expensive?",
  "Can you prove what happened on a lead/customer later (audit trail)? Where not?",
];

// ============================================================================
// PILLAR 2: EXCEPTION LIBRARY (V2)
// ============================================================================

export interface Exception {
  exception_name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "ad_hoc";
  impact: "high" | "medium" | "low";
  current_handling: string;
  desired_handling: string;
  rework_time_minutes?: number;
  customer_impact?: string;
}

export interface ExceptionLibrary {
  top_exceptions_ranked: Exception[];
  exception_count_weekly_estimate: number;
  most_disruptive_exception: string;
  exceptions_to_productize: string[];
}

// Discovery Questions for Exceptions
export const EXCEPTION_DISCOVERY_QUESTIONS = [
  "What are the top 5 exceptions you deal with weekly?",
  "Which exception creates the most rework or customer complaints?",
  "When the process breaks, what happens next? Who handles it?",
  "How much time per week is spent handling exceptions vs. the happy path?",
  "Which exception, if eliminated, would have the biggest impact?",
];

// ============================================================================
// PILLAR 3: AUDIT TRAIL (V2)
// ============================================================================

export interface AuditGap {
  process_area: string;
  what_cant_be_proven: string;
  risk_level: "high" | "medium" | "low";
  compliance_implication?: string;
}

export interface AuditTrailAssessment {
  completeness_score_0_100: number;
  gaps: AuditGap[];
  what_is_logged: string[];
  what_is_not_logged: string[];
  compliance_requirements?: string[];
  recommended_events_to_log: string[];
}

// Discovery Questions for Audit Trail
export const AUDIT_TRAIL_DISCOVERY_QUESTIONS = [
  "If a customer disputes what was said or done, can you prove it? Where not?",
  "What decisions are made that aren't documented anywhere?",
  "Do you have any compliance requirements for record-keeping?",
  "What would you need to show an auditor or regulator?",
  "Where do things happen that no one can verify later?",
];

// ============================================================================
// PILLAR 4: TRIBAL KNOWLEDGE (V3 NEW)
// ============================================================================

export interface TribalKnowledgeItem {
  knowledge_name: string;
  description: string;
  held_by: string;  // Person's name or role
  critical_for: string;  // What process/decision it enables
  documented_anywhere: boolean;
  backup_person_exists: boolean;
  risk_if_lost: "high" | "medium" | "low";
  codification_priority: "high" | "medium" | "low";
  recommended_action: string;  // "document in SOP", "create decision tree", etc.
}

export interface TribalKnowledgeMap {
  critical_knowledge_items: TribalKnowledgeItem[];
  key_person_dependencies: Array<{
    person: string;
    role: string;
    knowledge_areas: string[];
    bus_factor_risk: "high" | "medium" | "low";  // What happens if they leave?
  }>;
  undocumented_decision_rules: string[];
  institutional_memory_gaps: string[];
  total_tribal_knowledge_score_0_10: number;  // Higher = more undocumented tribal knowledge (bad)
}

// Discovery Questions for Tribal Knowledge
export const TRIBAL_KNOWLEDGE_DISCOVERY_QUESTIONS = [
  "Who's the person everyone asks when they don't know what to do?",
  "What happens when that person is on vacation?",
  "What institutional knowledge would you lose if your best ops person quit tomorrow?",
  "Are there decisions that only one person knows how to make?",
  "What 'rules' exist only in people's heads, not in any documentation?",
  "How do new hires learn 'how things really work here'?",
];

// ============================================================================
// PILLAR 5: HANDOFF FRICTION (V3 NEW)
// ============================================================================

export interface HandoffPoint {
  handoff_name: string;
  from_role: string;
  from_system: string;
  to_role: string;
  to_system: string;
  frequency: "per_lead" | "daily" | "weekly" | "per_project";
  context_loss_points: string[];
  friction_score_0_10: number;  // How much friction/delay does this handoff cause?
  current_workaround: string;
  time_lost_per_handoff_minutes?: number;
  recommended_fix: string;
}

export interface HandoffFrictionMap {
  handoffs: HandoffPoint[];
  total_handoffs_per_lead_or_project: number;
  highest_friction_handoff: string;
  total_context_loss_score_0_10: number;
  handoff_reduction_opportunities: string[];
}

// Discovery Questions for Handoff Friction
export const HANDOFF_FRICTION_DISCOVERY_QUESTIONS = [
  "When work passes from sales to delivery, what information gets lost?",
  "How many times does a lead/request change hands before it's complete?",
  "At which handoff do you have to ask 'wait, what's the context here?'",
  "Where do you have to repeat information that should already be known?",
  "Which handoff causes the most delays or errors?",
  "If you could eliminate one handoff entirely, which would it be?",
];

// ============================================================================
// PILLAR 6: CHANNEL CHAOS (V3 NEW)
// ============================================================================

export interface CommunicationChannel {
  channel_name: string;
  channel_type: "email" | "slack" | "text" | "whatsapp" | "phone" | "in_person" | "dm" | "portal" | "other";
  business_critical_info_pct: number;  // What % of important info flows through here?
  searchable: boolean;
  audit_ready: boolean;  // Can you produce records if needed?
  official_or_shadow: "official" | "shadow";  // Is this an approved channel or not?
  retention_days?: number;
  integration_possible: boolean;
}

export interface ChannelChaosMap {
  channel_inventory: CommunicationChannel[];
  primary_channel: string;
  shadow_channels: string[];  // Unofficial channels where work happens
  chaos_score_0_10: number;  // Higher = more scattered
  single_source_of_truth: boolean;
  critical_info_in_shadow_channels_pct: number;
  recommended_consolidation: string;
  channels_to_eliminate: string[];
  channels_to_integrate: string[];
}

// Discovery Questions for Channel Chaos
export const CHANNEL_CHAOS_DISCOVERY_QUESTIONS = [
  "If I asked you to find the communication history with a specific client from 6 months ago, where would you look? How many places?",
  "What % of important client info lives in personal text threads?",
  "Which channel has the most 'lost' information?",
  "Do you have a single source of truth, or is info scattered across multiple systems?",
  "What conversations happen in DMs/texts that should be documented elsewhere?",
  "Which communication channels would break your business if they disappeared?",
];

// ============================================================================
// COMBINED 6-PILLAR AUDIT
// ============================================================================

export interface SixPillarAudit {
  // The 6 Pillars
  shadow_ops: ShadowOpsMap;
  exception_library: ExceptionLibrary;
  audit_trail: AuditTrailAssessment;
  tribal_knowledge: TribalKnowledgeMap;
  handoff_friction: HandoffFrictionMap;
  channel_chaos: ChannelChaosMap;

  // Overall Scores
  overall_operational_health_score_0_100: number;
  priority_ranking: Array<{
    pillar: string;
    score: number;
    priority: 1 | 2 | 3 | 4 | 5 | 6;
    rationale: string;
  }>;

  // Recommendations
  quick_wins: string[];  // Fix in Phase 1
  medium_term: string[];  // Fix in Phase 2
  strategic: string[];  // Fix in Phase 3
}

// ============================================================================
// ALL DISCOVERY QUESTIONS COMBINED
// ============================================================================

export const ALL_AUDIT_DISCOVERY_QUESTIONS = {
  shadow_ops: SHADOW_OPS_DISCOVERY_QUESTIONS,
  exception_library: EXCEPTION_DISCOVERY_QUESTIONS,
  audit_trail: AUDIT_TRAIL_DISCOVERY_QUESTIONS,
  tribal_knowledge: TRIBAL_KNOWLEDGE_DISCOVERY_QUESTIONS,
  handoff_friction: HANDOFF_FRICTION_DISCOVERY_QUESTIONS,
  channel_chaos: CHANNEL_CHAOS_DISCOVERY_QUESTIONS,
};

// ============================================================================
// PAIN CATEGORIES (Updated for V3)
// ============================================================================

export type PainCategory =
  | "Lead Handling Chaos"
  | "Inbox/DM Overload"
  | "Scheduling + No-Show Leakage"
  | "CRM/Data Mess"
  | "Manual Reporting / No KPIs"
  | "Community Ops Burden"
  | "Fulfillment Bottlenecks"
  | "Exception Overload"  // Special - maps to Pillar 2
  | "Reconciliation/Audit Gap"  // Special - maps to Pillar 3
  | "Tribal Knowledge Risk"  // V3 NEW - maps to Pillar 4
  | "Handoff Friction"  // V3 NEW - maps to Pillar 5
  | "Channel Chaos";  // V3 NEW - maps to Pillar 6

export const PAIN_CATEGORY_LIBRARY: Array<{
  category: PainCategory;
  description: string;
  maps_to_pillar: string;
  symptoms: string[];
}> = [
  {
    category: "Lead Handling Chaos",
    description: "Leads fall through cracks, no clear ownership, inconsistent follow-up",
    maps_to_pillar: "shadow_ops",
    symptoms: ["Leads in spreadsheets", "Manual tracking", "No clear pipeline"],
  },
  {
    category: "Inbox/DM Overload",
    description: "Critical messages buried, slow response times, context lost",
    maps_to_pillar: "channel_chaos",
    symptoms: ["Multiple inboxes", "DM chaos", "Missed messages"],
  },
  {
    category: "Scheduling + No-Show Leakage",
    description: "No-shows, rescheduling chaos, manual confirmations",
    maps_to_pillar: "shadow_ops",
    symptoms: ["Manual reminders", "High no-show rate", "Scheduling back-and-forth"],
  },
  {
    category: "CRM/Data Mess",
    description: "Dirty data, outdated records, no single source of truth",
    maps_to_pillar: "audit_trail",
    symptoms: ["Duplicate contacts", "Missing fields", "Outdated info"],
  },
  {
    category: "Manual Reporting / No KPIs",
    description: "No visibility, spreadsheet reports, can't measure what matters",
    maps_to_pillar: "audit_trail",
    symptoms: ["End-of-month scramble", "No dashboards", "Gut-feel decisions"],
  },
  {
    category: "Community Ops Burden",
    description: "Member management, engagement tracking, manual curation",
    maps_to_pillar: "shadow_ops",
    symptoms: ["Manual member tracking", "DM-based support", "No engagement metrics"],
  },
  {
    category: "Fulfillment Bottlenecks",
    description: "Delivery delays, quality issues, capacity constraints",
    maps_to_pillar: "exception_library",
    symptoms: ["Delays", "Quality complaints", "Overwork"],
  },
  {
    category: "Exception Overload",
    description: "Too many edge cases, constant fire-fighting, no standardization",
    maps_to_pillar: "exception_library",
    symptoms: ["Constant fire-fighting", "No SOP", "Ad-hoc problem solving"],
  },
  {
    category: "Reconciliation/Audit Gap",
    description: "Can't prove what happened, compliance risk, no paper trail",
    maps_to_pillar: "audit_trail",
    symptoms: ["Can't verify", "Compliance concerns", "Disputes"],
  },
  {
    category: "Tribal Knowledge Risk",
    description: "Critical knowledge in people's heads, bus factor, new hire ramp",
    maps_to_pillar: "tribal_knowledge",
    symptoms: ["Key person dependency", "Long onboarding", "Knowledge silos"],
  },
  {
    category: "Handoff Friction",
    description: "Context lost between people/teams, repeated questions, delays",
    maps_to_pillar: "handoff_friction",
    symptoms: ["Context loss", "Repeated briefings", "Handoff delays"],
  },
  {
    category: "Channel Chaos",
    description: "Info scattered across tools, can't find conversations, shadow IT",
    maps_to_pillar: "channel_chaos",
    symptoms: ["Multiple channels", "Can't find info", "Shadow communication"],
  },
];
