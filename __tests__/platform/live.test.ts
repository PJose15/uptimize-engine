import { describe, expect, it } from 'vitest';
import { getCommandCenterData } from '@/lib/platform/data';
import {
    ALL_DEMO,
    agentDisplayName,
    buildAgents,
    buildActivity,
    buildApprovals,
    buildKpis,
    buildLiveSections,
    buildPartners,
    buildWorkflowPerformance,
    buildWorkflows,
    parseHealthHistory,
    relativeTime,
    waitingFor,
    type LiveRows,
} from '@/lib/platform/live';

const NOW = new Date('2025-05-25T12:00:00.000Z');
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000);
const hoursAgo = (n: number) => minutesAgo(n * 60);
const daysAgo = (n: number) => hoursAgo(n * 24);

const snapshot = getCommandCenterData();

const emptyRows: LiveRows = {
    clients: [],
    portfolios: [],
    subAgentRuns: [],
    events: [],
    approvals: [],
    sessions: [],
    stats: [],
};

const run = (over: Partial<LiveRows['subAgentRuns'][number]> = {}) => ({
    parentAgentId: 'agent-1-market-intelligence',
    clientId: 'client_001',
    taskCompleted: true,
    escalationNeeded: false,
    escalationSeverity: null,
    createdAt: hoursAgo(2),
    ...over,
});

describe('time helpers', () => {
    it('formats minutes, hours and days', () => {
        expect(relativeTime(minutesAgo(12), NOW)).toBe('12m ago');
        expect(relativeTime(hoursAgo(3), NOW)).toBe('3h ago');
        expect(relativeTime(daysAgo(2), NOW)).toBe('2d ago');
        expect(waitingFor(minutesAgo(45), NOW)).toBe('45m');
        expect(waitingFor(hoursAgo(4), NOW)).toBe('4h');
    });

    it('never reports zero or negative elapsed time', () => {
        expect(relativeTime(NOW, NOW)).toBe('1m ago');
        expect(relativeTime(new Date(NOW.getTime() + 60_000), NOW)).toBe('1m ago');
    });
});

describe('agentDisplayName', () => {
    it('strips the agent prefix and title-cases the rest', () => {
        expect(agentDisplayName('agent-1-market-intelligence')).toBe('Market Intelligence');
        expect(agentDisplayName('agent-13-internal-ops')).toBe('Internal Ops');
        expect(agentDisplayName('shadow_ops_detector')).toBe('Shadow Ops Detector');
    });
});

describe('parseHealthHistory', () => {
    it('reads both bare numbers and {score} entries', () => {
        expect(parseHealthHistory('[80, 82, 85]')).toEqual([80, 82, 85]);
        expect(parseHealthHistory('[{"weekOf":"2025-05-01","score":74}]')).toEqual([74]);
    });

    it('survives malformed JSON and unexpected shapes', () => {
        expect(parseHealthHistory('not json')).toEqual([]);
        expect(parseHealthHistory('{}')).toEqual([]);
        expect(parseHealthHistory('[null, "x", 91]')).toEqual([91]);
    });
});

describe('buildAgents', () => {
    const runs = [
        run(),
        run({ taskCompleted: false, createdAt: hoursAgo(5) }),
        run({ createdAt: daysAgo(3) }),
        run({ parentAgentId: 'agent-2-outbound', escalationNeeded: true, escalationSeverity: 'P1' }),
        run({ parentAgentId: 'agent-3-idle', createdAt: daysAgo(9) }),
    ];
    const agents = buildAgents(runs, NOW);

    it('groups runs by parent agent', () => {
        expect(agents.map((agent) => agent.id).sort()).toEqual([
            'agent-1-market-intelligence',
            'agent-2-outbound',
            'agent-3-idle',
        ]);
    });

    it('counts only the trailing 24h as tasks', () => {
        const market = agents.find((agent) => agent.id === 'agent-1-market-intelligence');
        expect(market?.tasks).toBe(2);
    });

    it('scores performance from completed runs', () => {
        const market = agents.find((agent) => agent.id === 'agent-1-market-intelligence');
        expect(market?.performance).toBeCloseTo(66.7, 1);
    });

    it('marks agents with no run in 24h as idle', () => {
        expect(agents.find((agent) => agent.id === 'agent-3-idle')?.status).toBe('idle');
        expect(agents.find((agent) => agent.id === 'agent-2-outbound')?.status).toBe('active');
    });

    it('raises impact to high on a P1 escalation', () => {
        const outbound = agents.find((agent) => agent.id === 'agent-2-outbound');
        expect(outbound?.impact).toBe('high');
        expect(outbound?.approvals).toBe(1);
    });

    it('produces a seven-point sparkline', () => {
        expect(agents[0].trend).toHaveLength(7);
    });
});

