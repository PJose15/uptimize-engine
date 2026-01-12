# Agent 4: Systems Builder & Delivery Orchestrator

**Ship stable, usable systems that deliver measurable outcomes.**

Agent 4 is the systems engineering agent that converts signed scopes from Agent 3 into production-ready systems with comprehensive delivery packages, QA validation, and client handoff materials.

---

## Mission

Convert signed scopes and blueprints into:
- **Build Plan** (modules + order + dependencies)
- **Agent Specs** (purpose, tools, guardrails, outputs)
- **Workflows & Integrations** (system design)
- **QA Testing** (happy path + edge cases + tool failures)
- **Client Handoff Kit** (quickstart + training + SOPs)
- **Post-Launch Monitoring** (KPIs + alerts + support process)

**Primary Goal:** Deliver Phase 1 "time-to-value" quickly (7–14 days typical) with at least one "wow" workflow live.

---

## Core Output Promise

Agent 4 delivers a **complete Delivery Package** containing:

1. **Build Plan** - Phased milestones with acceptance criteria
2. **Data Model** - Entities, fields, logging, pipeline stages
3. **Workflow Specs** - Engineering-grade specs with exception paths
4. **Agent Spec Sheets** - Permissions, guardrails, escalation rules
5. **QA Plan & Results** - Test cases across all failure modes
6. **Fallback Modes** - Graceful degradation for every workflow
7. **Client Handoff Kit** - 5-min quickstart + daily/weekly SOPs
8. **Post-Launch Monitoring** - KPIs, alerts, weekly review format

---

## Operating Boundaries

### ✅ What Agent 4 DOES

- ✅ Converts Agent 3 signed scopes into actionable build plans
- ✅ Creates detailed workflow specs with happy path + exception handling
- ✅ Designs agent spec sheets with permissions and guardrails
- ✅ Defines comprehensive QA test plans (happy path, missing input, wrong input, tool failures, safety)
- ✅ Creates fallback modes for graceful degradation
- ✅ Produces client-ready handoff kits (quickstart, SOPs, training)
- ✅ Designs post-launch monitoring with KPIs and alerts
- ✅ Prioritizes time-to-value (Phase 1 ships fast with one "wow" workflow)
- ✅ Ensures reliability over complexity (stable systems with guardrails)
- ✅ Enforces quality bar (Definition of Done for every deliverable)

### ❌ What Agent 4 DOES NOT Do

- ❌ Does not change scope without formal change request
- ❌ Does not ship untested workflows
- ❌ Does not request sensitive access without necessity
- ❌ Does not promise outcomes beyond defined success criteria
- ❌ Does not allow hallucinations (agents must label uncertainty)
- ❌ Does not skip exception paths or logging requirements
- ❌ Does not deliver client-facing features without QA validation

---

## Input Requirements

### Required Input

The `task` parameter should describe the delivery objective:

```typescript
const task = "Create delivery package for lead enrichment and outbound automation system";
```

### Optional Context (`Agent4Context`)

```typescript
interface Agent4Context {
  // Handoff spec from Agent 3
  handoffSpec?: {
    buildModules: string[];        // ["Lead Enrichment", "Outbound Automation", "Calendar Booking"]
    integrations: string[];        // ["HubSpot CRM", "Apollo.io", "Calendly"]
    risks: string[];               // ["Data quality", "API rate limits"]
    definitionOfDone: string[];    // ["Lead scoring operational", "30% response rate"]
    scopeReference?: string;       // "SOW-2024-001"
    signedDate?: string;           // "2024-01-15"
  };

  // Client tools and access constraints
  clientTools?: {
    available: string[];           // ["HubSpot", "Gmail", "Slack"]
    restricted: string[];          // ["LinkedIn Sales Navigator"]
    credentials?: Record<string, string>;
    accessConstraints?: string[];  // ["No bulk email sends", "Manual approval for >50 contacts"]
  };

  // Business rules
  businessRules?: {
    operatingHours?: string;       // "9am-6pm ET, Mon-Fri"
    policies?: string[];           // ["No cold calls", "GDPR compliant"]
    routingRules?: string[];       // ["SMB leads to Team A", "Enterprise to Team B"]
    teamRoles?: TeamRole[];        // [{role: "SDR", responsibilities: [...]}]
  };

  // Optional notes and timeline
  notes?: string;
  targetTimelineDays?: number;     // Default: 7-14 days
}
```

---

## Data Model

### Delivery Package Output Structure

The complete output follows this schema:

