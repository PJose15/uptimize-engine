/**
 * V2 Model Configuration & Task Profile Registry
 *
 * Single source of truth for all model aliases and task-to-model mappings.
 * No hardcoded model strings should exist outside this file.
 */

// ============================================================================
// MODEL ALIASES (5 tiers, env-overridable)
// ============================================================================

export type ModelTier = 'FAST' | 'BALANCED' | 'QUALITY' | 'MINI' | 'RESEARCH';

export const MODELS: Record<ModelTier, string> = {
  FAST:     process.env.MODEL_FAST     || 'gemini-2.0-flash',
  BALANCED: process.env.MODEL_BALANCED || 'claude-sonnet-4-20250514',
  QUALITY:  process.env.MODEL_QUALITY  || 'claude-opus-4-20250514',
  MINI:     process.env.MODEL_MINI     || 'gpt-4o-mini',
  RESEARCH: process.env.MODEL_RESEARCH || 'sonar-pro',
};

// ============================================================================
// TASK PROFILES — every sub-agent/task maps to a tier
// ============================================================================

export const TASK_PROFILES = {
  // FAST tier — high-volume, low-stakes
  shadow_ops_research:     'FAST',
  signal_scoring:          'FAST',
  competitor_signal_scan:  'FAST',
  portfolio_monitoring:    'FAST',
  calendar_intelligence:   'FAST',
  social_signal_check:     'FAST',
  hiring_signal_analysis:  'FAST',

  // RESEARCH tier — Perplexity web search
  research_supplement:     'RESEARCH',

  // BALANCED tier — core pipeline work
  health_analysis:         'BALANCED',
  discovery_audit:         'BALANCED',
  pattern_collection:      'BALANCED',
  signal_monitoring:       'BALANCED',
  financial_metrics:       'BALANCED',
  prospect_research:       'BALANCED',
  pipeline_stage_mgmt:     'BALANCED',
  sequence_management:     'BALANCED',
  exception_classification:'BALANCED',
  bd_prospect_analysis:    'BALANCED',
  revenue_analysis:        'BALANCED',

  // QUALITY tier — client-facing outputs
  proposal_writing:        'QUALITY',
  win_report:              'QUALITY',
  presentation_coaching:   'QUALITY',
  sow_generation:          'QUALITY',
  content_drafting:        'QUALITY',
  playbook_updating:       'QUALITY',
  close_coaching:          'QUALITY',
  objection_response:      'QUALITY',

  // MINI tier — simple structured tasks
  pipeline_stage_update:   'MINI',
  nurture_scheduling:      'MINI',
  invoice_generation:      'MINI',
  commitment_capture:      'MINI',
  credential_validation:   'MINI',
  cost_aggregation:        'MINI',
  compliance_check:        'MINI',
  schedule_generation:     'MINI',
} as const satisfies Record<string, ModelTier>;

export type TaskProfile = keyof typeof TASK_PROFILES;

// ============================================================================
// FALLBACK WATERFALLS per tier
// ============================================================================

export const FALLBACK_CHAINS: Record<ModelTier, string[]> = {
  FAST:     ['gemini-2.0-flash', 'llama-3.1-8b-instant', 'gpt-4o-mini', 'claude-3-5-haiku-20241022'],
  BALANCED: ['claude-sonnet-4-20250514', 'gpt-4o', 'gemini-2.5-pro', 'mistral-large-latest'],
  QUALITY:  ['claude-opus-4-20250514', 'gpt-4o', 'gemini-2.5-pro', 'mistral-large-latest'],
  MINI:     ['gpt-4o-mini', 'llama-3.1-70b-versatile', 'gemini-2.0-flash', 'claude-3-5-haiku-20241022'],
  RESEARCH: ['sonar-pro'],
};

// ============================================================================
// MODEL → PROVIDER mapping
// ============================================================================

export type V2ProviderName = 'anthropic' | 'openai' | 'gemini' | 'groq' | 'mistral' | 'perplexity';

