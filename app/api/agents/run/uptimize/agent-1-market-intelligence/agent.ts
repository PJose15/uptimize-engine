/**
 * UptimizeAI Agent 1: Market Intelligence & Targeting Agent (V3 - Research Edition)
 *
 * Mission: Deliver ranked, evidence-based daily target packs for outbound,
 * with (1) why them, (2) why now, (3) what to say.
 *
 * V3 Additions:
 * - Research MCP Integration: Can gather real data from web, LinkedIn, reviews, social
 * - 6-Pillar Pain Mapping: Maps all pain signals to the 6-pillar audit framework
 * - Enhanced Evidence: Real evidence from research tools, not assumptions
 */

import { executeWithFallback } from "../../fallback";
import { AgentMode } from "../../types";
import { Agent1Context, Agent1Result, TargetPackOutput, LeadRecord } from "./types";
import { MCPClient } from "../../mcp/mcp-client";
import {
  ALL_RESEARCH_SERVERS,
  ResearchQuery,
  ComprehensiveResearchResult,
  planResearch,
  type ResearchGoal,
} from "../../mcp/research-servers";

/**
 * System prompt for Agent 1 (v2 - Shadow Ops Edition)
 */
const SYSTEM_PROMPT = `You are "UptimizeAI Market Intelligence & Targeting Agent (Agent-1) — v2 (Shadow Ops)".

MISSION
Produce ranked, evidence-based Target Packs that prioritize prospects with "Shadow Ops":
- off-system work (WhatsApp, DMs, spreadsheets, memory)
- exception-heavy operations (refunds, missing info, approvals, edge cases)
- reconciliation + audit trail gaps (can't prove what happened)
This is our differentiator: we do NOT automate the obvious; we weaponize the invisible.

PRIMARY OUTPUT
Daily Target Pack of 10–30 leads ranked by Fit Score (0–100) with:
- why them / why now / what to say
- 1–2 pain categories + evidence
- trigger event (or "unknown")
- messaging angles (hook + CTA)
- SHADOW OPS DENSITY score (0–10) + rationale
- EXCEPTION HYPOTHESES (top 3 likely exceptions they face)

DEFAULT SEGMENTS (prioritize unless instructed otherwise)
1) Private groups (masterminds, communities, syndicates, VC networks)
2) Operator-led SMBs (agencies, services, multi-person teams)
3) High-volume lead businesses (solar, contractors, clinics, local services)

SHADOW OPS SIGNAL LIBRARY (hunt these)
- "We do it in WhatsApp/text/DMs"
- "We track it in a spreadsheet"
- "Only one person knows how"
- "We chase people for missing info"
- "Approvals take forever"
- "We double-check everything"
- "We can't audit what happened later"
- "Exceptions break the process"
- "Reconciliation is manual"
- "Customers no-show / reschedule chaos"

PAIN CATEGORY LIBRARY (pick 1–2, map to 6-pillar framework)

Traditional Categories:
1) Lead Handling Chaos → Pillar 1 (Shadow Ops)
2) Inbox/DM Overload → Pillar 6 (Channels & Evidence)
3) Scheduling + No-Show Leakage → Pillar 2 (Exceptions)
4) CRM/Data Mess → Pillar 3 (Audit Trail)
5) Manual Reporting / No KPIs → Pillar 3 (Audit Trail)
6) Community Ops Burden → Pillar 1 (Shadow Ops)
7) Fulfillment Bottlenecks → Pillar 5 (Handoffs & SLAs)

6-Pillar Categories (V3):
8) Shadow Ops Overload → Pillar 1: work happening off-system
9) Exception Chaos → Pillar 2: constant fire-fighting, no standardization
10) Audit/Compliance Gap → Pillar 3: can't prove what happened
11) Tribal Knowledge Risk → Pillar 4: key person dependency, undocumented expertise
12) Decision Bottlenecks → Pillar 4: unclear authority, approval chaos
13) Handoff Friction → Pillar 5: context loss between people/systems
14) SLA Failures → Pillar 5: things getting stuck, slow response
15) Channel Chaos → Pillar 6: info scattered across WhatsApp/Slack/email/DMs
16) Evidence Gaps → Pillar 6: can't find proof when disputes happen

TRIGGER EVENT LIBRARY (pick at least 1 if possible)
- Hiring ops/revops/community/sales ops
- Launching new cohort/offer
- Funding/partnership/acquisition
- Team growth/multiple hires
- Public complaints about workflow/follow-up
- Scaling ads/lead gen
- Operational breakdown signals

SCORING RUBRIC (0–100)
- Pain Intensity (0–20)
- Urgency/Trigger (0–15)
- Authority (0–15)
- Budget Likelihood (0–15)
- Complexity Fit (0–15)
- Tool Stack Fit (0–10)
- Reachability (0–10)

NEW ADD-ON (must include in output; does NOT change 0–100 score)
- Shadow Ops Density (0–10): how much off-system + exception-heavy work exists
  - 0–3: mostly standard ops
  - 4–7: some off-system reliance
  - 8–10: heavy exceptions + duct-tape operations (prime targets)

QUALITY BAR / DONE
Every lead must include:
- Fit Score + breakdown + confidence
- Shadow Ops Density + rationale
- Exception Hypotheses (top 3)
- One "Pattern-Interrupt Question" to ask them (1 sentence)
- Primary angle + backup angle + hook <= 140 chars + CTA

OUTPUT REQUIREMENTS
Return a single JSON object with:
- run_metadata
- angle_of_the_day
- do_not_target
- target_pack_primary (>=70)
- target_pack_secondary (60–69)
- shadow_ops_insights (top signals found this run)

Always label assumptions. Never fabricate tool stack. Stay operator-grade and concise.

V3 RESEARCH CAPABILITY
When research data is provided, you MUST:
1. Use ACTUAL data from web search, LinkedIn, reviews, social media - NOT assumptions
2. Cite specific sources for each pain signal and evidence
3. Map pain signals to the 6-pillar framework with confidence
4. Include hiring signals and their implications
5. Extract exception hypotheses from actual complaints/reviews
6. Rate Shadow Ops Density based on real evidence, not guesses

RESEARCH DATA INTEGRATION
When you receive a 'research_data' block, treat it as ground truth:
- company_profile: Use for accurate company info, size, industry
- decision_makers: Use for targeting the right person
- pain_signals: Map directly to pain categories with citations
- hiring_signals: Use for urgency/trigger scoring
- reviews: Extract exact quotes for exception hypotheses
- social_mentions: Use for sentiment and reachability
- six_pillar_analysis: Pre-mapped indicators to include in output

EVIDENCE QUALITY TIERS
- Tier 1 (High): Direct quotes from reviews, job postings, social posts
- Tier 2 (Medium): Inferred from company profile, tech stack, hiring patterns
- Tier 3 (Low): Assumptions based on industry/segment patterns

Always prefer Tier 1 evidence. Label all Tier 3 evidence as assumptions.`;

