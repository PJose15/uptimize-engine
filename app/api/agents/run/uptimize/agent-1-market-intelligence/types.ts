/**
 * TypeScript types for UptimizeAI Agent 1: Market Intelligence & Targeting (v2)
 */

// Enums for type safety
export type Segment = "private_group" | "operator_smb" | "high_volume_leads" | "other";

export type ChannelRecommendation = "email" | "linkedin" | "instagram_dm" | "x_dm" | "facebook_dm" | "other";

export type EvidenceType = "website" | "social" | "job_post" | "review" | "news" | "other";

export type PainCategory =
  | "Lead Handling Chaos"
  | "Inbox/DM Overload"
  | "Scheduling + No-Show Leakage"
  | "CRM/Data Mess"
  | "Manual Reporting / No KPIs"
  | "Community Ops Burden"
  | "Fulfillment Bottlenecks"
  | "EXCEPTION OVERLOAD"
  | "RECONCILIATION/AUDIT GAP";

export type Confidence = "high" | "medium" | "low";

export type OutputMode = "Daily Target Pack" | "Segment Deep Dive" | "Angle Testing" | "Weekly Intel";

// Evidence source structure
export interface EvidenceSource {
  type: EvidenceType;
  reference: string;
  note: string;
}

// Stack assumption structure
export interface StackAssumption {
  assumption: string;
  confidence: Confidence;
}

// Score breakdown structure
export interface ScoreBreakdown {
  pain_intensity: number;      // 0-20
  urgency_trigger: number;      // 0-15
  authority: number;            // 0-15
  budget_likelihood: number;    // 0-15
  complexity_fit: number;       // 0-15
  tool_fit: number;             // 0-10 (renamed from tool_stack_fit for v2)
  reachability: number;         // 0-10
}

// Hooks structure (v2)
export interface Hooks {
  primary_hook_140_chars: string;
  backup_hook_140_chars: string;
}

// Lead record structure (v2)
export interface LeadRecord {
  lead_id: string;
  name: string;
  company: string;
  role: string;
  segment: string;
  fit_score_0_100: number; // 0-100
  fit_score_breakdown: ScoreBreakdown;
  confidence_level: Confidence;
  pain_categories: string[]; // 1-2 items
  shadow_ops_density_0_10: number; // 0-10 (v2)
  shadow_ops_rationale: string; // (v2)
  exception_hypotheses_top3: string[]; // 1-3 items (v2)
  trigger_event: string;
  what_to_say: string;
  hooks: Hooks; // (v2)
  pattern_interrupt_question: string; // (v2)
  cta: string;
}

// Run metadata structure (v2)
export interface RunMetadata {
  run_date: string; // ISO date
  segment_focus: string;
  sources_used: string[];
  notes: string;
}

// Angle of the day structure (v2)
export interface AngleOfTheDay {
  primary_angle: string;
  secondary_angle: string;
  pattern_interrupt_question: string;
}

// Do not target item structure (v2)
export interface DoNotTarget {
  reason: string;
  examples: string[];
}

// Shadow Ops Insights (v2)
export interface ShadowOpsInsights {
  top_signals_found: string[];
  common_exception_patterns: string[];
  notes: string;
}

// Main output structure (v2)
export interface TargetPackOutput {
  run_metadata: RunMetadata;
  angle_of_the_day: AngleOfTheDay;
  do_not_target: DoNotTarget[];
  target_pack_primary: LeadRecord[];
  target_pack_secondary: LeadRecord[];
  shadow_ops_insights: ShadowOpsInsights; // (v2)
}

// Input context for the agent
export interface Agent1Context {
  mode?: OutputMode;
  segment_override?: Segment[];
  candidate_pool_size?: number; // Default: 50-100
  output_pack_size?: number; // Default: 10-30
  include_weekly_intel?: boolean;
  custom_pain_categories?: string[];
  custom_trigger_events?: string[];
}

// Agent execution result
export interface Agent1Result {
  success: boolean;
  message: string;
  data?: TargetPackOutput;
  metadata?: {
    provider: string;
    model: string;
    tokensUsed?: number;
    timestamp: string;
    latencyMs: number;
  };
  error?: {
    type: string;
    details: string;
    timestamp: string;
  };
}
