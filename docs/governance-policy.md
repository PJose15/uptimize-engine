# Uptimize.AI — Governance Policy

> **Version:** 1.0  
> **Effective:** February 25, 2026  
> **Status:** Enforced

---

## Core Principle

Every agent action must be **permissioned, logged, and reversible**. An agent that can write to external systems without guardrails is a liability, not a product.

---

## 1. Tool Permissioning

Every agent has an explicit permission set defining what it **can** and **cannot** do.

### Permission Levels

| Level | Description | Example |
|-------|-------------|---------|
| `READ` | Can read/query data | Search CRM records |
| `WRITE_INTERNAL` | Can write to Uptimize's own systems | Update pipeline state, save analysis |
| `WRITE_EXTERNAL` | Can write to client's external systems | Create CRM contact, send email |
| `EXECUTE` | Can trigger actions with side effects | Send message, schedule meeting, initiate payment |
| `ADMIN` | Can modify system configuration | Change agent permissions, update routing |

### Default Agent Permissions

| Agent | READ | WRITE_INTERNAL | WRITE_EXTERNAL | EXECUTE | ADMIN |
|-------|------|----------------|----------------|---------|-------|
| Agent 1 (Market Intel) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Agent 2 (Outbound) | ✅ | ✅ | ⚠️ Approval Required | ⚠️ Approval Required | ❌ |
| Agent 3 (Sales Engineer) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Agent 4 (Systems Delivery) | ✅ | ✅ | ⚠️ Approval Required | ⚠️ Approval Required | ❌ |
| Agent 5 (Client Success) | ✅ | ✅ | ⚠️ Approval Required | ❌ | ❌ |

### Permission Rules

1. **No agent starts with EXECUTE permission** — must be explicitly granted per deployment
2. **WRITE_EXTERNAL always requires approval** unless explicitly waived by client config
3. **Permission escalation is audited** — if permissions change, the change itself is logged
4. **Deny by default** — if a tool isn't in the allowed list, the call is blocked and logged

---

## 2. Approval Gates

Certain actions pause execution and wait for human approval.

### Mandatory Approval Gates

| Gate | Trigger | Who Approves |
|------|---------|--------------|
| **External Write** | Any agent attempts to write to an external system | Operator or Client |
| **Cost Threshold** | Single action estimated > $5.00 | Operator |
| **Batch Operations** | Agent wants to act on > 10 records at once | Operator |
| **First-Time Tool Use** | Agent uses a tool it hasn't used before in this deployment | Operator |
| **Sensitive Data Access** | Access to PII, financial data, credentials | Client Admin |

### Approval Flow

```
Agent requests action → Permission check → Approval gate check
  ├── Approved → Execute → Log result
  ├── Denied → Log denial → Continue pipeline without action
  └── Pending → Queue action → Notify human → Wait (with timeout)
```

### Timeout Policy

- Approval requests timeout after **24 hours**
- Timed-out requests are logged as `EXPIRED` and the agent continues without the action
- Client can configure shorter timeouts per deployment

---

## 3. Audit Enforcement

Every action — successful, denied, or failed — produces an audit record.

### Audit Record Schema

```
{
  audit_id: string
  timestamp: ISO-8601
  agent_id: string
  action_type: "tool_call" | "data_read" | "data_write" | "approval_request" | "approval_decision"
  tool_name: string
  target_system: string
  input_hash: string          // hash of inputs (not raw data)
  output_hash: string         // hash of outputs
  result: "success" | "denied" | "failed" | "expired"
  cost_usd: number
  approval_required: boolean
  approved_by: string | null
  reversible: boolean
  rollback_id: string | null  // if reversible, link to rollback mechanism
}
```

### Retention

- Audit logs retained for **90 days** minimum
- Client can request extended retention
- Logs are **immutable** — no deletes, no edits

---

## 4. Rollback Protocol

Actions that write to external systems must be reversible when possible.

### Rollback Categories

| Category | Rollback Method | Auto-Rollback? |
|----------|----------------|----------------|
| CRM record created | Delete record | Manual only |
| Email sent | Cannot rollback | ❌ — use approval gate |
| Calendar event created | Cancel event | Manual only |
| Spreadsheet row added | Delete row | Manual only |
| Slack message sent | Delete message | Manual only |
| Payment initiated | Void/refund | ❌ — requires approval gate |

### Rule: If it can't be rolled back, it requires approval.

---

## 5. Client Data Boundaries

### Isolation Rules

- Each client deployment gets its own **namespace** in the database
- Agent prompts never leak data between clients
- MCP connections are **per-client** — no shared tool sessions
- API keys for client systems are stored encrypted, scoped to that client only

### Data Flow Rules

- Agent outputs for Client A are never used as training/context for Client B
- Audit logs are client-scoped
- Pipeline state is client-scoped
- Skills and prompts can be shared (they don't contain client data)

---

## Enforcement

This policy is enforced in code via:
- `lib/governance/tool-permissions.ts` — permission checks
- `lib/governance/approval-gates.ts` — approval gate enforcement
- Pipeline audit logging — integrated into the state machine

**Violations are logged as critical events and surface in the operator dashboard.**
