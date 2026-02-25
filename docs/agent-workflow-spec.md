# Agent Workflow Specification

> **Version:** 1.0  
> **Last Updated:** February 25, 2026

---

## Top 10 Events / Triggers

These are the events that drive state transitions across the pipeline.

| # | Event | Source | Trigger | Pipeline Action |
|---|-------|--------|---------|----------------|
| 1 | `lead.received` | Inbound form, CRM, API | New lead enters system | Start pipeline at INTEL |
| 2 | `lead.scored` | Agent 1 | Fit score + shadow ops density calculated | Transition INTEL → DISCOVERY |
| 3 | `audit.completed` | Agent 2 | 6-pillar audit finished | Transition DISCOVERY → ENGINEERING |
| 4 | `proposal.generated` | Agent 3 | SOW/proposal created | Queue for approval gate |
| 5 | `proposal.accepted` | Human/client | Client agrees to proceed | Transition ENGINEERING → DELIVERY |
| 6 | `system.deployed` | Agent 4 | Workflows + integrations live | Transition DELIVERY → SUCCESS |
| 7 | `kpi.threshold` | Agent 5 | KPI hits target or degrades | Trigger report or alert |
| 8 | `expansion.triggered` | Agent 5 | Health score + usage signals expansion opportunity | Start expansion workflow |
| 9 | `churn.risk` | Agent 5 | Health score drops below threshold | Start churn intervention |
| 10 | `exception.detected` | Any agent | Unexpected condition outside normal flow | Log, route to handler |

---

## Top 10 Workflows

| # | Workflow | Stages Involved | Trigger | Human Approval? |
|---|----------|----------------|---------|-----------------|
| 1 | **Full Pipeline** | All 5 stages | `lead.received` | At ENGINEERING (proposal review) |
| 2 | **Re-Qualify** | Agent 1 only | Manual request or aged lead | No |
| 3 | **Re-Audit** | Agent 2–3 | Client circumstances changed | At ENGINEERING |
| 4 | **Expansion** | Agent 3–5 | `expansion.triggered` | At ENGINEERING |
| 5 | **Churn Intervention** | Agent 5 | `churn.risk` | At DELIVERY (remediation plan) |
| 6 | **Quick Proposal** | Agent 3 only | Manual request | At ENGINEERING |
| 7 | **System Check** | Agent 4 only | Scheduled or manual | No |
| 8 | **Success Report** | Agent 5 only | Scheduled (weekly/monthly) | No |
| 9 | **Exception Handler** | Varies | `exception.detected` | Depends on severity |
| 10 | **Batch Pipeline** | All 5 stages | Multiple leads at once | At ENGINEERING |

---

## Approval Points

| Gate | Stage | What Requires Approval | Who Approves |
|------|-------|----------------------|--------------|
| **Proposal Review** | ENGINEERING → DELIVERY | Every proposal before sending to client | Operator |
| **External System Write** | DELIVERY | Agent writing to client's CRM, tools | Operator or Client |
| **Outbound Communication** | DISCOVERY/DELIVERY | Emails, messages to client's contacts | Operator |
| **Cost Exceedance** | Any | Step cost > $5.00 | Operator |
| **Batch Operation** | Any | Acting on > 10 records | Operator |

---

## Handoff Envelope Contract

Every agent-to-agent handoff passes this standard envelope:

```json
{
  "from_agent": "agent1",
  "to_agent": "agent2",
  "payload": {
    "target_pack": [...],
    "shadow_ops_findings": {...},
    "fit_scores": {...}
  },
  "confidence": "high",
  "flags": ["high_shadow_ops_density", "quick_timeline"],
  "created_at": "2026-02-25T15:00:00Z",
  "payload_hash": "ph_abc123"
}
```

---

## Metrics Per Stage

| Stage | Key Metrics |
|-------|------------|
| INTEL | Leads scored, avg fit score, shadow ops density |
| DISCOVERY | Audit completeness %, pain severity, pillar scores |
| ENGINEERING | Proposal win rate, time-to-proposal, deal size |
| DELIVERY | Deployment time, integrations configured, errors |
| SUCCESS | Health score, NPS, expansion rate, churn rate, pillar improvement |

---

## Idempotency Rules

1. Every pipeline run has a unique `run_id`
2. Every step has a unique `step_id` and `idempotency_key`
3. Before executing a step, check if the idempotency key is already marked complete
4. If complete, skip execution and return cached result
5. State machine can be serialized and restored for replay
6. Webhook-triggered runs check for duplicate `run_id` before creating