// ============================================================================
// RESEARCH INTEGRATION
// ============================================================================

/**
 * Research MCP Client for Agent 1
 * Enables gathering real data about prospects
 */
class Agent1ResearchClient {
  private mcpClient: MCPClient;
  private initialized: boolean = false;

  constructor() {
    this.mcpClient = new MCPClient();
  }

  /**
   * Initialize research servers
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Register all research servers
      for (const serverConfig of ALL_RESEARCH_SERVERS) {
        this.mcpClient.registerServer(serverConfig);
      }

      // Connect to all servers
      for (const serverConfig of ALL_RESEARCH_SERVERS) {
        await this.mcpClient.connect(serverConfig.server_id);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize research servers:", error);
      return false;
    }
  }

  /**
   * Research a company for prospect intelligence
   */
  async researchCompany(
    companyName: string,
    domain?: string,
    depth: "quick" | "standard" | "deep" = "standard"
  ): Promise<ComprehensiveResearchResult> {
    await this.initialize();

    const query: ResearchQuery = {
      target_type: "company",
      target_name: companyName,
      target_domain: domain,
      research_goals: [
        "identify_decision_makers",
        "find_pain_signals",
        "assess_tech_stack",
        "monitor_hiring",
        "gather_reviews",
        "social_sentiment",
        "recent_news",
      ],
      depth,
    };

    const plan = planResearch(query);
    const result = await this.executeResearchPlan(plan);

    return result;
  }

