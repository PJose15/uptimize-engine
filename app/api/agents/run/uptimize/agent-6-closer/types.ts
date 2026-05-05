/**
 * UptimizeAI Agent 6 — Closer & Onboarding Coordinator
 * Type definitions
 *
 * Source spec: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Agent 6, Sub-agents 6A/6B)
 * Source spec: UPTIMIZE_HANDOFF_SCHEMAS_V2.md (Agent3ToAgent6, Agent6ToAgent4)
 */

// ============================================================================
// INPUT TO AGENT 6 — incoming from Agent 3 + Gate 3 decision
// ============================================================================

export type Tier = 'starter' | 'growth' | 'full_system';

export interface ProposalTierOption {
  build_fee_usd: number;
  monthly_retainer_usd: number;
  delivery_days: number;
  whats_included: string[];
  top_leak_addressed?: string;
  top_leak_value_usd?: number;
  leaks_addressed?: string[];
  total_value_usd?: number;
}

export interface ProposalPackage {
  recommended_tier: Tier;
  tier_rationale: string;
  starter_option: ProposalTierOption & { delivery_days: 14 };
  growth_option: ProposalTierOption;
  full_system_option?: ProposalTierOption;
}

export interface MoneyLeakMap {
  total_monthly_value_usd: number;
  confidence_weighted_usd: number;
  pillar_breakdown: Array<{
    pillar: string;
    monthly_value_usd: number;
    confidence: 'high' | 'medium' | 'low';
    key_leaks: string[];
  }>;
  key_assumptions: string[];
}

export interface AnticipatedObjection {
  objection: string;
  likelihood: 'high' | 'medium' | 'low';
  recommended_response: string;
  evidence_to_reference: string;
}

export interface ClosePlan {
  presentation_sequence: string[];
  lead_with_this_number: number;
  anticipated_objections: AnticipatedObjection[];
  decision_maker_profile: string;
  urgency_signal: string;
  deal_breakers_to_avoid: string[];
}

export interface ClientIntelligence {
  specific_phrases_used: string[];
  problems_in_their_words: string;
  what_they_care_most_about: string;
  communication_style: 'formal' | 'casual' | 'data-driven' | 'narrative';
  decision_speed_signal: 'fast' | 'deliberate' | 'committee-based';
  budget_signals: string[];
}

export interface RequiredIntegration {
  system_name: string;
  system_type: string;
  credential_type: 'api_key' | 'oauth' | 'webhook' | 'username_password';
  instructions?: string;
}

export interface BuildReadiness {
  required_integrations: RequiredIntegration[];
  known_constraints: string[];
  timeline_expectations: string;
  agent3_handoff_spec: unknown; // Full Agent3ToAgent4 spec, opaque to Agent 6
}

export interface Agent6Input {
  // Agent 3 outputs (the 3→6 handoff payload)
  proposal: ProposalPackage;
  money_leak_map: MoneyLeakMap;
  close_plan: ClosePlan;
  client_intelligence: ClientIntelligence;
  build_readiness: BuildReadiness;

  // Gate 3 decision from Pedro
  gate3_decision: {
    proposalApproved: boolean;
    scopeModifications?: string[];
    pricingAdjustment?: number;
    tierRecommendation?: Tier;
    notes?: string;
  };

  // Mode: pre-close coaching vs post-close execution
  mode: 'pre_close' | 'post_close';

  // Post-close inputs (only when mode === 'post_close')
  presentation_outcome?: PresentationOutcome;

  // Identity
  client_id: string;
  pipeline_session_id?: string;
}

// ============================================================================
// 6A — PRESENTATION COACH RESULT
// ============================================================================

export interface PrePresentationGuide {
  opening_statement: string;
  lead_with_this_number_usd: number;
  recommended_sequence: string[];
  objection_responses: Array<{
    objection: string;
    response_acknowledge: string;
    response_reframe: string;
    response_evidence: string;
    response_ask: string;
  }>;
  closing_question: string;
  red_lines: string[];
}

export type PresentationOutcomeStatus = 'signed' | 'negotiating' | 'thinking' | 'no';

export interface PresentationOutcome {
  status: PresentationOutcomeStatus;
  agreed_tier?: Tier;
  agreed_build_fee_usd?: number;
  agreed_monthly_retainer_usd?: number;
  payment_terms?: string;
  scope_inclusions?: string[];
  scope_exclusions?: string[];
  phase_2_preview?: string[];
  objections_raised: Array<{
    objection: string;
    resolution: string;
    any_commitments_made: string;
  }>;
  client_priorities_stated: string[];
  specific_concerns_for_build: string[];
  relationship_tone: 'enthusiastic' | 'cautious' | 'business-only' | 'collaborative';
  pedro_notes?: string;
}

