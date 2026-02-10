/**
 * Example: Agent 1 Research Workflow
 *
 * This example demonstrates how to use Agent 1's research capabilities
 * to gather real data about prospects before generating a target pack.
 *
 * The research workflow:
 * 1. Define prospects to research
 * 2. Agent 1 connects to research MCP servers
 * 3. Gathers data from web search, LinkedIn, reviews, social media
 * 4. Maps findings to 6-pillar framework
 * 5. Generates evidence-backed target pack
 */

import {
  runAgent1WithResearch,
  researchAndScoreCompany,
  getAvailableResearchTools,
} from "../app/api/agents/run/uptimize/agent-1-market-intelligence/agent";

// ============================================================================
// EXAMPLE 1: Research a batch of prospects
// ============================================================================

async function exampleBatchResearch() {
  console.log("=== Example 1: Batch Research ===\n");

  // Define prospects to research
  const prospects = [
    {
      name: "John Smith",
      company: "BlueWave Forwarding",
      domain: "bluewaveforwarding.com",
    },
    {
      name: "Sarah Chen",
      company: "Pinnacle Property Management",
      domain: "pinnaclepm.com",
    },
    {
      name: "Mike Johnson",
      company: "Solar Pros USA",
      domain: "solarprosusa.com",
    },
  ];

  // Run Agent 1 with research enabled
  const result = await runAgent1WithResearch(
    "Generate a target pack for freight forwarding and property management companies with operational pain",
    prospects,
    {
      mode: "Daily Target Pack",
      segment_override: ["operator_smb"],
      output_pack_size: 10,
    },
    "balanced"
  );

  if (result.success && result.data) {
    console.log("Target Pack Generated Successfully!\n");
    console.log(`Primary leads: ${result.data.target_pack_primary.length}`);
    console.log(`Secondary leads: ${result.data.target_pack_secondary?.length || 0}`);

    // Show first lead with research-backed evidence
    const topLead = result.data.target_pack_primary[0];
    if (topLead) {
      console.log("\n--- Top Lead (with research evidence) ---");
      console.log(`Company: ${topLead.company}`);
      console.log(`Fit Score: ${topLead.fit_score_0_100}/100`);
      console.log(`Shadow Ops Density: ${topLead.shadow_ops_density_0_10}/10`);
      console.log(`Pain Categories: ${topLead.pain_categories.join(", ")}`);
      console.log(`Exception Hypotheses: ${topLead.exception_hypotheses_top3.join("; ")}`);
      console.log(`Primary Hook: ${topLead.hooks.primary_hook_140_chars}`);
      console.log(`Pattern Interrupt: ${topLead.pattern_interrupt_question}`);
    }

    // Show shadow ops insights
    if (result.data.shadow_ops_insights) {
      console.log("\n--- Shadow Ops Insights ---");
      console.log(`Top signals: ${result.data.shadow_ops_insights.top_signals_found.join(", ")}`);
      console.log(`Exception patterns: ${result.data.shadow_ops_insights.common_exception_patterns.join(", ")}`);
    }
  } else {
    console.log("Failed:", result.message);
    if (result.error) {
      console.log("Error:", result.error.details);
    }
  }
}

// ============================================================================
// EXAMPLE 2: Research a single company in depth
// ============================================================================

async function exampleSingleCompanyResearch() {
  console.log("\n=== Example 2: Single Company Deep Research ===\n");

  const result = await researchAndScoreCompany(
    "BlueWave Forwarding",
    "bluewaveforwarding.com",
    {
      mode: "Segment Deep Dive",
    }
  );

  if (result.success) {
    console.log("Research Complete!\n");

    // Show research findings
    if (result.research) {
      console.log("--- Research Data ---");
      console.log(`Confidence: ${result.research.research_confidence}`);

      if (result.research.company_profile) {
        console.log(`\nCompany: ${result.research.company_profile.name}`);
        console.log(`Industry: ${result.research.company_profile.industry}`);
        console.log(`Size: ${result.research.company_profile.size_range}`);
      }

      console.log(`\nPain Signals Found: ${result.research.pain_signals.length}`);
      for (const ps of result.research.pain_signals.slice(0, 3)) {
        console.log(`  - [${ps.type}] "${ps.text.slice(0, 80)}..."`);
        console.log(`    Source: ${ps.source}`);
        if (ps.pillar_mapping) {
          console.log(`    Pillar: ${ps.pillar_mapping}`);
        }
      }

      console.log(`\nHiring Signals Found: ${result.research.hiring_signals.length}`);
      for (const hs of result.research.hiring_signals.slice(0, 3)) {
        console.log(`  - ${hs.job_title} [${hs.signal_type}]`);
      }

      console.log(`\n6-Pillar Analysis:`);
      console.log(`  Shadow Ops indicators: ${result.research.six_pillar_analysis.shadow_ops_indicators.length}`);
      console.log(`  Exception indicators: ${result.research.six_pillar_analysis.exception_indicators.length}`);
      console.log(`  Audit Trail indicators: ${result.research.six_pillar_analysis.audit_trail_indicators.length}`);
      console.log(`  Knowledge/Decisions indicators: ${result.research.six_pillar_analysis.knowledge_decision_indicators.length}`);
      console.log(`  Handoffs/SLAs indicators: ${result.research.six_pillar_analysis.handoff_sla_indicators.length}`);
      console.log(`  Channels/Evidence indicators: ${result.research.six_pillar_analysis.channel_evidence_indicators.length}`);

      console.log(`\nRecommended Angles: ${result.research.recommended_angles.join("; ")}`);

      if (result.research.research_gaps.length > 0) {
        console.log(`\nResearch Gaps: ${result.research.research_gaps.join("; ")}`);
      }
    }

    // Show generated lead
    if (result.lead) {
      console.log("\n--- Generated Lead Record ---");
      console.log(`Fit Score: ${result.lead.fit_score_0_100}/100`);
      console.log(`Primary Angle: ${result.lead.hooks.primary_hook_140_chars}`);
    }
  } else {
    console.log("Failed:", result.error);
  }
}