export const MODEL_TO_PROVIDER: Record<string, V2ProviderName> = {
  // Anthropic
  'claude-opus-4-20250514':     'anthropic',
  'claude-sonnet-4-20250514':   'anthropic',
  'claude-3-5-haiku-20241022':  'anthropic',

  // OpenAI
  'gpt-4o':      'openai',
  'gpt-4o-mini': 'openai',

  // Gemini
  'gemini-2.0-flash': 'gemini',
  'gemini-2.5-flash': 'gemini',
  'gemini-2.5-pro':   'gemini',

  // Groq
  'llama-3.1-8b-instant':    'groq',
  'llama-3.1-70b-versatile': 'groq',

  // Mistral
  'mistral-large-latest': 'mistral',
  'mistral-small-latest': 'mistral',

  // Perplexity
  'sonar-pro': 'perplexity',
  'sonar':     'perplexity',
};

// ============================================================================
// PRICING (per 1M tokens)
// ============================================================================

export interface ModelPricing {
  input: number;
  output: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-20250514':     { input: 15.0,   output: 75.0 },
  'claude-sonnet-4-20250514':   { input: 3.0,    output: 15.0 },
  'claude-3-5-haiku-20241022':  { input: 0.80,   output: 4.0 },
  'gpt-4o':                     { input: 2.50,   output: 10.0 },
  'gpt-4o-mini':                { input: 0.15,   output: 0.60 },
  'gemini-2.0-flash':           { input: 0.075,  output: 0.30 },
  'gemini-2.5-flash':           { input: 0.075,  output: 0.30 },
  'gemini-2.5-pro':             { input: 1.25,   output: 10.0 },
  'llama-3.1-8b-instant':       { input: 0.05,   output: 0.08 },
  'llama-3.1-70b-versatile':    { input: 0.59,   output: 0.79 },
  'mistral-large-latest':       { input: 2.0,    output: 6.0 },
  'mistral-small-latest':       { input: 0.20,   output: 0.60 },
  'sonar-pro':                  { input: 3.0,    output: 15.0 },
  'sonar':                      { input: 1.0,    output: 1.0 },
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the model string for a task profile.
 * Returns the tier's primary model alias.
 */
export function getModelForTask(taskProfile: TaskProfile): string {
  const tier = TASK_PROFILES[taskProfile];
  return MODELS[tier];
}

/**
 * Get the tier for a task profile.
 */
export function getTaskTier(taskProfile: TaskProfile): ModelTier {
  return TASK_PROFILES[taskProfile];
}

/**
 * Get the fallback chain for a task profile.
 */
export function getFallbackChain(taskProfile: TaskProfile): string[] {
  const tier = TASK_PROFILES[taskProfile];
  return FALLBACK_CHAINS[tier];
}

/**
 * Get the provider for a specific model.
 */
export function getProviderForModel(model: string): V2ProviderName | null {
  return MODEL_TO_PROVIDER[model] ?? null;
}

/**
 * Estimate cost for a model call.
 */
export function estimateModelCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  const cost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
  return Number(cost.toFixed(6));
}

/**
 * Valid model ids per mode for callers pinned to a single provider.
 *
 * The tier aliases in MODELS span providers — FAST is a Gemini model — so a
 * component that constructs an Anthropic client cannot use them directly. This
 * gives those callers ids that exist in MODEL_TO_PROVIDER and MODEL_PRICING,
 * rather than each hardcoding its own guess.
 */
export const ANTHROPIC_MODE_MODELS: Record<'fast' | 'balanced' | 'quality', string> = {
  fast:     'claude-3-5-haiku-20241022',
  balanced: 'claude-sonnet-4-20250514',
  quality:  'claude-opus-4-20250514',
};

/** Whether a model id is known to the registry (provider + pricing). */
export function isKnownModel(model: string): boolean {
  return model in MODEL_TO_PROVIDER && model in MODEL_PRICING;
}