```typescript
interface DeliveryPackageOutput {
  build_plan: BuildPlan;
  data_model: DataModel;
  workflow_specs: WorkflowSpec[];
  agent_spec_sheets: AgentSpecSheet[];
  qa_plan_and_results: QAPlanAndResults;
  fallback_modes: FallbackMode[];
  client_handoff_kit: ClientHandoffKit;
  post_launch_monitoring: PostLaunchMonitoring;
}
```

### 1. Build Plan

Structured plan with phases and milestones:

```typescript
interface BuildPlan {
  phase_1: PhasePlan;              // Time-to-value phase (7-14 days)
  phase_2_optional: PhasePlan;     // Expansion phase
  milestones: Milestone[];         // [{name, deliverables, eta_days, acceptance_criteria}]
  dependencies: string[];          // ["HubSpot API access", "Email credentials"]
  change_request_linkage: string;  // "Any scope change requires written CR"
}

interface PhasePlan {
  goal: string;                    // "Ship lead enrichment workflow end-to-end"
  deliverables: string[];          // ["Enrichment agent live", "CRM integration", "QA passed"]
  time_to_value: string;           // "7-10 days"
  dependencies: string[];          // ["API credentials", "CRM access"]
}

interface Milestone {
  milestone_name: string;          // "M1: System Blueprint Locked"
  deliverables: string[];          // ["Data model defined", "Workflow specs drafted"]
  eta_days: number;                // 2
  acceptance_criteria: string[];   // ["All stakeholders reviewed", "No blockers"]
}
```

### 2. Data Model

Entities, fields, logging, and pipeline stages:

```typescript
interface DataModel {
  entities: string[];              // ["Lead", "Company", "Interaction", "Task"]
  fields: string[];                // ["lead_id", "company_name", "fit_score", "pain_detected"]
  logging_fields: string[];        // ["timestamp", "action_type", "agent_id", "result_status"]
  pipeline_stages: string[];       // ["New", "Enriched", "Qualified", "Contacted", "Booked"]
}
```

### 3. Workflow Spec

Engineering-grade workflow specification:

```typescript
interface WorkflowSpec {
  workflow_name: string;           // "Lead Enrichment & Scoring"
  goal: string;                    // "Enrich new leads with fit + pain data within 5 minutes"
  inputs: string[];                // ["lead_id", "company_domain", "contact_email"]
  outputs: string[];               // ["fit_score", "pain_summary", "next_action"]
  tools: string[];                 // ["Apollo.io API", "Clearbit API", "HubSpot CRM"]
  happy_path_steps: string[];      // ["1. Fetch lead data", "2. Enrich via APIs", ...]
  exception_paths: ExceptionPath[];
  kpis_affected: string[];         // ["Lead response time", "Qualification accuracy"]
}

interface ExceptionPath {
  exception_name: string;          // "API Rate Limit Hit"
  trigger: string;                 // "Apollo API returns 429 status"
  behavior: string;                // "Retry with exponential backoff (2s, 4s, 8s)"
  escalation: string;              // "After 3 retries, route to manual review queue"
}
```

### 4. Agent Spec Sheet

Permissions and guardrails for each agent:

```typescript
interface AgentSpecSheet {
  agent_name: string;              // "Lead Enrichment Agent"
  purpose: string;                 // "Enrich incoming leads with company + contact data"
  allowed_actions: string[];       // ["Read: HubSpot leads", "Write: enrichment fields"]
  disallowed_actions: string[];    // ["Delete leads", "Modify pricing", "Bulk exports"]
  tool_permissions: string[];      // ["Apollo.io: read-only", "HubSpot: read/write leads"]
  input_contract: string[];        // ["lead_id (required)", "company_domain (optional)"]
  output_contract: string[];       // ["fit_score (0-100)", "pain_summary (string)"]
  guardrails: string[];            // ["Label assumptions", "Never delete data", "Escalate on ambiguity"]
  escalation_rules: string[];      // ["Missing data: ask human", "Conflicting rules: escalate"]
  logging: string[];               // ["Lead ID", "Timestamp", "Action", "Result", "Notes"]
}
```

### 5. QA Plan & Results

Test cases covering all scenarios:

```typescript
interface QAPlanAndResults {
  qa_checklist: string[];          // ["Happy path works", "Missing input handled safely", ...]
  test_cases: TestCase[];
  results_summary: string;         // "8/10 tests pass, 2 blocked on API access"
  open_issues: string[];           // ["Need production API key", "Rate limit TBD"]
}

interface TestCase {
  test_name: string;               // "TC-001: Happy path lead enrichment"
  type: "happy_path" | "missing_input" | "wrong_input" | "tool_failure" | "safety";
  steps: string[];                 // ["1. Trigger with valid lead", "2. Verify enrichment", ...]
  expected_result: string;         // "Lead enriched with fit score and pain summary"
  status: "pass" | "fail" | "blocked";
}
```

