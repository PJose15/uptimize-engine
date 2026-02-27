import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
        },
    });

    console.log('✅ Created admin user:', admin.username);

    // Add sample template
    const template = await prisma.template.upsert({
        where: { name: 'Default Lead Input' },
        update: {},
        create: {
            name: 'Default Lead Input',
            content: `1. Sarah Chen, Operations Director at GrowthScale (200-person SaaS)
   - Currently tracks 500+ leads/month in spreadsheets
   - Team uses WhatsApp groups for lead handoffs
   - Mentioned on LinkedIn: "Spending 3 hours daily on manual lead routing"

2. Marcus Rodriguez, Head of Sales at FitnessPro Network
   - Manages 50+ influencer partnerships via DMs
   - No CRM - uses Notes app and memory
   - Recently posted: "Missed a major collab because message got buried"`,
        },
    });

    console.log('✅ Created template:', template.name);

    // ========================================================================
    // PORTAL DATA
    // ========================================================================

    // ClientConfig
    const clientConfig = await prisma.clientConfig.upsert({
        where: { clientId: 'client_001' },
        update: {},
        create: {
            clientId: 'client_001',
            name: 'Sarah Chen',
            company: 'Meridian Logistics',
            agentName: 'Ops Handler',
            agentDesc: 'Manages freight coordination, driver scheduling, and exception handling',
            agentStatus: 'active',
            industry: 'logistics',
            deployedAt: new Date('2026-01-15T09:00:00Z'),
        },
    });
    console.log('✅ Created client config:', clientConfig.clientId);

    // ActivityEvents (8 entries matching mock data)
    const activityData = [
        {
            id: 'act_001',
            timestamp: new Date('2026-02-25T15:30:00Z'),
            action: 'Processed incoming shipment requests',
            description: 'Reviewed 12 new shipment requests, auto-matched 9 to available carriers based on route and rate history. 3 flagged for manual review.',
            status: 'completed',
            pillar: 'Shadow Ops',
            toolUsed: 'CRM',
            costUsd: 0.02,
            durationMs: 4500,
        },
        {
            id: 'act_002',
            timestamp: new Date('2026-02-25T14:15:00Z'),
            action: 'Resolved driver scheduling conflict',
            description: 'Detected double-booking for Driver #47 (routes ATL→MIA and ATL→JAX). Reassigned JAX route to Driver #52 who had availability.',
            status: 'completed',
            pillar: 'Exceptions',
            toolUsed: 'Calendar',
            costUsd: 0.01,
            durationMs: 3200,
        },
        {
            id: 'act_003',
            timestamp: new Date('2026-02-25T13:45:00Z'),
            action: 'Generated weekly performance report',
            description: 'Compiled KPI report: 94% on-time delivery (up from 87%), 12 exceptions handled (8 auto-resolved), $4,200 estimated savings this week.',
            status: 'completed',
            pillar: 'Audit Trail',
            toolUsed: null,
            costUsd: 0.03,
            durationMs: 8100,
        },
        {
            id: 'act_004',
            timestamp: new Date('2026-02-25T11:00:00Z'),
            action: 'Updated rate sheets from carrier responses',
            description: 'Received 4 carrier rate updates via email. Updated rate comparison spreadsheet. Flagged 2 carriers with >15% increases for review.',
            status: 'completed',
            pillar: 'Knowledge',
            toolUsed: 'Email',
            costUsd: 0.01,
            durationMs: 5600,
        },
        {
            id: 'act_005',
            timestamp: new Date('2026-02-25T10:30:00Z'),
            action: 'Escalated customs hold to ops manager',
            description: 'Shipment #SH-9482 held at customs (missing phytosanitary certificate). Notified ops manager with document requirements and carrier contact.',
            status: 'completed',
            pillar: 'Handoffs',
            toolUsed: 'Slack',
            costUsd: 0.005,
            durationMs: 2100,
        },
        {
            id: 'act_006',
            timestamp: new Date('2026-02-25T09:00:00Z'),
            action: 'Morning status check — all systems operational',
            description: 'Verified 3 active routes on track. No overnight exceptions. 2 deliveries confirmed completed. Updated status board.',
            status: 'completed',
            pillar: 'Channels',
            toolUsed: null,
            costUsd: 0.01,
            durationMs: 3800,
        },
        {
            id: 'act_007',
            timestamp: new Date('2026-02-24T16:00:00Z'),
            action: 'Attempted to send follow-up to stale lead',
            description: 'Lead #L-312 has been inactive for 14 days. Attempted to generate follow-up email but missing last contact notes.',
            status: 'failed',
            pillar: 'Shadow Ops',
            toolUsed: 'Email',
            costUsd: 0.005,
            durationMs: 1200,
        },
        {
            id: 'act_008',
            timestamp: new Date('2026-02-24T14:30:00Z'),
            action: 'Auto-categorized 23 incoming support tickets',
            description: 'Sorted tickets by priority and type. 15 routine (auto-responded), 5 billing (routed to finance), 3 urgent (escalated to on-call).',
            status: 'completed',
            pillar: 'Exceptions',
            toolUsed: 'CRM',
            costUsd: 0.02,
            durationMs: 6700,
        },
    ];

    for (const act of activityData) {
        await prisma.activityEvent.upsert({
            where: { id: act.id },
            update: {},
            create: { ...act, clientId: 'client_001' },
        });
    }
    console.log('✅ Created', activityData.length, 'activity events');

    // ApprovalItems (4 entries matching mock data)
    const approvalData = [
        {
            id: 'apr_001',
            timestamp: new Date('2026-02-25T15:45:00Z'),
            action: 'Send rate negotiation email to FastLane Carriers',
            description: 'Agent wants to send an email to negotiate a 10% rate reduction based on volume commitment. Email draft attached.',
            riskLevel: 'medium',
            affectedSystem: 'Email',
            reason: 'External communication requires approval per governance policy',
            status: 'pending',
            decidedAt: null,
            decidedBy: null,
            note: null,
        },
        {
            id: 'apr_002',
            timestamp: new Date('2026-02-25T14:00:00Z'),
            action: 'Update 15 records in HubSpot CRM',
            description: "Batch update: mark 15 leads as 'contacted' and add follow-up dates based on last interaction.",
            riskLevel: 'medium',
            affectedSystem: 'HubSpot CRM',
            reason: 'Batch operations on >10 records require approval',
            status: 'pending',
            decidedAt: null,
            decidedBy: null,
            note: null,
        },
        {
            id: 'apr_003',
            timestamp: new Date('2026-02-24T16:30:00Z'),
            action: 'Create Slack channel for new client onboarding',
            description: "New client 'Pacific Freight' starting onboarding. Agent wants to create #pacific-freight-ops channel and invite team.",
            riskLevel: 'low',
            affectedSystem: 'Slack',
            reason: 'External system write requires approval',
            status: 'approved',
            decidedAt: new Date('2026-02-24T16:45:00Z'),
            decidedBy: 'Sarah Chen',
            note: 'Approved — go ahead',
        },
        {
            id: 'apr_004',
            timestamp: new Date('2026-02-24T11:00:00Z'),
            action: 'Send automated rate quote to prospect',
            description: 'Prospect requested quote for ATL→LAX corridor. Agent generated competitive rate based on historical data.',
            riskLevel: 'high',
            affectedSystem: 'Email',
            reason: 'Financial communication to external party',
            status: 'denied',
            decidedAt: new Date('2026-02-24T11:30:00Z'),
            decidedBy: 'Sarah Chen',
            note: 'Need to verify the rate — our ATL→LAX rates changed last week',
        },
    ];

    for (const apr of approvalData) {
        await prisma.approvalItem.upsert({
            where: { id: apr.id },
            update: {},
            create: { ...apr, clientId: 'client_001' },
        });
    }
    console.log('✅ Created', approvalData.length, 'approval items');

    // AuditEntries (13 entries matching mock data)
    const auditData = [
        { id: 'aud_001', timestamp: new Date('2026-02-25T15:45:00Z'), action: 'Requested approval: send email to FastLane Carriers', tool: 'Approval Gate', status: 'approved', approvedBy: null, costUsd: 0, details: 'Pending client review' },
        { id: 'aud_002', timestamp: new Date('2026-02-25T15:30:00Z'), action: 'Matched 9 shipments to carriers', tool: 'CRM', status: 'success', approvedBy: null, costUsd: 0.02, details: 'Auto-matched based on route history' },
        { id: 'aud_003', timestamp: new Date('2026-02-25T14:15:00Z'), action: 'Resolved scheduling conflict for Driver #47', tool: 'Calendar', status: 'success', approvedBy: null, costUsd: 0.01, details: 'Reassigned JAX route to Driver #52' },
        { id: 'aud_004', timestamp: new Date('2026-02-25T14:00:00Z'), action: 'Requested approval: batch update 15 CRM records', tool: 'Approval Gate', status: 'approved', approvedBy: null, costUsd: 0, details: 'Pending client review' },
        { id: 'aud_005', timestamp: new Date('2026-02-25T13:45:00Z'), action: 'Generated weekly KPI report', tool: 'Analytics', status: 'success', approvedBy: null, costUsd: 0.03, details: '94% on-time delivery, 12 exceptions handled' },
        { id: 'aud_006', timestamp: new Date('2026-02-25T11:00:00Z'), action: 'Updated carrier rate sheets', tool: 'Email', status: 'success', approvedBy: null, costUsd: 0.01, details: '4 carrier updates processed, 2 flagged' },
        { id: 'aud_007', timestamp: new Date('2026-02-25T10:30:00Z'), action: 'Escalated customs hold to ops manager', tool: 'Slack', status: 'success', approvedBy: null, costUsd: 0.005, details: 'Shipment #SH-9482, missing phytosanitary cert' },
        { id: 'aud_008', timestamp: new Date('2026-02-25T09:00:00Z'), action: 'Morning systems check', tool: 'Internal', status: 'success', approvedBy: null, costUsd: 0.01, details: 'All systems operational, 3 routes on track' },
        { id: 'aud_009', timestamp: new Date('2026-02-24T16:45:00Z'), action: 'Created Slack channel #pacific-freight-ops', tool: 'Slack', status: 'approved', approvedBy: 'Sarah Chen', costUsd: 0.005, details: 'Client onboarding channel' },
        { id: 'aud_010', timestamp: new Date('2026-02-24T16:30:00Z'), action: 'Requested approval: create Slack channel', tool: 'Approval Gate', status: 'approved', approvedBy: 'Sarah Chen', costUsd: 0, details: 'Approved by client' },
        { id: 'aud_011', timestamp: new Date('2026-02-24T14:30:00Z'), action: 'Categorized 23 support tickets', tool: 'CRM', status: 'success', approvedBy: null, costUsd: 0.02, details: '15 auto-responded, 5 routed, 3 escalated' },
        { id: 'aud_012', timestamp: new Date('2026-02-24T11:30:00Z'), action: 'Denied: send rate quote to prospect', tool: 'Approval Gate', status: 'denied', approvedBy: 'Sarah Chen', costUsd: 0, details: 'Rate verification needed' },
        { id: 'aud_013', timestamp: new Date('2026-02-24T11:00:00Z'), action: 'Requested approval: send rate quote email', tool: 'Approval Gate', status: 'denied', approvedBy: 'Sarah Chen', costUsd: 0, details: 'ATL→LAX corridor rate' },
    ];

    for (const aud of auditData) {
        await prisma.auditEntry.upsert({
            where: { id: aud.id },
            update: {},
            create: { ...aud, clientId: 'client_001' },
        });
    }
    console.log('✅ Created', auditData.length, 'audit entries');

    // PortalStats
    await prisma.portalStats.upsert({
        where: { clientId: 'client_001' },
        update: {},
        create: {
            clientId: 'client_001',
            actionsToday: 6,
            hoursSavedWeek: 13.2,
            pendingApprovals: 2,
            healthScore: 92,
            totalActionsMonth: 347,
            totalCostMonth: 4.82,
            successRate: 96,
            exceptionsAutoResolved: 67,
        },
    });
    console.log('✅ Created portal stats');

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
