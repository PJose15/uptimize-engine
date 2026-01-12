/**
 * TypeScript types for UptimizeAI Agent 1: Market Intelligence & Targeting
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
  | "Fulfillment Bottlenecks";

export type Confidence = "high" | "medium" | "low";

export type ProofPointStyle = "problem-first" | "proof-first" | "curiosity-first";

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
  tool_stack_fit: number;       // 0-10
  reachability: number;         // 0-10
}

// Lead record structure
export interface LeadRecord {
  lead_id: string;
  person_name: string;
  role_title: string;
  company_name: string;
  company_size_estimate?: string;
  segment: Segment;
  region_timezone: string;
  channel_recommendation: ChannelRecommendation;
  website: string;
  evidence_sources: EvidenceSource[];
  pain_categories: PainCategory[]; // 1-2 items
  pain_evidence_summary: string;
  trigger_event: string;
  trigger_evidence_summary: string;
  current_stack_assumptions: StackAssumption[];
  fit_score: number; // 0-100
  score_breakdown: ScoreBreakdown;
  confidence: Confidence;
  confidence_rationale: string;
  primary_angle: string;
  backup_angle: string;
  hook_line: string; // Max ~140 chars
  cta_question: string;
}

// Run metadata structure
export interface RunMetadata {
  run_date: string; // ISO date
  segment_focus: string[];
  pack_size_primary: number;
  notes: string;
}

// Angle of the day structure
export interface AngleOfTheDay {
  theme: string;
  one_liner: string;
  best_for_segment: string;
  proof_point_style: ProofPointStyle;
}

// Do not target item structure
export interface DoNotTarget {
  name_or_company: string;
  reason: string;
}

// Weekly intel structure
export interface WeeklyIntel {
  top_pains: string[];
  top_triggers: string[];
  best_angles: string[];
  objection_patterns: string[];
}

// Main output structure
export interface TargetPackOutput {
  run_metadata: RunMetadata;
  angle_of_the_day: AngleOfTheDay;
  do_not_target: DoNotTarget[];
  target_pack_primary: LeadRecord[];
  target_pack_secondary: LeadRecord[];
  weekly_intel?: WeeklyIntel;
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
