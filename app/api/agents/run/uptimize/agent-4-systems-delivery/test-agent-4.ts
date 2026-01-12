/**
 * Test Suite for Agent 4: Systems Builder & Delivery Orchestrator
 *
 * Run with: npx tsx app/api/agents/run/uptimize/agent-4-systems-delivery/test-agent-4.ts
 */

import { runAgent4SystemsDelivery } from "./agent";
import type { Agent4Context } from "./types";

// ========================================
// MOCK DATA
// ========================================

/**
 * Mock handoff specification from Agent 3
 */
const mockHandoffSpec = {
  buildModules: [
    "Lead Enrichment & Scoring",
    "Outbound Automation Engine",
    "Calendar Booking Integration",
    "CRM Data Sync",
  ],
  integrations: [
    "HubSpot CRM",
    "Apollo.io",
    "Clearbit",
    "Calendly",
    "Gmail API",
    "Slack Notifications",
  ],
  risks: [
    "API rate limits for Apollo.io (500 enrichments/day)",
    "Data quality dependent on lead input completeness",
    "Calendar availability sync delays (up to 5 minutes)",
    "Email deliverability affected by domain reputation",
  ],
  definitionOfDone: [
    "Lead enrichment completes within 5 minutes of new lead creation",
    "Outbound sequences achieve minimum 30% response rate",
    "Calendar bookings sync to HubSpot CRM within 2 minutes",
    "All workflows handle API failures gracefully with fallback modes",
    "Client team can operate system with 10-minute quickstart training",
    "KPI dashboard shows real-time metrics for response time and conversion",
  ],
  scopeReference: "SOW-2024-Q1-001-UptimizeAI",
  signedDate: "2024-01-15",
};

/**
 * Mock client tools and access constraints
 */
const mockClientTools = {
  available: [
    "HubSpot CRM (Professional tier)",
    "Gmail (Google Workspace Business)",
    "Calendly (Teams plan)",
    "Slack (Standard plan)",
    "Zapier (Professional plan)",
  ],
  restricted: [
    "LinkedIn Sales Navigator (pending license renewal)",
    "ZoomInfo (budget approval needed)",
  ],
  accessConstraints: [
    "No bulk email sends (>50 recipients) without director approval",
    "API rate limits: Apollo 500/day, Clearbit 1000/month, Calendly 10k/month",
    "Manual approval required for calendar bookings on deals >$50k ARR",
    "PII data must be encrypted at rest and in transit",
    "GDPR compliance required for all EU prospects",
  ],
};

/**
 * Mock business rules
 */
const mockBusinessRules = {
  operatingHours: "9:00 AM - 6:00 PM ET, Monday-Friday (excluding US holidays)",
  policies: [
    "GDPR compliant: honor opt-out requests within 24 hours",
    "CAN-SPAM compliant: include unsubscribe link in all emails",
    "No cold calling: email and LinkedIn outreach only",
    "All prospect interactions must be logged in HubSpot within 1 hour",
    "Security: 2FA required for all admin access",
  ],
  routingRules: [
    "SMB leads (<100 employees) → SDR Team A",
    "Mid-market (100-1000 employees) → SDR Team B with AE review",
    "Enterprise (>1000 employees) → Direct to AE Team with director notification",
    "International leads (non-US) → Regional specialist review",
    "High-value leads (>$100k ARR potential) → Immediate Slack alert to leadership",
  ],
  teamRoles: [
    {
      role: "SDR (Sales Development Rep)",
      responsibilities: [
        "Lead qualification and scoring",
        "Initial outbound sequences",
        "Discovery call scheduling",
        "CRM data hygiene",
      ],
      permissions: [
        "Read/Write: Leads, Contacts, Tasks",
        "Read-only: Opportunities, Quotes",
        "No access: Admin settings, User management",
      ],
    },
    {
      role: "AE (Account Executive)",
      responsibilities: [
        "Discovery and demo calls",
        "Proposal creation",
        "Negotiation and closing",
        "Account handoff to CS",
      ],
      permissions: [
        "Read/Write: Opportunities, Quotes, Contacts",
        "Read-only: Leads",
        "No access: Admin settings",
      ],
    },
    {
      role: "Operations Admin",
      responsibilities: [
        "System configuration and maintenance",
        "User permission management",
        "Reporting and analytics",
        "Integration troubleshooting",
      ],
      permissions: [
        "Full admin access",
        "System configuration",
        "User management",
        "API key management",
      ],
    },
  ],
};

