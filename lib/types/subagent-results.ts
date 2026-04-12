/**
 * V2 Sub-Agent Result Types — all 26 sub-agent output interfaces
 */

// Pipeline agents 1-8
export interface ResearchSpecialistResult { companies: Array<{ name: string; vertical: string; signals: string[] }>; evidence_tier: string; }
export interface ScoringAnalystResult { scored_leads: Array<{ company: string; score: number; breakdown: Record<string, number> }>; }
export interface MessageArchitectResult { messages: Array<{ leadId: string; subject: string; body: string; angle: string }>; }
export interface PipelineManagerResult { bookings: Array<{ leadId: string; status: string; nextStep: string }>; nurture_entries: Array<{ leadId: string; category: string; reason: string }>; }
export interface DiscoveryConductorResult { audit_findings: Array<{ pillar: string; finding: string; estimated_usd: number }>; exceptions: Array<{ type: string; severity: string }>; }
export interface ProposalWriterResult { proposal_text: string; pricing_tiers: Array<{ name: string; monthly_usd: number; includes: string[] }>; sow_draft: string; }
export interface SpecDesignerResult { workflows: Array<{ name: string; steps: string[] }>; integrations: Array<{ name: string; config: Record<string, unknown> }>; }
export interface QAEngineerResult { test_results: Array<{ workflow: string; passed: boolean; issues: string[] }>; deployment_ready: boolean; }
export interface HealthAnalystResult { health_score: number; dimensions: Record<string, number>; risk_factors: string[]; quick_wins: string[]; }
export interface WinReporterResult { report_text: string; proof_assets: Array<{ type: string; content: string }>; expansion_ready: boolean; }
export interface PresentationCoachResult { presentation_guide: string; objection_responses: Record<string, string>; close_strategy: string; }
export interface ContractOrchestratorResult { sow_final: string; credential_checklist: Array<{ item: string; collected: boolean }>; onboarding_sequence: string[]; }
export interface SignalMonitorResult { signals: Array<{ leadId: string; signal_type: string; strength: number }>; readiness_updates: Array<{ leadId: string; score: number }>; }
export interface SequenceManagerResult { touch_plans: Array<{ leadId: string; touches: Array<{ day: number; channel: string; content: string }> }>; }
export interface PatternCollectorResult { patterns: Array<{ key: string; value: string; significance: string; data_points: number }>; contradictions: Array<{ key: string; existing: string; new_value: string }>; }
export interface PlaybookUpdaterResult { updates_applied: Array<{ key: string; old_value: string; new_value: string }>; distributions_created: number; }

// Operational agents 9-13
export interface PortfolioMonitorResult { portfolio_summary: Record<string, unknown>; at_risk_clients: string[]; }
export interface FinancialMetricsResult { mrr: number; arr: number; at_risk_revenue: number; expansion_pipeline: number; }
export interface ResearchFinderResult { content_opportunities: Array<{ topic: string; source: string; angle: string }>; }
export interface DrafterPublisherResult { drafts: Array<{ content_type: string; text: string; platform: string }>; }
export interface ProspectResearchResult { prospects: Array<{ company: string; opportunity: string; estimated_value: number }>; }
export interface BDPipelineManagerResult { pipeline_updates: Array<{ id: string; stage: string; next_action: string }>; }
export interface ComplianceTrackerResult { alerts: Array<{ clientId: string; type: string; days_until: number }>; }
export interface InvoiceManagerResult { invoices_generated: Array<{ clientId: string; amount: number; due_date: string }>; follow_ups: Array<{ invoiceId: string; action: string }>; }
export interface CalendarIntelligenceResult { daily_brief: string; call_preps: Array<{ client: string; context: string; objectives: string[] }>; }
export interface DeliverableTrackerResult { commitments: Array<{ id: string; status: string; due: string }>; overdue: string[]; }
