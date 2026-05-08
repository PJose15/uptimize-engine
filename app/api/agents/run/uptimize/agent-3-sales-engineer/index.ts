/**
 * UptimizeAI Agent 3: Sales Engineer & Offer Architect
 * Entry point for the agent
 */

export { runAgent3SalesEngineer } from "./agent";
export { runAgent3SubAgent, type RunAgent3SubAgentConfig } from "./subagent-orchestrator";
export type { DiscoveryConductorResult, DiscoveryConductorInput } from "./subagents/3a-discovery-conductor";
export type { ProposalWriterResult } from "./subagents/3b-proposal-writer";
export * from "./types";