// ========================================
// TEST CASES
// ========================================

async function testBasicDeliveryPackage() {
  console.log("\n========================================");
  console.log("TEST 1: Basic Delivery Package (Minimal Context)");
  console.log("========================================\n");

  const result = await runAgent4SystemsDelivery(
    "Create delivery package for lead enrichment and outbound automation system",
    {},
    "fast"
  );

  console.log("Success:", result.success);
  console.log("Message:", result.message);

  if (result.success && result.data) {
    console.log("\n--- Build Plan ---");
    console.log("Phase 1 Goal:", result.data.build_plan.phase_1.goal);
    console.log("Milestones:", result.data.build_plan.milestones.length);

    console.log("\n--- Data Model ---");
    console.log("Entities:", result.data.data_model.entities.length);
    console.log("Fields:", result.data.data_model.fields.length);
    console.log("Logging Fields:", result.data.data_model.logging_fields.length);

    console.log("\n--- Workflows ---");
    console.log("Total Workflows:", result.data.workflow_specs.length);
    result.data.workflow_specs.forEach((wf, idx) => {
      console.log(`  ${idx + 1}. ${wf.workflow_name}: ${wf.goal}`);
      console.log(`     Exception Paths: ${wf.exception_paths.length}`);
    });

    console.log("\n--- Agent Spec Sheets ---");
    console.log("Total Agents:", result.data.agent_spec_sheets.length);
    result.data.agent_spec_sheets.forEach((agent, idx) => {
      console.log(`  ${idx + 1}. ${agent.agent_name}: ${agent.purpose}`);
    });

    console.log("\n--- QA ---");
    console.log("Test Cases:", result.data.qa_plan_and_results.test_cases.length);
    console.log("Results Summary:", result.data.qa_plan_and_results.results_summary);

    console.log("\n--- Fallback Modes ---");
    console.log("Total Fallback Scenarios:", result.data.fallback_modes.length);

    console.log("\n--- Client Handoff Kit ---");
    console.log("Quickstart Steps:", result.data.client_handoff_kit.quickstart_5min.length);
    console.log("Daily SOP Steps:", result.data.client_handoff_kit.daily_sop.length);
    console.log("Training Sessions:", result.data.client_handoff_kit.training_plan.length);

    console.log("\n--- Post-Launch Monitoring ---");
    console.log("KPIs:", result.data.post_launch_monitoring.kpis.length);
    console.log("Alerts:", result.data.post_launch_monitoring.alerts.length);
  }

  if (result.metadata) {
    console.log("\n--- Metadata ---");
    console.log("Provider:", result.metadata.provider);
    console.log("Model:", result.metadata.model);
    console.log("Latency:", result.metadata.latencyMs, "ms");
  }

  return result;
}

