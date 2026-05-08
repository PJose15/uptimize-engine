/**
 * UptimizeAI Agent 1: Market Intelligence & Targeting
 * Entry point for the agent
 */

export { runAgent1MarketIntelligence, runAgent1WithResearch, runAgent1FromQuery, getAvailableResearchTools } from "./agent";
export { runAgent1SubAgent, type RunAgent1SubAgentConfig } from "./subagent-orchestrator";
export type { ResearchSpecialistResult } from "./subagents/1a-research-specialist";
export type { ScoringAnalystResult } from "./subagents/1b-scoring-analyst";
export * from "./types";