export interface PostPresentationDebrief {
  what_actually_happened: string;
  objections_that_came_up: string[];
  what_worked: string[];
  what_did_not_work: string[];
  scope_changes_during_close: string[];
  feeds_to_agent8: {
    objection_pattern: string;
    response_effectiveness: 'high' | 'medium' | 'low';
    notes_for_methodology: string;
  };
}

export interface PresentationCoachResult {
  pre_presentation_guide: PrePresentationGuide;
  post_presentation_debrief?: PostPresentationDebrief;
}

// ============================================================================
// 6B — CONTRACT ORCHESTRATOR RESULT
// ============================================================================

export interface ContractStatus {
  sow_generated: boolean;
  sow_sent_at?: string;        // ISO 8601
  sow_version: number;
  signed_at?: string;          // ISO 8601 — populated only when signed
  signature_method?: 'docusign' | 'pandadoc' | 'manual_pdf';
  follow_ups_sent: number;
  next_followup_due?: string;  // ISO 8601
}

export interface CredentialBlocker {
  system_name: string;
  blocker: string;
  attempts: number;
}

export interface ConfirmedCredential {
  system_name: string;
  system_type: string;
  credential_reference: string;        // Secrets manager key, NOT the value
  access_level_confirmed: string;
  test_connection_passed: boolean;
  notes?: string;
  collected_at: string;                // ISO 8601
}

export interface CredentialStatus {
  required_count: number;
  collected_count: number;
  tested_count: number;
  all_required_tested: boolean;
  confirmed_credentials: ConfirmedCredential[];
  blockers: CredentialBlocker[];
}

export interface ClientSetup {
  client_id: string;
  client_config_created: boolean;
  portal_created: boolean;
  portal_login_sent: boolean;
  portal_first_login_at?: string;      // ISO 8601 — populated when client first logs in
  kickoff_date?: string;               // ISO 8601
  kickoff_agenda_items: string[];
  primary_contact_name: string;
  primary_contact_email: string;
  secondary_contact?: {
    name: string;
    email: string;
    role: string;
  };
  preferred_communication: 'email' | 'slack' | 'whatsapp' | 'phone' | 'portal';
}

export interface ScopeModification {
  original_item: string;
  change_type: 'removed' | 'modified' | 'added';
  new_description?: string;
  reason: string;
}

export interface BuildDirective {
  directive: string;
  source: 'client_request' | 'pedro_decision' | 'objection_resolution';
  priority: 'must' | 'should' | 'nice-to-have';
}

export interface AgreedScope {
  tier: Tier;
  build_fee_usd: number;
  monthly_retainer_usd: number;
  payment_terms: string;
  scope_inclusions: string[];
  scope_exclusions: string[];
  phase_2_preview: string[];
}

/**
 * Briefing for Agent 4 — equivalent to the Agent6ToAgent4 handoff payload.
 * Always built, but only delivered to Agent 4 when ready_for_build is true.
 */
export interface Agent4Briefing {
  agreed_scope: AgreedScope;
  close_context: {
    close_date: string;
    objections_raised: PresentationOutcome['objections_raised'];
    client_priorities_stated: string[];
    specific_concerns_for_build: string[];
    relationship_tone: PresentationOutcome['relationship_tone'];
  };
  confirmed_credentials: ConfirmedCredential[];
  client_setup: ClientSetup;
  original_agent3_spec: unknown;
  scope_modifications: ScopeModification[];
  build_directives: BuildDirective[];
}

export interface ContractOrchestratorResult {
  contract_status: ContractStatus;
  credential_status: CredentialStatus;
  client_setup: ClientSetup;
  scope_modifications: ScopeModification[];
  build_directives: BuildDirective[];
  agent_4_briefing: Agent4Briefing | null;  // null until ready_for_build
  ready_for_build: boolean;
}

// ============================================================================
// AGENT 6 SYNTHESIZED OUTPUT — CloseAndOnboardingOutput
// ============================================================================

export interface CloseAndOnboardingOutput {
  mode: 'pre_close' | 'post_close';
  pre_presentation_guide: PrePresentationGuide;
  post_presentation_debrief: PostPresentationDebrief | null;
  contract_status: ContractStatus | null;
  credential_status: CredentialStatus | null;
  client_setup: ClientSetup | null;
  scope_modifications: ScopeModification[];
  build_directives: BuildDirective[];
  agent_4_briefing: Agent4Briefing | null;
  ready_for_build: boolean;
  escalations: Array<{
    severity: 'P1' | 'P2' | 'P3';
    reason: string;
  }>;
}