### 6. Fallback Modes

Graceful degradation for failures:

```typescript
interface FallbackMode {
  workflow_name: string;           // "Lead Enrichment"
  failure_mode: string;            // "API timeout after 10s"
  fallback_behavior: string;       // "Mark lead as 'needs manual enrichment', notify team"
  human_action_required: string;   // "SDR manually enriches via LinkedIn/web search"
  logging: string;                 // "Log: lead_id, timestamp, 'API_TIMEOUT', fallback_triggered"
}
```

### 7. Client Handoff Kit

Onboarding materials for end users:

```typescript
interface ClientHandoffKit {
  quickstart_5min: string[];       // ["1. Login to dashboard", "2. Run daily workflow", ...]
  daily_sop: string[];             // ["Morning: Check new leads", "Afternoon: Review exceptions"]
  weekly_sop: string[];            // ["Monday: Review KPIs", "Friday: Plan next week"]
  exception_sop: string[];         // ["If API down: Switch to manual checklist"]
  training_plan: string[];         // ["Session 1: System overview (30 min)", "Session 2: Exceptions"]
  admin_notes: string[];           // ["Permissions: Admin panel at /admin", "Logs: /logs"]
}
```

### 8. Post-Launch Monitoring

Ongoing observability and support:

```typescript
interface PostLaunchMonitoring {
  kpis: string[];                  // ["Response time <5min", "Follow-up completion >80%"]
  alerts: string[];                // ["Response time >10min", "API failures >5/day"]
  support_process: string[];       // ["Issues: support@uptimize.ai", "P1: 1hr response"]
  weekly_review_format: string[];  // ["What improved", "What broke", "Next optimizations"]
}
```

---

## Delivery Principles

Agent 4 follows these core principles:

### 1. Time-to-Value First
- Ship one high-impact workflow end-to-end before building everything
- Phase 1 delivers a "wow" moment in 7-14 days
- Phase 2/3 expand based on validated learnings

### 2. Reliability Over Complexity
- Prefer stable systems with guardrails and fallback modes
- Every workflow has exception paths and logging
- No hallucinations (agents label uncertainty and escalate)

### 3. Quality Bar (Definition of Done)
A deliverable is DONE only if:
- ✅ Workflow runs on happy path
- ✅ Workflow handles missing/wrong inputs safely
- ✅ Tool failure behavior is defined and tested
- ✅ Outputs are logged with key fields
- ✅ Client can use it with a 5–10 minute quickstart
- ✅ Success KPI baseline is captured (or method defined)

---

## Integration Examples

### Basic Usage (Minimal Context)

```typescript
import { runAgent4SystemsDelivery } from "@/app/api/agents/run/uptimize/agent-4-systems-delivery";

const result = await runAgent4SystemsDelivery(
  "Create delivery package for lead enrichment system"
);

if (result.success) {
  console.log("Build Plan:", result.data.build_plan);
  console.log("Workflow Count:", result.data.workflow_specs.length);
  console.log("Agent Count:", result.data.agent_spec_sheets.length);
}
```

### Full Usage (With Complete Context)

