/**
 * UptimizeAI Agent 2: Outbound & Appointment Setter
 * Type Definitions
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Configuration context for Agent 2 execution
 */
export interface Agent2Context {
  /** Target Pack from Agent 1 (ranked leads with pain, trigger, hook/CTA) */
  targetPack?: any; // Accept Agent1 output or similar structure
  /** Calendar availability windows */
  calendarAvailability?: string[];
  /** Offer positioning and proof points */
  offerPositioning?: string;
  proofPoints?: string[];
  /** Timezone for scheduling (defaults to America/Puerto_Rico) */
  timezone?: string;
  /** Channels to use for outreach */
  channels?: string[];
  /** Volume targets for the run */
  volumeTargets?: {
    newOutreach?: number;
    followups?: number;
    goalBookedCalls?: number;
  };
  /** Any additional notes or context */
  notes?: string;
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Standard result wrapper for Agent 2
 */
export interface Agent2Result {
  success: boolean;
  message: string;
  data?: OutboundAndBookingOutput;
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

/**
 * Complete structured output from Agent 2
 */
export interface OutboundAndBookingOutput {
  run_metadata: RunMetadata;
  outbound_run_sheet: OutboundRunSheet;
  message_library: MessageLibraryEntry[];
  conversation_updates: ConversationUpdate[];
  bookings: Booking[];
  nurture_queue: NurtureEntry[];
}

// ============================================================================
// RUN METADATA
// ============================================================================

export interface RunMetadata {
  run_date: string; // ISO date
  timezone: string;
  channels_used: string[];
  volume_targets: VolumeTargets;
  notes: string;
}

export interface VolumeTargets {
  new_outreach: number;
  followups: number;
  goal_booked_calls: number;
}

// ============================================================================
// OUTBOUND RUN SHEET
// ============================================================================

export interface OutboundRunSheet {
  daily_plan: DailyPlanBlock[];
  sequence_rules: string;
  qualification_rules: string;
  no_show_protocol: string;
}

export interface DailyPlanBlock {
  block_name: string;
  activity: ActivityType;
  count: number;
  channel: string;
}

export type ActivityType =
  | "new_outreach"
  | "followups"
  | "replies_qualification"
  | "booking_admin";

// ============================================================================
// MESSAGE LIBRARY
// ============================================================================

export interface MessageLibraryEntry {
  lead_id: string;
  channel: string;
  track_messages: TrackMessages;
  followup_sequence: FollowupTouch[];
}

export interface TrackMessages {
  pattern_interrupt: string; // v2: Pattern-Interrupt Question track (default)
  problem_first: string;
  proof_first: string;
}

export interface FollowupTouch {
  touch_number: number;
  day_offset: number;
  message: string;
  angle_type: AngleType;
  cta: string;
}

export type AngleType =
  | "question"
  | "insight"
  | "micro_case"
  | "resource"
  | "breakup"
  | "reframe";

// ============================================================================
// CONVERSATION UPDATES
// ============================================================================

export interface ConversationUpdate {
  lead_id: string;
  old_stage: PipelineStage;
  new_stage: PipelineStage;
  tags: string[]; // v2: Add tags for categorization
  note: string;
}

export type PipelineStage =
  | "NEW"
  | "CONTACTED"
  | "REPLIED"
  | "QUALIFYING"
  | "QUALIFIED"
  | "BOOKED"
  | "NO-SHOW"
  | "CLOSED-WON"
  | "CLOSED-LOST"
  | "NURTURE";

// ============================================================================
// BOOKINGS
// ============================================================================

export interface Booking {
  lead_id: string;
  meeting_time_local: string; // Local time string (America/Puerto_Rico)
  meeting_type: MeetingType;
  qualified_lead_summary: QualifiedLeadSummary;
  confirmation_flow: ConfirmationMessage[];
}

export type MeetingType = "discovery" | "audit" | "demo";

export interface QualifiedLeadSummary {
  problem: string;
  impact: string;
  urgency: string;
  authority: string;
  stack: string;
  timeline: string;
  qualification_level: QualificationLevel;
  shadow_ops_off_system_examples: string[]; // v2: Off-system work examples
  top_exceptions_mentioned: string[]; // v2: Edge cases they face
  recommended_offer_angle: string;
  objections_expected_tags: string[]; // v2: Expected objections for close plan
}

export type QualificationLevel = "hard_qualified" | "soft_qualified";

export interface ConfirmationMessage {
  timing: ConfirmationTiming;
  message: string;
}

export type ConfirmationTiming =
  | "immediate"
  | "24h_before"
  | "2h_before"
  | "15m_before"
  | "no_confirm_reschedule";

// ============================================================================
// NURTURE QUEUE
// ============================================================================

export interface NurtureEntry {
  lead_id: string;
  reason: string;
  next_touch_day_offset: number;
  nurture_message: string;
  shadow_ops_guess: string; // v2: Hypothesized off-system work
  likely_exceptions_guess: string[]; // v2: Predicted edge cases
}

// ============================================================================
// TAGGING & CLASSIFICATION
// ============================================================================

export type PainTag =
  | "PAIN_FOLLOWUP"
  | "PAIN_VISIBILITY"
  | "PAIN_INBOX"
  | "PAIN_NOSHOW"
  | "PAIN_CRM"
  | "PAIN_COMMUNITY";

export type ObjectionTag =
  | "OBJ_PRICE"
  | "OBJ_TIMING"
  | "OBJ_ALREADY_HAVE"
  | "OBJ_SEND_INFO"
  | "OBJ_NO_TIME"
  | "OBJ_BAD_PAST_EXP"
  | "OBJ_STATUS_QUO"
  | "OBJ_NOT_DM"
  | "OBJ_CHANNEL_PREF"
  | "OBJ_SECURITY"
  | "OBJ_PRICE_ASK"
  | "OBJ_THINK";

export type OutcomeTag =
  | "OUT_BOOKED"
  | "OUT_NURTURE"
  | "OUT_LOST"
  | "OUT_NO_SHOW"
  | "OUT_GHOST";