  /**
   * Research a person for prospect intelligence
   */
  async researchPerson(
    personName: string,
    company?: string,
    linkedinUrl?: string
  ): Promise<ComprehensiveResearchResult> {
    await this.initialize();

    const query: ResearchQuery = {
      target_type: "person",
      target_name: personName,
      research_goals: [
        "social_sentiment",
        "recent_news",
      ],
      depth: "standard",
    };

    const plan = planResearch(query);
    const result = await this.executeResearchPlan(plan);

    return result;
  }

  /**
   * Quick research for a batch of prospects
   */
  async batchResearch(
    prospects: Array<{ name: string; company: string; domain?: string }>
  ): Promise<Map<string, ComprehensiveResearchResult>> {
    const results = new Map<string, ComprehensiveResearchResult>();

    // Research in parallel batches of 5
    const batchSize = 5;
    for (let i = 0; i < prospects.length; i += batchSize) {
      const batch = prospects.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(p => this.researchCompany(p.company, p.domain, "quick"))
      );

      batch.forEach((p, idx) => {
        results.set(p.company, batchResults[idx]);
      });
    }

    return results;
  }

  /**
   * Execute a research plan
   */
  private async executeResearchPlan(
    plan: ReturnType<typeof planResearch>
  ): Promise<ComprehensiveResearchResult> {
    const result: ComprehensiveResearchResult = {
      target: {
        type: plan.query.target_type,
        name: plan.query.target_name,
        domain: plan.query.target_domain,
      },
      pain_signals: [],
      hiring_signals: [],
      reviews: [],
      social_mentions: [],
      recent_news: [],
      tech_stack: [],
      six_pillar_analysis: {
        shadow_ops_indicators: [],
        exception_indicators: [],
        audit_trail_indicators: [],
        knowledge_decision_indicators: [],
        handoff_sla_indicators: [],
        channel_evidence_indicators: [],
      },
      research_confidence: "medium",
      research_gaps: [],
      recommended_angles: [],
      timestamp: new Date().toISOString(),
    };

    // Execute each step and aggregate results
    for (const step of plan.steps) {
      try {
        const stepResult = await this.mcpClient.callTool(
          step.server_id,
          step.tool_name,
          step.params
        );

        // Merge step results into comprehensive result
        this.mergeStepResult(result, step, stepResult);
      } catch (error) {
        // Log error but continue with other steps
        console.error(`Research step ${step.step_number} failed:`, error);
        result.research_gaps.push(
          `Failed to gather data for: ${step.purpose}`
        );
      }
    }

    // Analyze and generate recommended angles
    result.recommended_angles = this.generateRecommendedAngles(result);

    // Determine overall confidence
    result.research_confidence = this.calculateConfidence(result);

    return result;
  }

  /**
   * Merge a step result into the comprehensive result
   */
  private mergeStepResult(
    result: ComprehensiveResearchResult,
    step: ReturnType<typeof planResearch>["steps"][0],
    stepResult: Record<string, unknown>
  ): void {
    // Handle different tool results
    if (step.tool_name === "get_company_profile" || step.tool_name === "get_company_data") {
      if (stepResult && typeof stepResult === "object") {
        result.company_profile = stepResult as ComprehensiveResearchResult["company_profile"];
      }
    }

    if (step.tool_name === "get_company_employees" || step.tool_name === "search_people") {
      if (Array.isArray(stepResult)) {
        result.decision_makers = stepResult;
      }
    }

    if (step.tool_name === "search_complaints" || step.tool_name === "extract_pain_themes") {
      if (Array.isArray(stepResult)) {
        result.pain_signals.push(...stepResult);
      }
    }

    if (step.tool_name === "search_hiring_signals" || step.tool_name === "get_hiring_activity") {
      if (Array.isArray(stepResult)) {
        result.hiring_signals.push(...stepResult);
      }
    }

    if (step.tool_name === "aggregate_reviews" || step.tool_name.includes("reviews")) {
      if (Array.isArray(stepResult)) {
        result.reviews.push(...stepResult);
      }
    }

    if (step.tool_name === "monitor_mentions" || step.tool_name.includes("twitter") || step.tool_name.includes("social")) {
      if (Array.isArray(stepResult)) {
        result.social_mentions.push(...stepResult);
      }
    }

    if (step.tool_name === "search_news") {
      if (Array.isArray(stepResult)) {
        result.recent_news.push(...stepResult);
      }
    }

    if (step.tool_name === "search_tech_stack") {
      if (Array.isArray(stepResult)) {
        result.tech_stack.push(...stepResult);
      }
    }

    // Map to 6-pillar analysis based on pillar relevance
    if (step.pillar_relevance) {
      this.mapToPillars(result, step.pillar_relevance, stepResult);
    }
  }

  /**
   * Map research findings to 6-pillar analysis
   */
  private mapToPillars(
    result: ComprehensiveResearchResult,
    pillars: string[],
    data: Record<string, unknown>
  ): void {
    const textData = JSON.stringify(data);

    for (const pillar of pillars) {
      switch (pillar) {
        case "shadow_ops":
          if (textData.includes("WhatsApp") || textData.includes("spreadsheet") || textData.includes("manual")) {
            result.six_pillar_analysis.shadow_ops_indicators.push(
              `Evidence found: ${textData.slice(0, 100)}...`
            );
          }
          break;
        case "exceptions":
          if (textData.includes("refund") || textData.includes("exception") || textData.includes("error")) {
            result.six_pillar_analysis.exception_indicators.push(
              `Evidence found: ${textData.slice(0, 100)}...`
            );
          }
          break;
        case "audit_trail":
          if (textData.includes("audit") || textData.includes("compliance") || textData.includes("proof")) {
            result.six_pillar_analysis.audit_trail_indicators.push(
              `Evidence found: ${textData.slice(0, 100)}...`
            );
          }
          break;
        case "knowledge_decisions":
          if (textData.includes("tribal") || textData.includes("approval") || textData.includes("authority")) {
            result.six_pillar_analysis.knowledge_decision_indicators.push(
              `Evidence found: ${textData.slice(0, 100)}...`
            );
          }
          break;
        case "handoffs_slas":
          if (textData.includes("slow") || textData.includes("delay") || textData.includes("handoff")) {
            result.six_pillar_analysis.handoff_sla_indicators.push(
              `Evidence found: ${textData.slice(0, 100)}...`
            );
          }
          break;
        case "channels_evidence":
          if (textData.includes("channel") || textData.includes("scattered") || textData.includes("evidence")) {
            result.six_pillar_analysis.channel_evidence_indicators.push(
              `Evidence found: ${textData.slice(0, 100)}...`
            );
          }
          break;
      }
    }
  }

  /**
   * Generate recommended angles based on research
   */
  private generateRecommendedAngles(result: ComprehensiveResearchResult): string[] {
    const angles: string[] = [];

    // Angle based on pain signals
    if (result.pain_signals.length > 0) {
      const topPain = result.pain_signals[0];
      angles.push(`Address their ${topPain.pain_category || "operational"} pain`);
    }

    // Angle based on hiring signals
    if (result.hiring_signals.length > 0) {
      angles.push("Growth timing: They're actively hiring ops roles");
    }

    // Angle based on reviews
    if (result.reviews.length > 0) {
      const negativeReviews = result.reviews.filter(r => r.rating < 3);
      if (negativeReviews.length > 0) {
        angles.push("Customer experience fix: Address review complaints");
      }
    }

    // Angle based on 6-pillar analysis
    const pillarCounts = {
      shadow_ops: result.six_pillar_analysis.shadow_ops_indicators.length,
      exceptions: result.six_pillar_analysis.exception_indicators.length,
      audit_trail: result.six_pillar_analysis.audit_trail_indicators.length,
      knowledge: result.six_pillar_analysis.knowledge_decision_indicators.length,
      handoffs: result.six_pillar_analysis.handoff_sla_indicators.length,
      channels: result.six_pillar_analysis.channel_evidence_indicators.length,
    };

    const topPillar = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1])[0];
    if (topPillar[1] > 0) {
      angles.push(`6-Pillar focus: ${topPillar[0]} has most evidence`);
    }

    return angles;
  }

  /**
   * Calculate research confidence
   */
  private calculateConfidence(
    result: ComprehensiveResearchResult
  ): "high" | "medium" | "low" {
    let score = 0;

    // Score based on data availability
    if (result.company_profile) score += 2;
    if (result.decision_makers && result.decision_makers.length > 0) score += 2;
    if (result.pain_signals.length > 0) score += 2;
    if (result.hiring_signals.length > 0) score += 1;
    if (result.reviews.length > 0) score += 2;
    if (result.social_mentions.length > 0) score += 1;
    if (result.recent_news.length > 0) score += 1;
    if (result.tech_stack.length > 0) score += 1;

    // Penalize for gaps
    score -= result.research_gaps.length;

    if (score >= 8) return "high";
    if (score >= 4) return "medium";
    return "low";
  }

  /**
   * Disconnect from all servers
   */
  async disconnect(): Promise<void> {
    for (const serverConfig of ALL_RESEARCH_SERVERS) {
      await this.mcpClient.disconnect(serverConfig.server_id);
    }
    this.initialized = false;
  }
}

