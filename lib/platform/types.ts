/**
 * UPTIMAIZE platform — command center data contracts.
 *
 * These shapes are what `/api/platform` returns today from `lib/platform/data.ts`
 * and what the real aggregation layer must return when it replaces it. Every
 * panel in `app/(platform)` reads from these types only.
 */

export type Trend = 'up' | 'down' | 'flat';
export type Tone = 'primary' | 'gold' | 'green' | 'red' | 'blue' | 'pink';
export type Severity = 'high' | 'medium' | 'low';
export type Health = 'healthy' | 'watch' | 'at_risk' | 'down';

export type KpiIcon =
    | 'shield'
    | 'dollar'
    | 'clock'
    | 'bot'
    | 'network'
    | 'pulse';

export interface Kpi {
    id: string;
    label: string;
    /** Pre-formatted headline value, e.g. "$2.47" — pair with `unit` for the suffix. */
    value: string;
    /** Small suffix rendered next to the value, e.g. "M" or "%". */
    unit?: string;
    /** Secondary value rendered after the headline, e.g. "/ 70". */
    of?: string;
    delta: string;
    deltaLabel: string;
    trend: Trend;
    tone: Tone;
    icon: KpiIcon;
    /** Replaces the delta row when present, e.g. "Excellent". */
    note?: string;
}

export type AgentStatus = 'active' | 'idle' | 'paused' | 'error';

export interface PlatformAgent {
    id: string;
    name: string;
    description: string;
    status: AgentStatus;
    /** Tasks completed in the trailing 24h. */
    tasks: number;
    approvals: number;
    /** Performance score, 0–100. */
    performance: number;
    leaksDetected: number;
    leaksClosed: number;
    /** Sparkline series, oldest → newest. */
    trend: number[];
    impact: Severity;
}

export type LeakStatus = 'open' | 'investigating' | 'resolved';

export interface RevenueLeak {
    id: string;
    name: string;
    /** Annualized impact in dollars. */
    impact: number;
    source: string;
    partner: string;
    severity: Severity;
    status: LeakStatus;
    detectedAt: string;
    detectedBy: string;
    resolvedOn?: string;
    assignee?: string;
    description: string;
    nextStep: string;
    evidence: { name: string; size: string }[];
}

export interface Approval {
    id: string;
    title: string;
    partner: string;
    amount: number;
    waiting: string;
    urgency: 'critical' | 'warning' | 'normal';
}

export interface Partner {
    id: string;
    name: string;
    health: Health;
    revenueProtected: number;
    moneySaved: number;
    leaksDetected: number;
    leaksClosed: number;
    agents: number;
    workflows: number;
    trend: number[];
    tone: Tone;
    since: string;
}

export type ActivityKind =
    | 'leak'
    | 'workflow'
    | 'approval'
    | 'shadow'
    | 'data'
    | 'report';

export interface ActivityEvent {
    id: string;
    kind: ActivityKind;
    title: string;
    context: string;
    meta: string;
    at: string;
}

export interface Deliverable {
    id: string;
    name: string;
    period: string;
    format: 'PDF' | 'XLSX' | 'PPTX' | 'CSV';
    size: string;
    generatedOn: string;
}

export interface PlatformAlert {
    id: string;
    level: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    context: string;
    at: string;
}

export interface ShadowOp {
    id: string;
    name: string;
    partner: string;
    system: string;
    hoursPerMonth: number;
    costPerMonth: number;
    status: 'detected' | 'automating' | 'eliminated';
    detectedOn: string;
}

export interface Workflow {
    id: string;
    name: string;
    partner: string;
    trigger: string;
    runs: number;
    successRate: number;
    avgDurationSec: number;
    status: 'running' | 'scheduled' | 'paused' | 'draft';
    lastRun: string;
    hoursSaved: number;
}

export interface TrendPoint {
    date: string;
    /** Millions of dollars. */
    revenueProtected: number;
    /** Millions of dollars. */
    moneySaved: number;
}

export interface SavingsCategory {
    label: string;
    value: number;
    share: number;
    tone: Tone;
}

export interface WorkflowPerformance {
    totalRuns: number;
    completed: number;
    exceptions: number;
    inProgress: number;
    automationSuccessRate: number;
    successDelta: string;
}

export interface CommandCenterData {
    generatedAt: string;
    period: { label: string; comparison: string };
    executiveSummary: string;
    kpis: Kpi[];
    agents: PlatformAgent[];
    leaks: RevenueLeak[];
    approvals: Approval[];
    partners: Partner[];
    activity: ActivityEvent[];
    deliverables: Deliverable[];
    alerts: PlatformAlert[];
    shadowOps: ShadowOp[];
    workflows: Workflow[];
    trend: TrendPoint[];
    savingsBreakdown: SavingsCategory[];
    workflowPerformance: WorkflowPerformance;
    roi: {
        multiple: number;
        previousMultiple: number;
        investment: number;
        returned: number;
        hoursReclaimed: number;
        paybackDays: number;
    };
    systemStatus: { label: string; healthy: boolean };
}