```typescript
import { runAgent4SystemsDelivery, type Agent4Context } from "@/app/api/agents/run/uptimize/agent-4-systems-delivery";

const context: Agent4Context = {
  handoffSpec: {
    buildModules: [
      "Lead Enrichment & Scoring",
      "Outbound Automation",
      "Calendar Booking"
    ],
    integrations: [
      "HubSpot CRM",
      "Apollo.io",
      "Calendly",
      "Gmail"
    ],
    risks: [
      "API rate limits for Apollo.io",
      "Data quality dependent on lead inputs",
      "Calendar availability sync delays"
    ],
    definitionOfDone: [
      "Lead enrichment runs within 5 minutes of new lead",
      "Outbound sequences achieve >30% response rate",
      "Calendar bookings integrate with HubSpot CRM",
      "All workflows handle API failures gracefully"
    ],
    scopeReference: "SOW-2024-Q1-LeadGen",
    signedDate: "2024-01-15"
  },
  clientTools: {
    available: [
      "HubSpot CRM (Pro)",
      "Gmail (Google Workspace)",
      "Calendly (Teams)",
      "Slack"
    ],
    restricted: [
      "LinkedIn Sales Navigator (license pending)"
    ],
    accessConstraints: [
      "No bulk email sends (>50 recipients) without approval",
      "API rate limits: Apollo 500/day, Clearbit 1000/month",
      "Manual approval required for calendar bookings >$50k deals"
    ]
  },
  businessRules: {
    operatingHours: "9am-6pm ET, Monday-Friday",
    policies: [
      "GDPR compliant (opt-out honored immediately)",
      "No cold calls (email + LinkedIn only)",
      "All interactions logged in HubSpot"
    ],
    routingRules: [
      "SMB leads (<100 employees) → Team A",
      "Mid-market (100-1000 employees) → Team B",
      "Enterprise (>1000 employees) → Team C with director review"
    ],
    teamRoles: [
      {
        role: "SDR (Sales Development Rep)",
        responsibilities: ["Lead qualification", "Outbound sequences", "Initial calls"],
        permissions: ["Read/write: Leads, Contacts", "Read-only: Opportunities"]
      },
      {
        role: "AE (Account Executive)",
        responsibilities: ["Discovery calls", "Demos", "Close deals"],
        permissions: ["Read/write: Opportunities, Quotes", "Read-only: Leads"]
      },
      {
        role: "Operations Admin",
        responsibilities: ["System config", "User permissions", "Reporting"],
        permissions: ["Full admin access", "System configuration", "User management"]
      }
    ]
  },
  notes: "Client prioritizes response time (<5min) and follow-up automation. Phase 1 should deliver 'wow' factor with enrichment + booking flow.",
  targetTimelineDays: 10
};

const result = await runAgent4SystemsDelivery(
  "Create comprehensive delivery package for UptimizeAI lead generation and booking system",
  context,
  "balanced"  // mode: "fast" | "balanced" | "quality"
);

if (result.success) {
  const pkg = result.data;

  console.log("\n=== BUILD PLAN ===");
  console.log("Phase 1 Goal:", pkg.build_plan.phase_1.goal);
  console.log("Milestones:", pkg.build_plan.milestones.length);
  console.log("ETA:", pkg.build_plan.milestones[pkg.build_plan.milestones.length - 1].eta_days, "days");

  console.log("\n=== WORKFLOWS ===");
  pkg.workflow_specs.forEach(wf => {
    console.log(`- ${wf.workflow_name}: ${wf.goal}`);
    console.log(`  Exception Paths: ${wf.exception_paths.length}`);
  });

  console.log("\n=== AGENTS ===");
  pkg.agent_spec_sheets.forEach(agent => {
    console.log(`- ${agent.agent_name}: ${agent.purpose}`);
  });

  console.log("\n=== QA ===");
  console.log("Test Cases:", pkg.qa_plan_and_results.test_cases.length);
  console.log("Status:", pkg.qa_plan_and_results.results_summary);

  console.log("\n=== HANDOFF KIT ===");
  console.log("Quickstart Steps:", pkg.client_handoff_kit.quickstart_5min.length);
  console.log("Training Sessions:", pkg.client_handoff_kit.training_plan.length);

  console.log("\n=== MONITORING ===");
  console.log("KPIs:", pkg.post_launch_monitoring.kpis.length);
  console.log("Alerts:", pkg.post_launch_monitoring.alerts.length);
}
```

---

## Output Format

Agent 4 returns a structured `Agent4Result`:

```typescript
{
  success: true,
  message: "Delivery package generated successfully",
  data: {
    build_plan: { /* BuildPlan */ },
    data_model: { /* DataModel */ },
    workflow_specs: [ /* WorkflowSpec[] */ ],
    agent_spec_sheets: [ /* AgentSpecSheet[] */ ],
    qa_plan_and_results: { /* QAPlanAndResults */ },
    fallback_modes: [ /* FallbackMode[] */ ],
    client_handoff_kit: { /* ClientHandoffKit */ },
    post_launch_monitoring: { /* PostLaunchMonitoring */ }
  },
  metadata: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    tokensUsed: 18500,
    timestamp: "2024-01-20T10:30:00.000Z",
    latencyMs: 8200
  }
}
```

### Error Response

```typescript
{
  success: false,
  message: "Delivery package validation failed",
  error: {
    type: "validation_error",
    details: "Missing required field: build_plan.milestones",
    timestamp: "2024-01-20T10:30:00.000Z"
  }
}
```

---

## Delivery Templates Included

Agent 4 outputs reference these templates:

### 1. Build Plan Template
- Phase 1 & 2 goals and deliverables
- Milestones with ETAs and acceptance criteria
- Dependencies and change request rules

