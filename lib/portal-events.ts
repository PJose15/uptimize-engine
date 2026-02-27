/**
 * Portal Event Logging — Write portal events to database
 */

import { prisma } from './prisma';

/**
 * Log an activity event to the database
 */
export async function logActivityEvent(params: {
    action: string;
    description: string;
    status: string;
    pillar: string;
    toolUsed?: string | null;
    costUsd?: number;
    durationMs?: number;
    pipelineRunId?: string;
    clientId?: string;
}) {
    return prisma.activityEvent.create({
        data: {
            action: params.action,
            description: params.description,
            status: params.status,
            pillar: params.pillar,
            toolUsed: params.toolUsed ?? null,
            costUsd: params.costUsd ?? 0,
            durationMs: params.durationMs ?? 0,
            pipelineRunId: params.pipelineRunId ?? null,
            clientId: params.clientId ?? 'client_001',
        },
    });
}

/**
 * Log an audit entry to the database
 */
export async function logAuditEntry(params: {
    action: string;
    tool: string;
    status: string;
    approvedBy?: string | null;
    costUsd?: number;
    details: string;
    clientId?: string;
}) {
    return prisma.auditEntry.create({
        data: {
            action: params.action,
            tool: params.tool,
            status: params.status,
            approvedBy: params.approvedBy ?? null,
            costUsd: params.costUsd ?? 0,
            details: params.details,
            clientId: params.clientId ?? 'client_001',
        },
    });
}

/**
 * Create an approval item if the action requires approval
 */
export async function createApprovalIfNeeded(params: {
    action: string;
    description: string;
    riskLevel: string;
    affectedSystem: string;
    reason: string;
    clientId?: string;
}) {
    return prisma.approvalItem.create({
        data: {
            action: params.action,
            description: params.description,
            riskLevel: params.riskLevel,
            affectedSystem: params.affectedSystem,
            reason: params.reason,
            status: 'pending',
            clientId: params.clientId ?? 'client_001',
        },
    });
}

/**
 * Recompute and upsert portal stats from the database
 */
export async function refreshPortalStats(clientId: string = 'client_001') {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [actionsToday, totalActionsMonth, pendingApprovals, successCount, totalMonth] = await Promise.all([
        prisma.activityEvent.count({
            where: { clientId, timestamp: { gte: todayStart } },
        }),
        prisma.activityEvent.count({
            where: { clientId, timestamp: { gte: monthStart } },
        }),
        prisma.approvalItem.count({
            where: { clientId, status: 'pending' },
        }),
        prisma.activityEvent.count({
            where: { clientId, timestamp: { gte: monthStart }, status: 'completed' },
        }),
        prisma.activityEvent.count({
            where: { clientId, timestamp: { gte: monthStart } },
        }),
    ]);

    const successRate = totalMonth > 0 ? Math.round((successCount / totalMonth) * 100) : 0;

    // Get existing stats for fields we can't easily compute
    const existing = await prisma.portalStats.findUnique({ where: { clientId } });

    await prisma.portalStats.upsert({
        where: { clientId },
        update: {
            actionsToday,
            totalActionsMonth,
            pendingApprovals,
            successRate,
        },
        create: {
            clientId,
            actionsToday,
            totalActionsMonth,
            pendingApprovals,
            successRate,
            hoursSavedWeek: existing?.hoursSavedWeek ?? 0,
            healthScore: existing?.healthScore ?? 0,
            totalCostMonth: existing?.totalCostMonth ?? 0,
            exceptionsAutoResolved: existing?.exceptionsAutoResolved ?? 0,
        },
    });
}
