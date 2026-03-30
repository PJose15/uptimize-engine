/**
 * Portal Utilities — Shared helpers for portal data derivation
 */

import { prisma } from './prisma';
import { getPermissionChecker } from './governance/tool-permissions';
import type { PillarMetric, PermissionGroup } from '@/app/portal/mock-data';

/**
 * Resolve the clientId from an incoming request's session cookie.
 * Looks up the session token → user → linked ClientConfig.
 * If no ClientConfig exists for the user, creates a default one.
 */
export async function getClientIdFromRequest(request: Request): Promise<string> {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) throw new Error('Unauthenticated');

    // Extract session token from cookies
    const sessionToken = extractSessionToken(cookieHeader);
    if (!sessionToken) throw new Error('No session token');

    // Look up session in DB
    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
        throw new Error('Session expired');
    }

    // Look up client config for this user
    const clientConfig = await prisma.clientConfig.findFirst({
        where: { userId: session.userId },
    });

    if (clientConfig) {
        return clientConfig.clientId;
    }

    // Fallback: check if there's an unlinked client config and adopt it
    // This handles the migration case where existing client_001 has no userId
    const unlinked = await prisma.clientConfig.findFirst({
        where: { userId: null },
    });

    if (unlinked) {
        await prisma.clientConfig.update({
            where: { id: unlinked.id },
            data: { userId: session.userId },
        });
        return unlinked.clientId;
    }

    // Create a default client config + portal stats atomically
    const newClientId = `client_${session.userId.slice(0, 8)}`;
    await prisma.$transaction([
        prisma.clientConfig.create({
            data: {
                clientId: newClientId,
                userId: session.userId,
                name: session.user.username,
                company: 'New Company',
                agentName: 'Agent',
                agentDesc: 'Uptimize operations agent',
                agentStatus: 'active',
                industry: 'general',
            },
        }),
        prisma.portalStats.create({
            data: {
                clientId: newClientId,
                actionsToday: 0,
                hoursSavedWeek: 0,
                pendingApprovals: 0,
                healthScore: 0,
                totalActionsMonth: 0,
                totalCostMonth: 0,
                successRate: 0,
                exceptionsAutoResolved: 0,
            },
        }),
    ]);

    return newClientId;
}

/**
 * Extract session token value from a raw Cookie header string.
 */
function extractSessionToken(cookieHeader: string): string | null {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
        const [name, ...rest] = cookie.split('=');
        if (name.trim() === 'session') {
            return rest.join('=').trim();
        }
    }
    return null;
}

/**
 * Extract 6-pillar metrics from Agent 5 output.
 * Falls back to empty array if data is missing.
 */
export function extractPillarMetrics(agent5Data: unknown): PillarMetric[] {
    if (!agent5Data || typeof agent5Data !== 'object') return [];
    const data = agent5Data as Record<string, unknown>;
    const metrics = data.pillar_metrics || data.pillarMetrics;
    if (!Array.isArray(metrics)) return [];

    return metrics.map((m: Record<string, unknown>) => ({
        pillar: String(m.pillar || ''),
        label: String(m.label || ''),
        icon: String(m.icon || ''),
        before: Number(m.before || 0),
        after: Number(m.after || 0),
        unit: String(m.unit || ''),
        trend: (m.trend as 'up' | 'down' | 'flat') || 'flat',
        description: String(m.description || ''),
    }));
}

/**
 * Extract health score from Agent 5 output.
 */
export function extractHealthScore(agent5Data: unknown): number | null {
    if (!agent5Data || typeof agent5Data !== 'object') return null;
    const data = agent5Data as Record<string, unknown>;
    const score = data.health_score ?? data.healthScore;
    return typeof score === 'number' ? score : null;
}

/**
 * Transform governance tool-permissions into PermissionGroup[] for the portal.
 * Maps the per-agent permission matrix into a category-grouped view.
 */
export function transformPermissions(): PermissionGroup[] {
    const checker = getPermissionChecker();
    const agents = checker.listAgents();

    // Build a category → tools map from all agents
    const categoryMap = new Map<string, {
        icon: string;
        tools: Map<string, {
            id: string;
            name: string;
            access: 'read' | 'write' | 'execute' | 'none';
            description: string;
            last_used: string | null;
        }>;
    }>();

    // Category icons
    const categoryIcons: Record<string, string> = {
        CRM: '👥',
        Email: '✉️',
        Calendar: '📅',
        Slack: '💬',
        Analytics: '📊',
        Internal: '🔧',
        Pipeline: '📦',
        Proposals: '📝',
        Workflows: '⚙️',
        Integrations: '🔗',
        Reports: '📑',
        Deployments: '🚀',
    };

    // Map tool names to categories
    const toolCategoryMap: Record<string, string> = {
        web_search: 'Analytics',
        linkedin_search: 'Analytics',
        review_aggregator: 'Analytics',
        save_target_pack: 'Internal',
        read_crm: 'CRM',
        create_crm_contact: 'CRM',
        send_email: 'Email',
        schedule_meeting: 'Calendar',
        save_campaign: 'Internal',
        read_pipeline_state: 'Pipeline',
        save_proposal: 'Proposals',
        save_audit_findings: 'Internal',
        read_proposal: 'Proposals',
        create_workflow: 'Workflows',
        configure_integration: 'Integrations',
        deploy_agent: 'Deployments',
        save_handoff_kit: 'Internal',
        read_kpis: 'Analytics',
        read_tickets: 'CRM',
        update_health_score: 'Internal',
        create_report: 'Reports',
        create_proof_asset: 'Internal',
    };

    const levelToAccess = (level: string): 'read' | 'write' | 'execute' | 'none' => {
        if (level === 'READ') return 'read';
        if (level === 'WRITE_INTERNAL' || level === 'WRITE_EXTERNAL') return 'write';
        if (level === 'EXECUTE') return 'execute';
        return 'none';
    };

    for (const agent of agents) {
        const perms = checker.getPermissions(agent.agent_id);
        if (!perms) continue;

        for (const tp of perms.tool_permissions) {
            const category = toolCategoryMap[tp.tool_name] || 'Internal';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    icon: categoryIcons[category] || '🔧',
                    tools: new Map(),
                });
            }
            const cat = categoryMap.get(category)!;
            // Use highest access level if tool appears multiple times
            if (!cat.tools.has(tp.tool_name)) {
                cat.tools.set(tp.tool_name, {
                    id: tp.tool_name,
                    name: tp.description,
                    access: levelToAccess(tp.level),
                    description: `Used by ${perms.agent_name}${tp.requires_approval ? ' (requires approval)' : ''}`,
                    last_used: null,
                });
            }
        }
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        icon: data.icon,
        tools: Array.from(data.tools.values()),
    }));
}