### 2. Workflow Spec Template
- Goal, inputs, outputs
- Tools and integrations
- Happy path steps
- Exception paths with escalation
- KPIs affected

### 3. Agent Spec Sheet Template
- Purpose and permissions
- Allowed/disallowed actions
- Input/output contracts
- Guardrails and escalation rules
- Logging requirements

### 4. QA Checklist Template
- Happy path validation
- Missing/wrong input handling
- Tool failure scenarios
- Security and safety checks
- Adoption readiness

### 5. Fallback Modes Template
- Failure modes per workflow
- Fallback behaviors
- Human actions required
- Logging specifications

### 6. Client Handoff Kit Template
- 5-minute quickstart guide
- Daily/weekly SOPs
- Exception handling procedures
- Training plan (sessions + durations)
- Admin notes (permissions, logs, support)

### 7. Post-Launch Monitoring Template
- KPIs to track
- Alert thresholds
- Support process (channels, SLAs)
- Weekly review format

---

## Quality Bar

Every deliverable must meet the Definition of Done:

- ✅ **Workflow runs on happy path** - Core flow executes successfully
- ✅ **Missing/wrong inputs handled safely** - Graceful degradation, no crashes
- ✅ **Tool failures defined and tested** - Fallback modes for all integrations
- ✅ **Outputs logged with key fields** - Observability for debugging
- ✅ **Client can use it in 5-10 minutes** - Quickstart validated
- ✅ **Success KPI baseline captured** - Measurement system in place

---

## Common Use Cases

### 1. Lead Enrichment System
```typescript
const result = await runAgent4SystemsDelivery(
  "Build delivery package for automated lead enrichment with Apollo.io and Clearbit"
);
```

### 2. Outbound Automation
```typescript
const result = await runAgent4SystemsDelivery(
  "Create build plan for multi-touch outbound sequences with email + LinkedIn"
);
```

### 3. Calendar Booking System
```typescript
const result = await runAgent4SystemsDelivery(
  "Design delivery package for automated calendar booking with Calendly and HubSpot"
);
```

### 4. Full CRM Integration
```typescript
const result = await runAgent4SystemsDelivery(
  "Build comprehensive delivery package integrating HubSpot CRM with enrichment, outbound, and booking workflows"
);
```

---

## Best Practices

### 1. Start with Agent 3 Handoff
Always begin with a signed scope from Agent 3 for best results.

### 2. Provide Complete Tool Access Info
Specify available tools, restrictions, and API limits upfront.

### 3. Define Business Rules Clearly
Include operating hours, policies, routing rules, and team roles.

### 4. Prioritize Time-to-Value
Request Phase 1 delivery first (one "wow" workflow), then expand.

### 5. Validate QA Requirements
Ensure all test cases are actionable and cover edge cases.

### 6. Review Fallback Modes
Confirm that every workflow has graceful degradation for failures.

### 7. Test Handoff Kit
Validate that quickstart guide is truly 5-10 minutes for end users.

---

## Technical Notes

### Execution Modes

- **fast** - Uses faster models (e.g., GPT-4o-mini), lower cost, lower latency
- **balanced** - Uses mid-tier models (e.g., Claude Sonnet 3.5), good balance
- **quality** - Uses highest quality models (e.g., Claude Opus 4), best for complex systems

### Provider Fallback

Agent 4 automatically falls back across providers:
1. Primary: Anthropic (Claude)
2. Fallback: OpenAI (GPT-4)
3. Fallback: Google (Gemini)

### JSON Schema Validation

All outputs are validated against the JSON schema before returning. Invalid structures return validation errors.

### Logging

All execution logs are captured with:
- Task summary
- Context presence (handoffSpec, clientTools, businessRules)
- Execution mode
- Latency, provider, model used
- Workflow/agent/milestone counts

---

## Related Agents

- **Agent 1** (Market Intelligence): Generates target packs → feeds Agent 2
- **Agent 2** (Outbound & Appointment): Books calls → feeds Agent 3
- **Agent 3** (Sales Engineer): Creates signed scopes → **feeds Agent 4**
- **Agent 4** (Systems Delivery): Builds and ships stable systems ← **YOU ARE HERE**

---

## Support

For questions or issues with Agent 4:
- Review [examples/agent-4-usage-examples.ts](../../../../../examples/agent-4-usage-examples.ts)
- Check [test-agent-4.ts](./test-agent-4.ts) for validation patterns
- See [schema.json](./schema.json) for complete output specification

---

**Status:** ✅ Production Ready

**Version:** 1.0.0

**Last Updated:** 2024-01-20