// ============================================================================
// EXAMPLE 3: List available research tools
// ============================================================================

function exampleListTools() {
  console.log("\n=== Example 3: Available Research Tools ===\n");

  const tools = getAvailableResearchTools();

  console.log("Research Servers:");
  for (const server of tools.servers) {
    console.log(`  - ${server}`);
  }

  console.log("\nTools by Category:");
  for (const [category, toolList] of Object.entries(tools.tools)) {
    console.log(`\n${category.toUpperCase()}:`);
    for (const tool of toolList) {
      console.log(`  - ${tool}`);
    }
  }
}

// ============================================================================
// EXAMPLE 4: Research workflow for specific industry (Freight Forwarder)
// ============================================================================

async function exampleFreightForwarderResearch() {
  console.log("\n=== Example 4: Freight Forwarder Industry Research ===\n");

  // Define freight forwarder prospects
  const freightProspects = [
    {
      name: "Marcus Rodriguez",
      company: "BlueWave Forwarding",
      domain: "bluewaveforwarding.com",
    },
    {
      name: "Lisa Wang",
      company: "Pacific Trade Logistics",
      domain: "pacifictradelogistics.com",
    },
    {
      name: "Tom Anderson",
      company: "Midwest Freight Solutions",
      domain: "midwestfreight.com",
    },
  ];

  // Custom pain categories for freight industry
  const freightPainCategories = [
    "Container tracking chaos",
    "Customs documentation delays",
    "Carrier coordination friction",
    "Rate quote manual process",
    "POD collection gaps",
  ];

  // Custom trigger events for freight industry
  const freightTriggers = [
    "Opening new trade lane",
    "Peak season preparation",
    "Carrier rate renegotiation",
    "New compliance requirement",
    "Customer SLA breach",
  ];

  const result = await runAgent1WithResearch(
    "Generate a target pack for freight forwarding companies struggling with operational visibility and exception handling",
    freightProspects,
    {
      mode: "Segment Deep Dive",
      custom_pain_categories: freightPainCategories,
      custom_trigger_events: freightTriggers,
      output_pack_size: 10,
    },
    "balanced"
  );

  if (result.success && result.data) {
    console.log("Freight Forwarder Target Pack Generated!\n");

    console.log("Angle of the Day:", result.data.angle_of_the_day?.primary_angle);
    console.log("Pattern Interrupt:", result.data.angle_of_the_day?.pattern_interrupt_question);

    console.log("\n--- Primary Targets ---");
    for (const lead of result.data.target_pack_primary) {
      console.log(`\n${lead.company} (Score: ${lead.fit_score_0_100}/100)`);
      console.log(`  Shadow Ops Density: ${lead.shadow_ops_density_0_10}/10`);
      console.log(`  Rationale: ${lead.shadow_ops_rationale}`);
      console.log(`  Exception Hypotheses:`);
      for (const eh of lead.exception_hypotheses_top3) {
        console.log(`    - ${eh}`);
      }
      console.log(`  Hook: ${lead.hooks.primary_hook_140_chars}`);
    }

    console.log("\n--- Shadow Ops Insights ---");
    if (result.data.shadow_ops_insights) {
      console.log("Top signals in this industry:");
      for (const signal of result.data.shadow_ops_insights.top_signals_found) {
        console.log(`  - ${signal}`);
      }
      console.log("\nCommon exception patterns:");
      for (const pattern of result.data.shadow_ops_insights.common_exception_patterns) {
        console.log(`  - ${pattern}`);
      }
    }
  } else {
    console.log("Failed:", result.message);
  }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     UptimizeAI Agent 1 - Research Workflow Examples        ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // List available tools
  exampleListTools();

  // Note: Uncomment to run actual research (requires MCP servers to be running)
  // await exampleBatchResearch();
  // await exampleSingleCompanyResearch();
  // await exampleFreightForwarderResearch();

  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("To run actual research, ensure MCP servers are configured and");
  console.log("uncomment the research function calls in main().");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch(console.error);