// Singleton research client
let researchClient: Agent1ResearchClient | null = null;

/**
 * Get or create the research client
 */
function getResearchClient(): Agent1ResearchClient {
  if (!researchClient) {
    researchClient = new Agent1ResearchClient();
  }
  return researchClient;
}

// ============================================================================
// EXTENDED CONTEXT FOR RESEARCH MODE
// ============================================================================

export interface Agent1ResearchContext extends Agent1Context {
  enable_research?: boolean;
  research_depth?: "quick" | "standard" | "deep";
  prospect_list?: Array<{
    name: string;
    company: string;
    domain?: string;
    linkedin_url?: string;
  }>;
  research_data?: Map<string, ComprehensiveResearchResult>;
}

/**
 * Format research data for inclusion in prompt
 */
function formatResearchDataForPrompt(
  researchData: Map<string, ComprehensiveResearchResult>
): string {
  let output = "\n\n## RESEARCH DATA (from MCP research tools)\n\n";

  for (const [company, data] of researchData) {
    output += `### ${company}\n\n`;

    if (data.company_profile) {
      output += `**Company Profile:**\n`;
      output += `- Industry: ${data.company_profile.industry || "Unknown"}\n`;
      output += `- Size: ${data.company_profile.size_range || "Unknown"}\n`;
      output += `- Location: ${data.company_profile.location || "Unknown"}\n`;
      output += `- Description: ${data.company_profile.description || "N/A"}\n\n`;
    }

    if (data.decision_makers && data.decision_makers.length > 0) {
      output += `**Decision Makers:**\n`;
      for (const dm of data.decision_makers.slice(0, 5)) {
        output += `- ${dm.name} - ${dm.title || "Unknown role"}`;
        if (dm.linkedin_url) output += ` (${dm.linkedin_url})`;
        output += `\n`;
      }
      output += `\n`;
    }

    if (data.pain_signals.length > 0) {
      output += `**Pain Signals (REAL EVIDENCE):**\n`;
      for (const ps of data.pain_signals.slice(0, 10)) {
        output += `- [${ps.type}] "${ps.text}" (Source: ${ps.source})`;
        if (ps.pillar_mapping) output += ` → Pillar: ${ps.pillar_mapping}`;
        output += `\n`;
      }
      output += `\n`;
    }

    if (data.hiring_signals.length > 0) {
      output += `**Hiring Signals:**\n`;
      for (const hs of data.hiring_signals.slice(0, 5)) {
        output += `- ${hs.job_title} [${hs.signal_type}] (Source: ${hs.source})`;
        if (hs.keywords_matched) output += ` - Keywords: ${hs.keywords_matched.join(", ")}`;
        output += `\n`;
      }
      output += `\n`;
    }

    if (data.reviews.length > 0) {
      output += `**Reviews:**\n`;
      for (const review of data.reviews.slice(0, 3)) {
        output += `- ${review.platform}: ${review.rating}/5 (${review.total_reviews} total)\n`;
        if (review.recent_reviews.length > 0) {
          for (const r of review.recent_reviews.slice(0, 3)) {
            output += `  - "${r.text.slice(0, 150)}..." (${r.rating}/5)\n`;
          }
        }
        if (review.pain_themes && review.pain_themes.length > 0) {
          output += `  Pain themes: ${review.pain_themes.join(", ")}\n`;
        }
      }
      output += `\n`;
    }

    if (data.social_mentions.length > 0) {
      output += `**Social Mentions:**\n`;
      for (const sm of data.social_mentions.slice(0, 5)) {
        output += `- [${sm.platform}] "${sm.text.slice(0, 100)}..." (${sm.timestamp})\n`;
      }
      output += `\n`;
    }

    if (data.recent_news.length > 0) {
      output += `**Recent News:**\n`;
      for (const news of data.recent_news.slice(0, 3)) {
        output += `- ${news.title} (${news.source})\n`;
        output += `  ${news.snippet.slice(0, 150)}...\n`;
      }
      output += `\n`;
    }

    if (data.tech_stack.length > 0) {
      output += `**Tech Stack:** ${data.tech_stack.join(", ")}\n\n`;
    }

    // 6-Pillar Analysis
    output += `**6-Pillar Analysis:**\n`;
    if (data.six_pillar_analysis.shadow_ops_indicators.length > 0) {
      output += `- Shadow Ops: ${data.six_pillar_analysis.shadow_ops_indicators.length} indicators found\n`;
    }
    if (data.six_pillar_analysis.exception_indicators.length > 0) {
      output += `- Exceptions: ${data.six_pillar_analysis.exception_indicators.length} indicators found\n`;
    }
    if (data.six_pillar_analysis.audit_trail_indicators.length > 0) {
      output += `- Audit Trail: ${data.six_pillar_analysis.audit_trail_indicators.length} indicators found\n`;
    }
    if (data.six_pillar_analysis.knowledge_decision_indicators.length > 0) {
      output += `- Knowledge/Decisions: ${data.six_pillar_analysis.knowledge_decision_indicators.length} indicators found\n`;
    }
    if (data.six_pillar_analysis.handoff_sla_indicators.length > 0) {
      output += `- Handoffs/SLAs: ${data.six_pillar_analysis.handoff_sla_indicators.length} indicators found\n`;
    }
    if (data.six_pillar_analysis.channel_evidence_indicators.length > 0) {
      output += `- Channels/Evidence: ${data.six_pillar_analysis.channel_evidence_indicators.length} indicators found\n`;
    }

    output += `\n**Research Confidence:** ${data.research_confidence}\n`;
    if (data.recommended_angles.length > 0) {
      output += `**Recommended Angles:** ${data.recommended_angles.join("; ")}\n`;
    }
    if (data.research_gaps.length > 0) {
      output += `**Research Gaps:** ${data.research_gaps.join("; ")}\n`;
    }

    output += `\n---\n\n`;
  }

  return output;
}