async function testFullContextDeliveryPackage() {
  console.log("\n========================================");
  console.log("TEST 2: Full Context Delivery Package (Complete Handoff)");
  console.log("========================================\n");

  const context: Agent4Context = {
    handoffSpec: mockHandoffSpec,
    clientTools: mockClientTools,
    businessRules: mockBusinessRules,
    notes: "Client prioritizes response time (<5min) and follow-up automation. Phase 1 should deliver 'wow' factor with enrichment + booking flow end-to-end.",
    targetTimelineDays: 10,
  };

  const result = await runAgent4SystemsDelivery(
    "Create comprehensive delivery package for UptimizeAI lead generation and booking system with full QA and monitoring",
    context,
    "balanced"
  );

  console.log("Success:", result.success);
  console.log("Message:", result.message);

  if (result.success && result.data) {
    console.log("\n--- Build Plan ---");
    console.log("Phase 1 Goal:", result.data.build_plan.phase_1.goal);
    console.log("Phase 1 Time-to-Value:", result.data.build_plan.phase_1.time_to_value);
    console.log("Phase 1 Deliverables:", result.data.build_plan.phase_1.deliverables.length);
    console.log("Phase 2 Goal:", result.data.build_plan.phase_2_optional.goal);
    console.log("Dependencies:", result.data.build_plan.dependencies.join(", "));
    console.log("Change Request Rule:", result.data.build_plan.change_request_linkage);

    console.log("\n--- Milestones ---");
    result.data.build_plan.milestones.forEach((milestone, idx) => {
      console.log(`  M${idx + 1}: ${milestone.milestone_name} (ETA: Day ${milestone.eta_days})`);
      console.log(`      Deliverables: ${milestone.deliverables.length}`);
      console.log(`      Acceptance Criteria: ${milestone.acceptance_criteria.length}`);
    });

    console.log("\n--- Data Model ---");
    console.log("Entities:", result.data.data_model.entities.join(", "));
    console.log("Pipeline Stages:", result.data.data_model.pipeline_stages.join(" → "));
    console.log("Logging Fields:", result.data.data_model.logging_fields.join(", "));

    console.log("\n--- Workflow Specifications ---");
    result.data.workflow_specs.forEach((wf, idx) => {
      console.log(`\n  Workflow ${idx + 1}: ${wf.workflow_name}`);
      console.log(`  Goal: ${wf.goal}`);
      console.log(`  Inputs: ${wf.inputs.join(", ")}`);
      console.log(`  Outputs: ${wf.outputs.join(", ")}`);
      console.log(`  Tools: ${wf.tools.join(", ")}`);
      console.log(`  Happy Path Steps: ${wf.happy_path_steps.length}`);
      console.log(`  Exception Paths: ${wf.exception_paths.length}`);
      wf.exception_paths.forEach((ex, exIdx) => {
        console.log(`    Exception ${exIdx + 1}: ${ex.exception_name}`);
        console.log(`      Trigger: ${ex.trigger}`);
        console.log(`      Escalation: ${ex.escalation}`);
      });
      console.log(`  KPIs Affected: ${wf.kpis_affected.join(", ")}`);
    });

    console.log("\n--- Agent Spec Sheets ---");
    result.data.agent_spec_sheets.forEach((agent, idx) => {
      console.log(`\n  Agent ${idx + 1}: ${agent.agent_name}`);
      console.log(`  Purpose: ${agent.purpose}`);
      console.log(`  Allowed Actions: ${agent.allowed_actions.length}`);
      console.log(`  Disallowed Actions: ${agent.disallowed_actions.length}`);
      console.log(`  Guardrails: ${agent.guardrails.length}`);
      console.log(`  Escalation Rules: ${agent.escalation_rules.length}`);
    });

    console.log("\n--- QA Plan & Results ---");
    console.log("QA Checklist Items:", result.data.qa_plan_and_results.qa_checklist.length);
    console.log("Test Cases:", result.data.qa_plan_and_results.test_cases.length);
    result.data.qa_plan_and_results.test_cases.forEach((test, idx) => {
      console.log(`  Test ${idx + 1}: ${test.test_name} [${test.type}] - Status: ${test.status}`);
    });
    console.log("Results Summary:", result.data.qa_plan_and_results.results_summary);
    console.log("Open Issues:", result.data.qa_plan_and_results.open_issues.length);

    console.log("\n--- Fallback Modes ---");
    result.data.fallback_modes.forEach((fallback, idx) => {
      console.log(`  Fallback ${idx + 1}: ${fallback.workflow_name} - ${fallback.failure_mode}`);
      console.log(`    Behavior: ${fallback.fallback_behavior}`);
      console.log(`    Human Action: ${fallback.human_action_required}`);
    });

    console.log("\n--- Client Handoff Kit ---");
    console.log("Quickstart (5-min):");
    result.data.client_handoff_kit.quickstart_5min.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
    console.log("\nDaily SOP Steps:", result.data.client_handoff_kit.daily_sop.length);
    console.log("Weekly SOP Steps:", result.data.client_handoff_kit.weekly_sop.length);
    console.log("Exception SOP Steps:", result.data.client_handoff_kit.exception_sop.length);
    console.log("Training Plan:");
    result.data.client_handoff_kit.training_plan.forEach((session, idx) => {
      console.log(`  Session ${idx + 1}: ${session}`);
    });

    console.log("\n--- Post-Launch Monitoring ---");
    console.log("KPIs to Track:");
    result.data.post_launch_monitoring.kpis.forEach((kpi, idx) => {
      console.log(`  ${idx + 1}. ${kpi}`);
    });
    console.log("\nAlerts:");
    result.data.post_launch_monitoring.alerts.forEach((alert, idx) => {
      console.log(`  ${idx + 1}. ${alert}`);
    });
    console.log("\nSupport Process:");
    result.data.post_launch_monitoring.support_process.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
  }

  if (result.error) {
    console.log("\n--- Error ---");
    console.log("Type:", result.error.type);
    console.log("Details:", result.error.details);
  }

  if (result.metadata) {
    console.log("\n--- Metadata ---");
    console.log("Provider:", result.metadata.provider);
    console.log("Model:", result.metadata.model);
    console.log("Tokens Used:", result.metadata.tokensUsed);
    console.log("Latency:", result.metadata.latencyMs, "ms");
    console.log("Timestamp:", result.metadata.timestamp);
  }

  return result;
}

