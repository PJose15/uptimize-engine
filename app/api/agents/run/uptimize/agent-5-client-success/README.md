# Agent 5 - Client Success, Retention & Expansion (v2)

**Shadow Ops Elimination Edition**

Agent 5 ensures clients win, adopt the system, retain long-term, and expand naturally by tracking adoption, managing issues, producing weekly win reports, and collecting proof assets that demonstrate Shadow Ops elimination and exception reduction.

## Table of Contents

- [Overview](#overview)
- [Core Differentiator](#core-differentiator)
- [Mission](#mission)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)
- [Templates](#templates)
- [Health Score Calculation](#health-score-calculation)
- [Integration with Ops Spine](#integration-with-ops-spine)
- [Best Practices](#best-practices)

---

## Overview

Agent 5 is the **Client Success, Retention & Expansion** agent in the UptimizeAI 5-agent operating system. It receives the Client Handoff Kit from Agent 4 (delivery) and ensures:

1. **First Value in 7 Days (FVi7)**: Clients experience measurable wins quickly
2. **Adoption**: Workflows are used consistently
3. **Retention**: Clients stay satisfied and see ongoing progress
4. **Expansion**: Phase 2/3 upsells happen naturally (not pushy)
5. **Proof**: Capture testimonials and case studies with defensible metrics

---

## Core Differentiator

Unlike generic customer success teams, Agent 5 proves value through:

- **Shadow Ops Elimination**: Track before/after of off-system work (WhatsApp, DMs, spreadsheets, memory)
- **Exception Rate Reduction**: Measure how many edge cases are now handled automatically
- **Audit Trail Completeness**: Show clients can now prove what happened (compliance value)
- **Operational Stability**: Time saved, rework reduced, follow-up leakage closed

This is **defensible proof** that generic AI agencies cannot show.

---

## Mission

Ensure clients:
- Onboard quickly and experience value in 7 days
- Adopt workflows and use them weekly
- See measurable improvements in KPIs
- Retain long-term with high health scores
- Expand into Phase 2/3 when ready
- Provide testimonials and case studies

---

## Inputs

Agent 5 receives a **Client Handoff Kit from Agent 4**:

```typescript
interface Agent4HandoffKit {
  project_id: string;
  account_id: string;
  client_name: string;

  // SOPs and training materials
  quickstart_5min: string[];
  daily_sop: string[];
  weekly_sop: string[];
  exception_sop: string[];
  training_plan: string[];
  admin_notes: string[];

  // Baseline metrics
  baseline_kpis: {
    kpi_name: string;
    baseline_value: string;
    target_value: string;
    measurement_method: string;
  }[];

  // Workflows delivered
  workflows_delivered: {
    workflow_id: string;
    workflow_name: string;
    goal: string;
    exception_paths_top5: string[];
    kpis_affected: string[];
  }[];

  // Shadow Ops baseline
  shadow_ops_baseline: string[];

  // Exception library
  exception_library: {
    exception_name: string;
    frequency: string;
    impact: string;
    current_handling: string;
  }[];
}
```

Plus **current state data**:

```typescript
interface Agent5Input {
  handoff_kit: Agent4HandoffKit;
  current_week_of: string; // ISO date

  usage_data?: {
    workflows_executed_this_week: number;
    active_users_this_week: number;
    exceptions_triggered_this_week: number;
    avg_exception_resolution_hours: number;
  };

  client_feedback?: string;

  open_tickets?: {
    ticket_id: string;
    severity: 'P1' | 'P2' | 'P3';
    issue: string;
    created_at: string;
  }[];
}
```

---

## Outputs

Agent 5 produces a **complete Client Success Package**:

```typescript
interface Agent5ClientSuccessPackage {
  onboarding_plan: OnboardingPlan;              // FVi7: Day 1/3/7 + training
  adoption_dashboard: AdoptionDashboard;         // KPIs + usage + exceptions + audit
  weekly_win_report: WeeklyWinReport;            // Wins + metrics + issues + next actions
  issues_and_tickets: Ticket[];                  // Severity, status, owner, next step
  shadow_ops_reduction_report: ShadowOpsReport;  // Before/after + delta
  optimization_backlog: OptimizationItem[];      // Prioritized improvements
  expansion_map: ExpansionMap;                   // Phase 2/3 recommendations
  proof_asset_pipeline: ProofAssetPipeline;      // Testimonials + case studies
  client_health_score: ClientHealthScore;        // 0-100 + risk level + interventions
}
```

### Key Output Components

#### 1. Onboarding Plan (FVi7)
First Value in 7 Days protocol:
- **Day 1**: Kickoff + quickstart + run "wow workflow" live
- **Day 3**: Check-in + remove friction + tune exceptions
- **Day 7**: Weekly win report + next optimization

#### 2. Adoption Dashboard
Tracks:
- KPIs (response time, follow-up completion, etc.)
- Usage signals (workflows executed, active users)
- **Exception metrics** (count, top exceptions, resolution time)
- **Auditability metrics** (audit trail completeness, missing log events)

#### 3. Weekly Win Report
One-page summary:
- Wins (2-3 bullets)
- Metrics snapshot (baseline → current)
- Shadow Ops eliminated this week
- What broke / risks
- Next actions

#### 4. Shadow Ops Reduction Report
Before/after tracking:
- Before list (off-system work at baseline)
- After list (remaining manual work)
- Delta summary (hours saved, tasks eliminated)
- New shadow ops detected (newly discovered inefficiencies)

#### 5. Client Health Score
0-100 score calculated from:
- **Adoption** (0-30): workflows executed + active users
- **KPI Trend** (0-25): improving vs flat vs declining
- **Responsiveness** (0-20): approval speed + communication
- **Low Friction** (0-15): few P1/P2 issues
- **Expansion Readiness** (0-10): new needs emerging

Risk levels:
- **80-100**: Healthy (green)
- **60-79**: Watch (yellow)
- **<60**: At Risk (red)

---

## Key Features

### FVi7 Protocol (First Value in 7 Days)
Ensures rapid time-to-value:
- Day 1: Onboarding + live workflow run
- Day 3: Friction removal + exception tuning
- Day 7: First weekly win report

### Ticketing & Triage System
**Severity levels:**
- **P1**: System down / revenue impact → escalate immediately to Agent 4
- **P2**: Partial failure / major friction → fix within 48h
- **P3**: Minor bug / improvement → backlog

**Ticket flow:**
1. Capture (issue, screenshots, timestamp, workflow, exception tag)
2. Assign owner (Agent 4/5, client, or human)
3. Set next step + ETA
4. Resolve + confirm
5. Log root cause + prevention

### Exception Tracking
Every exception creates:
- Exception tag (from exception library)
- Trigger/cause documentation
- Handling steps taken
- Resolution time
- Prevention analysis

Recurring exceptions (3+ per month) → Change Request to automate

### Shadow Ops Tracking
Weekly tracking worksheet:
- Before (baseline off-system work)
- After (eliminated tasks)
- Still manual (not yet automated)
- New shadow ops detected
- Delta summary (hours saved)

### Proof Asset Generation
**Testimonial requests:**
- After first measurable win (Day 7-14)
- After major milestones
- Scripts provided for easy collection

**Case studies:**
- Context: who they are + what they do
- Problem: the leak (before state)
- Fix: Phase 1 workflows
- Result: KPI snapshot + Shadow Ops eliminated
- Quote: 1-2 sentences
- Next: Phase 2 expansion path

---

## Installation

### Prerequisites
- Node.js 18+
- Anthropic API key
- TypeScript (optional, types provided)

### Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

### Environment Setup

```bash
export ANTHROPIC_API_KEY=your_key_here
```

---

## Usage

### Basic Usage

```typescript
import { Agent5ClientSuccess } from './agent-5-client-success';

const agent = new Agent5ClientSuccess({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-opus-4-5-20251101',
  maxTokens: 16000,
  temperature: 0.7,
});

const input = {
  handoff_kit: {
    // ... Agent 4 handoff data
  },
  current_week_of: '2026-01-12',
  usage_data: {
    workflows_executed_this_week: 47,
    active_users_this_week: 3,
    exceptions_triggered_this_week: 8,
    avg_exception_resolution_hours: 2.5,
  },
  client_feedback: 'Team loves the Slack notifications!',
};

const result = await agent.run(input);

console.log('Client Health Score:', result.client_health_score.score_0_100);
console.log('Risk Level:', result.client_health_score.risk_level);
console.log('Wins:', result.weekly_win_report.wins);
```

### Health Score Calculation

```typescript
import { Agent5ClientSuccess } from './agent-5-client-success';

const score = Agent5ClientSuccess.calculateHealthScore({
  adoption_score: 28,      // 0-30
  kpi_trend_score: 22,     // 0-25
  responsiveness_score: 18, // 0-20
  friction_score: 14,      // 0-15
  expansion_readiness_score: 9, // 0-10
});

const riskLevel = Agent5ClientSuccess.determineRiskLevel(score);

console.log(`Score: ${score}/100 (${riskLevel})`);
// Output: Score: 91/100 (healthy)
```

### Run Tests

```bash
# Set API key
export ANTHROPIC_API_KEY=your_key_here

# Run test suite
npx tsx test-agent-5.ts
```

Test output includes:
- Week 1 onboarding package
- Week 4 stable adoption package
- Health score progression
- Shadow Ops elimination tracking
- Full JSON results saved to `./test-output/`

---

## Templates

Agent 5 includes 10 ready-to-use templates in `templates.md`:

1. **FVi7 Plan** - First Value in 7 Days protocol
2. **Weekly Win Report** - One-page client update
3. **Ticketing SOP** - Issue triage and resolution
4. **Client Health Score Calculator** - 0-100 scoring rubric
5. **Testimonial Request Scripts** - Easy collection after wins
6. **Case Study Outline** - Fast case study creation
7. **Monthly Strategy Review (QBR)** - Light quarterly review
8. **Exception SOP** - Handling edge cases systematically
9. **Shadow Ops Tracking Worksheet** - Before/after tracking
10. **Expansion Trigger Checklist** - When to propose Phase 2/3

All templates are:
- **Fast** (5-15 minutes to complete)
- **Evidence-based** (metrics, not opinions)
- **Actionable** (clear next steps)
- **Client-friendly** (operator language, no jargon)

---

## Health Score Calculation

### Scoring Breakdown

```
CLIENT HEALTH SCORE (0-100)

ADOPTION (0-30 points)
+15 Workflows executed weekly (vs target)
+10 Active users (vs expected)
+5  Feature utilization breadth

KPI TREND (0-25 points)
+25 All KPIs improving
+15 Most improving, some flat
+10 Mixed results
+5  Declining trend

RESPONSIVENESS (0-20 points)
+20 Fast approvals, proactive communication
+15 Good communication, occasional delays
+10 Slow approvals, reactive only
+5  Very slow, unresponsive

LOW FRICTION (0-15 points)
+15 Zero P1/P2 issues this month
+10 1-2 P2s, quickly resolved
+5  Multiple P2s or 1 P1
+0  Recurring P1s

EXPANSION READINESS (0-10 points)
+10 Actively requesting new features
+7  Asking about next phases
+5  Satisfied with current state
+2  Not thinking expansion
+0  Not engaged
```

### Risk-Based Interventions

**At Risk (<60)**
- Emergency review call
- Identify immediate friction
- Propose quick wins
- Pause expansion discussions
- Weekly check-ins

**Watch (60-79)**
- Bi-weekly strategy calls
- Address adoption barriers
- Showcase current ROI
- Prepare Phase 2 materials (don't push)
- Monitor for improvement/decline

**Healthy (80-100)**
- Monthly strategy reviews
- Collect testimonials + case studies
- Introduce Phase 2/3 opportunities
- Request referrals
- Use as marketing proof asset

---

## Integration with Ops Spine

Agent 5 reads/writes to the shared **Ops Spine** data model:

### Entities Used

**Projects**
- Track `delivery_stage` and `success_stage`
- Link to workflows and KPIs

**Workflows**
- Track exception paths and execution metrics

**KPIs**
- Baseline, current, and target values
- Track progress over time

**Tickets**
- Severity, status, exception tags
- Track resolution times

**Proof Assets**
- Testimonials and case studies
- Shadow Ops reduction and exception reduction data

**Audit Events**
- Every action logged for auditability
- Measure audit trail completeness

### Example Ops Spine Integration

```typescript
// Read project from Ops Spine
const project = opsSpine.entities.projects.find(
  p => p.project_id === 'proj_cs_test_001'
);

// Update success stage
project.success_stage = 'ADOPTING'; // Was: ONBOARDING

// Create audit event
opsSpine.entities.audit_events.push({
  audit_event_id: 'ae_' + Date.now(),
  created_at: new Date().toISOString(),
  actor: { actor_type: 'agent5', actor_id: 'agent5_instance_1' },
  entity_type: 'project',
  entity_id: project.project_id,
  event_type: 'project.stage_changed',
  event_summary: 'Project moved from ONBOARDING to ADOPTING',
  result_status: 'success',
});

// Create proof asset
opsSpine.entities.proof_assets.push({
  proof_asset_id: 'pa_' + Date.now(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner: { owner_type: 'agent5', owner_id: 'agent5_instance_1' },
  account_id: project.account_id,
  project_id: project.project_id,
  type: 'testimonial',
  status: 'requested',
  headline: 'SolarLeads Pro eliminates manual lead entry',
  before_after_points: [
    'Before: 30min/day manual data entry',
    'After: Fully automated in <5 minutes',
  ],
  shadow_ops_reduction: [
    'Manual Facebook form entry eliminated',
    'WhatsApp to CRM copy/paste eliminated',
  ],
  exception_reduction: [
    'Duplicate lead rate: 8-10% → <2%',
    'Data entry errors: 15-20/week → <5/week',
  ],
  auditability_improvement: [
    'Full audit trail of all lead processing',
    'Can now prove compliance for leads',
  ],
  links: [],
  notes: 'Requested after Week 1 FVi7 completion',
});
```

---

## Best Practices

### Onboarding (Week 1)
- **Run FVi7 strictly**: Day 1/3/7 checkpoints mandatory
- **Run "wow workflow" live on Day 1**: Don't just explain it
- **Collect quick win quote on Day 3**: While excitement is fresh
- **Send first Weekly Win Report on Day 7**: Even if small wins

### Adoption (Weeks 2-4)
- **Weekly Win Reports**: Every Monday, no exceptions
- **Track exceptions religiously**: Build the exception library
- **Shadow Ops worksheet**: Update weekly for first month
- **Remove friction fast**: P1/P2 tickets resolved <48h

### Retention (Month 2+)
- **Monthly Strategy Reviews**: Even if just 15-minute async update
- **Health Score tracking**: Calculate monthly
- **Optimization backlog**: Prioritize high-impact, low-effort items
- **Proof asset collection**: Request testimonial after every major win

### Expansion (Month 3+)
- **Use Expansion Trigger Checklist**: Don't guess readiness
- **Lead with client needs**: Not your product roadmap
- **Show ROI from Phase 1**: Before proposing Phase 2
- **Keep it light**: "Here's what's possible" not "You should buy this"

### Communication
- **Operator language**: No jargon, no fluff
- **Evidence-based**: Metrics, not opinions
- **Concise**: One-page reports, 5-min meetings
- **Proactive**: Don't wait for client to ask

### Red Flags (Immediate Action Required)
- Health score drops below 60
- Any P1 issue
- Usage declining 2 weeks in a row
- Client unresponsive for 5+ days
- Negative feedback about current system

---

## File Structure

```
agent-5-client-success/
├── README.md                    # This file
├── schema.json                  # JSON schema (v2)
├── types.ts                     # TypeScript types
├── agent.ts                     # Main agent implementation
├── index.ts                     # Exports
├── templates.md                 # 10 ready-to-use templates
├── test-agent-5.ts             # Test suite
└── IMPLEMENTATION_SUMMARY.md   # Implementation details
```

---

## Support

For issues, questions, or contributions:
- GitHub: [uptimize-engine/agent-5](https://github.com/uptimize-engine)
- Docs: See `/docs/agent-5/`
- Slack: #agent-5-client-success

---

## License

MIT License - see LICENSE file for details

---

## Version

**Agent 5 v2.0** - Shadow Ops Elimination Edition

Last updated: 2026-01-12