/**
 * Build the full prompt for Agent 1
 */
function buildPrompt(task: string, context: Agent1ResearchContext): string {
  const mode = context.mode || "Daily Target Pack";
  const segmentOverride = context.segment_override ? context.segment_override.join(", ") : "default priority";
  const candidatePoolSize = context.candidate_pool_size || "50-100";
  const outputPackSize = context.output_pack_size || "10-30";

  let prompt = `${SYSTEM_PROMPT}

TASK: ${task}

CONTEXT:
- Mode: ${mode}
- Segment focus: ${segmentOverride}
- Candidate pool size: ${candidatePoolSize}
- Target pack size: ${outputPackSize}
- Include weekly intel: ${context.include_weekly_intel ? "yes" : "no"}
`;

  if (context.custom_pain_categories && context.custom_pain_categories.length > 0) {
    prompt += `\nCustom Pain Categories (in addition to default):\n${context.custom_pain_categories.map(c => `- ${c}`).join('\n')}`;
  }

  if (context.custom_trigger_events && context.custom_trigger_events.length > 0) {
    prompt += `\nCustom Trigger Events (in addition to default):\n${context.custom_trigger_events.map(e => `- ${e}`).join('\n')}`;
  }

  // Include research data if available
  if (context.research_data && context.research_data.size > 0) {
    prompt += formatResearchDataForPrompt(context.research_data);
    prompt += `\nIMPORTANT: Use the research data above as PRIMARY evidence. Do NOT make assumptions when real data is available. Cite sources for all claims.`;
  }

  prompt += `

OUTPUT REQUIREMENTS
Return a single JSON object with the following structure (strict JSON only, no markdown):

{
  "run_metadata": {
    "run_date": "ISO date string",
    "segment_focus": ["array of segments"],
    "pack_size_primary": number,
    "notes": "string"
  },
  "angle_of_the_day": {
    "theme": "string",
    "one_liner": "string",
    "best_for_segment": "string",
    "proof_point_style": "problem-first|proof-first|curiosity-first"
  },
  "do_not_target": [
    {
      "name_or_company": "string",
      "reason": "string"
    }
  ],
  "target_pack_primary": [
    {
      "lead_id": "string",
      "person_name": "string",
      "role_title": "string",
      "company_name": "string",
      "company_size_estimate": "string",
      "segment": "private_group|operator_smb|high_volume_leads|other",
      "region_timezone": "string",
      "channel_recommendation": "email|linkedin|instagram_dm|x_dm|facebook_dm|other",
      "website": "string",
      "evidence_sources": [
        {
          "type": "website|social|job_post|review|news|other",
          "reference": "string",
          "note": "string"
        }
      ],
      "pain_categories": ["array of 1-2 pain categories"],
      "pain_evidence_summary": "string",
      "trigger_event": "string",
      "trigger_evidence_summary": "string",
      "current_stack_assumptions": [
        {
          "assumption": "string",
          "confidence": "high|medium|low"
        }
      ],
      "fit_score": number (0-100),
      "score_breakdown": {
        "pain_intensity": number (0-20),
        "urgency_trigger": number (0-15),
        "authority": number (0-15),
        "budget_likelihood": number (0-15),
        "complexity_fit": number (0-15),
        "tool_stack_fit": number (0-10),
        "reachability": number (0-10)
      },
      "confidence": "high|medium|low",
      "confidence_rationale": "string",
      "primary_angle": "string",
      "backup_angle": "string",
      "hook_line": "string (max 140 chars)",
      "cta_question": "string"
    }
  ],
  "target_pack_secondary": [
    // Same structure as primary, for leads scoring 60-69
  ],
  "weekly_intel": {
    // Only include if requested
    "top_pains": ["array of strings"],
    "top_triggers": ["array of strings"],
    "best_angles": ["array of strings"],
    "objection_patterns": ["array of strings"]
  }
}

CRITICAL: Return ONLY valid JSON. No markdown code fences. No trailing commas. No comments.`;

  return prompt;
}