describe('buildActivity', () => {
    const companies = new Map([['client_001', 'SouthRex Solutions']]);
    const events = buildActivity(
        [
            {
                id: 'e1',
                action: 'data_reconciliation_completed',
                description: '3,247 records',
                status: 'completed',
                pillar: 'data',
                toolUsed: 'sheets',
                costUsd: 0.02,
                durationMs: 3200,
                timestamp: minutesAgo(26),
                clientId: 'client_001',
            },
            {
                id: 'e2',
                action: 'unknown pillar event',
                description: 'something',
                status: 'completed',
                pillar: 'mystery',
                toolUsed: null,
                costUsd: 0,
                durationMs: 0,
                timestamp: hoursAgo(2),
                clientId: 'client_999',
            },
        ],
        companies,
        NOW
    );

    it('maps action, company and elapsed time', () => {
        expect(events[0].title).toBe('Data Reconciliation Completed');
        expect(events[0].context).toBe('SouthRex Solutions');
        expect(events[0].at).toBe('26m ago');
        expect(events[0].kind).toBe('data');
        expect(events[0].meta).toContain('3.2s');
    });

    it('falls back to the client id and a default kind', () => {
        expect(events[1].context).toBe('client_999');
        expect(events[1].kind).toBe('workflow');
    });
});

describe('buildApprovals', () => {
    const rows = [
        {
            id: 'a1',
            action: 'refund_over_5000',
            description: 'Refund',
            riskLevel: 'high',
            affectedSystem: 'billing',
            status: 'pending',
            timestamp: minutesAgo(12),
            clientId: 'client_001',
        },
        {
            id: 'a2',
            action: 'note',
            description: 'Already decided',
            riskLevel: 'low',
            affectedSystem: 'crm',
            status: 'approved',
            timestamp: hoursAgo(9),
            clientId: 'client_001',
        },
    ];
    const approvals = buildApprovals(rows, new Map([['client_001', 'SouthRex Solutions']]), NOW);

    it('keeps only pending items', () => {
        expect(approvals).toHaveLength(1);
        expect(approvals[0].id).toBe('a1');
    });

    it('maps risk level to urgency and leaves amount unset', () => {
        expect(approvals[0].urgency).toBe('critical');
        expect(approvals[0].amount).toBe(0);
        expect(approvals[0].waiting).toBe('12m');
    });
});

describe('buildWorkflows / performance', () => {
    const sessions = [
        {
            id: 's1',
            clientId: 'client_001',
            label: 'Gyms — Ponce PR',
            status: 'ACTIVE',
            currentStage: 'OUTBOUND_RUNNING',
            totalDurationMs: 3200,
            createdAt: daysAgo(2),
            updatedAt: minutesAgo(11),
        },
        {
            id: 's2',
            clientId: 'client_001',
            label: 'Solar — Q2',
            status: 'COMPLETE',
            currentStage: 'DELIVERED',
            totalDurationMs: 96000,
            createdAt: daysAgo(6),
            updatedAt: daysAgo(1),
        },
        {
            id: 's3',
            clientId: 'client_002',
            label: 'Blocked run',
            status: 'BLOCKED',
            currentStage: 'GATE_2',
            totalDurationMs: 1000,
            createdAt: daysAgo(3),
            updatedAt: hoursAgo(5),
        },
    ];

    it('maps session status onto workflow status', () => {
        const workflows = buildWorkflows(sessions, new Map(), NOW);
        expect(workflows.map((w) => w.status)).toEqual(['running', 'scheduled', 'paused']);
        expect(workflows[0].trigger).toBe('Outbound Running');
        expect(workflows[0].avgDurationSec).toBe(3.2);
    });

    it('counts completions and exceptions', () => {
        const performance = buildWorkflowPerformance(sessions, snapshot.workflowPerformance);
        expect(performance.totalRuns).toBe(3);
        expect(performance.completed).toBe(1);
        expect(performance.exceptions).toBe(1);
        expect(performance.inProgress).toBe(1);
        expect(performance.automationSuccessRate).toBeCloseTo(33.3, 1);
    });

    it('keeps the snapshot when there are no sessions', () => {
        expect(buildWorkflowPerformance([], snapshot.workflowPerformance)).toEqual(
            snapshot.workflowPerformance
        );
    });
});