async function testValidationChecks() {
  console.log("\n========================================");
  console.log("TEST 3: Validation Checks");
  console.log("========================================\n");

  const result = await runAgent4SystemsDelivery(
    "Create delivery package for customer support ticket automation",
    {
      handoffSpec: {
        buildModules: ["Ticket Routing", "Auto-Response", "Escalation"],
        integrations: ["Zendesk", "Slack"],
        risks: ["High ticket volume", "SLA compliance"],
        definitionOfDone: ["99% uptime", "Response time <2min"],
      },
      clientTools: {
        available: ["Zendesk Support", "Slack"],
        restricted: [],
        accessConstraints: ["SLA must be met 99.5% of time"],
      },
      targetTimelineDays: 7,
    },
    "fast"
  );

  console.log("Success:", result.success);
  console.log("Message:", result.message);

  if (result.success && result.data) {
    // Validation checks
    const checks = {
      hasBuildPlan: !!result.data.build_plan,
      hasPhase1: !!result.data.build_plan?.phase_1,
      hasMilestones: (result.data.build_plan?.milestones?.length || 0) > 0,
      hasDataModel: !!result.data.data_model,
      hasWorkflows: (result.data.workflow_specs?.length || 0) > 0,
      hasAgents: (result.data.agent_spec_sheets?.length || 0) > 0,
      hasQA: !!result.data.qa_plan_and_results,
      hasTestCases: (result.data.qa_plan_and_results?.test_cases?.length || 0) > 0,
      hasFallbackModes: (result.data.fallback_modes?.length || 0) > 0,
      hasHandoffKit: !!result.data.client_handoff_kit,
      hasQuickstart: (result.data.client_handoff_kit?.quickstart_5min?.length || 0) > 0,
      hasMonitoring: !!result.data.post_launch_monitoring,
      hasKPIs: (result.data.post_launch_monitoring?.kpis?.length || 0) > 0,
    };

    console.log("\n--- Validation Results ---");
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? "✅" : "❌"} ${check}`);
    });

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    console.log(`\nTotal: ${passedChecks}/${totalChecks} checks passed`);

    if (passedChecks === totalChecks) {
      console.log("\n🎉 All validation checks passed!");
    } else {
      console.log("\n⚠️  Some validation checks failed");
    }
  }

  return result;
}

// ========================================
// RUN ALL TESTS
// ========================================

async function runAllTests() {
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║   Agent 4: Systems Builder & Delivery Orchestrator       ║");
  console.log("║   Test Suite                                              ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  try {
    // Test 1: Basic delivery package
    await testBasicDeliveryPackage();

    // Test 2: Full context delivery package
    await testFullContextDeliveryPackage();

    // Test 3: Validation checks
    await testValidationChecks();

    console.log("\n========================================");
    console.log("ALL TESTS COMPLETED");
    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ Test suite failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { testBasicDeliveryPackage, testFullContextDeliveryPackage, testValidationChecks };