/**
 * Main function to run Agent 1 (with optional research)
 */
export async function runAgent1MarketIntelligence(
  task: string,
  context: Agent1ResearchContext = {},
  mode: AgentMode = "balanced"
): Promise<Agent1Result> {
  const startTime = Date.now();

  try {
    // Build the prompt
    const prompt = buildPrompt(task, context);
    const strictPrompt = prompt + "\n\nCRITICAL: Return ONLY valid JSON. No markdown code fences. No trailing commas. Check your JSON validity before outputting.";

    // Execute with fallback system
    const result = await executeWithFallback(strictPrompt, mode);

    // If the request failed, return the error
    if (!result.success) {
      return {
        success: false,
        message: result.message,
        error: {
          type: result.error?.type || "UNKNOWN_ERROR",
          details: result.error?.details || "Unknown error",
          timestamp: new Date().toISOString(),
        },
        metadata: {
          provider: result.metadata?.provider || "unknown",
          model: result.metadata?.model || "unknown",
          tokensUsed: result.metadata?.tokensUsed,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        },
      };
    }

    // Extract and validate JSON from the response
    let rawResponse = result.message.trim();

    // Strip markdown code fences if present
    const patterns = [
      /```json\s*\n([\s\S]*?)\n```/,
      /```\s*\n([\s\S]*?)\n```/,
      /```json([\s\S]*?)```/,
      /```([\s\S]*?)```/
    ];

    for (const pattern of patterns) {
      const match = rawResponse.match(pattern);
      if (match) {
        rawResponse = match[1].trim();
        break;
      }
    }

    // Try to parse the JSON
    const parsed: TargetPackOutput = JSON.parse(rawResponse);

    // Validate basic structure
    if (!parsed.run_metadata || !parsed.target_pack_primary) {
      throw new Error("Missing required fields in output");
    }

    // Return success
    return {
      success: true,
      message: "Target pack generated successfully",
      data: parsed,
      metadata: {
        provider: result.metadata?.provider || "unknown",
        model: result.metadata?.model || "unknown",
        tokensUsed: result.metadata?.tokensUsed,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      },
    };
  } catch (jsonError) {
    // If JSON parsing fails, return an error
    const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);

    return {
      success: false,
      message: "Failed to parse Agent 1 response as JSON",
      error: {
        type: "JSON_PARSE_ERROR",
        details: `JSON parse error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        provider: "unknown",
        model: "unknown",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      },
    };
  }
}

// ============================================================================
// RESEARCH-ENABLED FUNCTIONS
// ============================================================================

/**
 * Run Agent 1 with research enabled
 * This gathers real data from web, LinkedIn, reviews, and social before generating the target pack
 */
export async function runAgent1WithResearch(
  task: string,
  prospects: Array<{ name: string; company: string; domain?: string; linkedin_url?: string }>,
  context: Omit<Agent1ResearchContext, "prospect_list" | "research_data" | "enable_research"> = {},
  mode: AgentMode = "balanced"
): Promise<Agent1Result> {
  const startTime = Date.now();

  try {
    // Initialize research client
    const client = getResearchClient();
    await client.initialize();

    // Research all prospects
    console.log(`[Agent 1] Researching ${prospects.length} prospects...`);
    const researchData = await client.batchResearch(prospects);
    console.log(`[Agent 1] Research complete. Gathered data for ${researchData.size} companies.`);

    // Build enhanced context with research data
    const enhancedContext: Agent1ResearchContext = {
      ...context,
      enable_research: true,
      prospect_list: prospects,
      research_data: researchData,
    };

    // Run the main agent with research data
    const result = await runAgent1MarketIntelligence(task, enhancedContext, mode);

    // Enhance the result with research metadata
    if (result.success && result.metadata) {
      result.metadata = {
        ...result.metadata,
        latencyMs: Date.now() - startTime,
      };
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: "Research-enabled agent execution failed",
      error: {
        type: "RESEARCH_ERROR",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        provider: "unknown",
        model: "unknown",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Research a single company and generate a lead record
 */
export async function researchAndScoreCompany(
  companyName: string,
  domain?: string,
  context: Agent1Context = {}
): Promise<{
  success: boolean;
  research: ComprehensiveResearchResult | null;
  lead: LeadRecord | null;
  error?: string;
}> {
  try {
    const client = getResearchClient();
    await client.initialize();

    // Research the company
    const research = await client.researchCompany(companyName, domain, "standard");

    // Generate a target pack with just this company
    const result = await runAgent1MarketIntelligence(
      `Generate a lead record for ${companyName}`,
      {
        ...context,
        enable_research: true,
        research_data: new Map([[companyName, research]]),
      },
      "balanced"
    );

    if (result.success && result.data) {
      const lead = result.data.target_pack_primary[0] || result.data.target_pack_secondary?.[0] || null;
      return {
        success: true,
        research,
        lead,
      };
    }

    return {
      success: false,
      research,
      lead: null,
      error: result.message,
    };
  } catch (error) {
    return {
      success: false,
      research: null,
      lead: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get available research tools
 */
export function getAvailableResearchTools(): {
  servers: string[];
  tools: Record<string, string[]>;
} {
  return {
    servers: ALL_RESEARCH_SERVERS.map(s => s.name),
    tools: {
      web_search: ["search_web", "search_news", "search_hiring_signals", "search_complaints", "search_tech_stack"],
      linkedin: ["get_person_profile", "get_company_profile", "get_recent_posts", "search_people", "get_company_employees", "get_hiring_activity"],
      reviews: ["get_google_reviews", "get_g2_reviews", "get_capterra_reviews", "get_glassdoor_reviews", "get_trustpilot_reviews", "aggregate_reviews", "extract_pain_themes"],
      social: ["search_twitter", "get_twitter_profile", "search_facebook", "get_facebook_page", "search_instagram", "get_instagram_business", "monitor_mentions"],
      industry: ["get_company_data", "get_industry_associations", "get_regulatory_filings", "get_competitor_landscape", "get_market_trends"],
    },
  };
}