describe('buildPartners', () => {
    const partners = buildPartners(
        [
            { clientId: 'client_001', company: 'SouthRex Solutions', name: 'Alex' },
            { clientId: 'client_002', company: '', name: 'Sam' },
        ],
        [
            {
                clientId: 'client_001',
                stage: 'active',
                currentHealthScore: 88,
                healthTrend: 'improving',
                healthScoreHistory: '[70, 78, 88]',
                startDate: new Date('2024-08-01T00:00:00.000Z'),
            },
            {
                clientId: 'client_002',
                stage: 'at_risk',
                currentHealthScore: 51,
                healthTrend: 'declining',
                healthScoreHistory: '[]',
                startDate: new Date('2025-02-01T00:00:00.000Z'),
            },
        ],
        [run(), run({ parentAgentId: 'agent-2-outbound' }), run({ clientId: 'client_002' })],
        [
            {
                id: 's1',
                clientId: 'client_001',
                label: 'x',
                status: 'ACTIVE',
                currentStage: 'A',
                totalDurationMs: 0,
                createdAt: NOW,
                updatedAt: NOW,
            },
        ]
    );

    it('derives health from score and stage', () => {
        expect(partners[0].health).toBe('healthy');
        expect(partners[1].health).toBe('at_risk');
    });

    it('counts distinct agents and sessions per client', () => {
        expect(partners[0].agents).toBe(2);
        expect(partners[0].workflows).toBe(1);
        expect(partners[1].agents).toBe(1);
        expect(partners[1].workflows).toBe(0);
    });

    it('leaves money figures at zero — the schema has no source', () => {
        expect(partners[0].revenueProtected).toBe(0);
        expect(partners[0].moneySaved).toBe(0);
    });

    it('falls back to the client id when the company is blank', () => {
        expect(partners[1].name).toBe('client_002');
    });

    it('uses health history for the sparkline', () => {
        expect(partners[0].trend).toEqual([70, 78, 88]);
        expect(partners[1].trend).toEqual([51, 51]);
    });
});

describe('buildKpis', () => {
    it('fills the KPIs that have a source and leaves the rest alone', () => {
        const agents = buildAgents([run(), run({ parentAgentId: 'agent-9-idle', createdAt: daysAgo(4) })], NOW);
        const kpis = buildKpis(snapshot.kpis, {
            stats: [
                { clientId: 'c1', hoursSavedWeek: 40.5, successRate: 97, healthScore: 90 },
                { clientId: 'c2', hoursSavedWeek: 9.5, successRate: 93, healthScore: 80 },
            ],
            agents,
            sessions: [
                {
                    id: 's1',
                    clientId: 'c1',
                    label: 'x',
                    status: 'ACTIVE',
                    currentStage: 'A',
                    totalDurationMs: 0,
                    createdAt: NOW,
                    updatedAt: NOW,
                },
            ],
        });

        const byId = (id: string) => kpis.find((kpi) => kpi.id === id);
        expect(byId('hours-reclaimed')?.value).toBe('50.0');
        expect(byId('agents-active')?.value).toBe('1');
        expect(byId('agents-active')?.of).toBe('/ 2');
        expect(byId('workflows-running')?.value).toBe('1');
        expect(byId('system-health')?.value).toBe('95.0');
        expect(byId('system-health')?.note).toBe('Excellent');

        // No source for these two yet.
        expect(byId('revenue-protected')).toEqual(
            snapshot.kpis.find((kpi) => kpi.id === 'revenue-protected')
        );
    });
});

describe('buildLiveSections', () => {
    it('returns the snapshot untouched when the database is empty', () => {
        const { data, sources } = buildLiveSections(snapshot, emptyRows, NOW);
        expect(data.agents).toEqual(snapshot.agents);
        expect(data.partners).toEqual(snapshot.partners);
        expect(sources).toEqual(ALL_DEMO);
    });

    it('marks only the sections it could fill as live', () => {
        const { data, sources } = buildLiveSections(
            snapshot,
            { ...emptyRows, subAgentRuns: [run()] },
            NOW
        );

        expect(sources.agents).toBe('live');
        expect(sources.kpis).toBe('live');
        expect(sources.leaks).toBe('demo');
        expect(sources.shadowOps).toBe('demo');
        expect(sources.roi).toBe('demo');
        expect(data.leaks).toEqual(snapshot.leaks);
        expect(data.agents).toHaveLength(1);
    });

    it('does not mutate the snapshot', () => {
        const before = JSON.stringify(snapshot.agents);
        buildLiveSections(snapshot, { ...emptyRows, subAgentRuns: [run()] }, NOW);
        expect(JSON.stringify(snapshot.agents)).toBe(before);
    });
});
