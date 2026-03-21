import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIdFromRequest } from '@/lib/portal';

export async function GET(request: NextRequest) {
    try {
        const clientId = await getClientIdFromRequest(request);
        const config = await prisma.clientConfig.findFirst({
            where: { clientId },
        });

        if (!config) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: config.clientId,
            name: config.name,
            company: config.company,
            agent: {
                id: `agent_${config.company.toLowerCase().replace(/\s+/g, '_')}_ops`,
                name: config.agentName,
                description: config.agentDesc,
                status: config.agentStatus,
                deployed_at: config.deployedAt.toISOString(),
                industry: config.industry,
            },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'Unauthenticated' || msg === 'No session token' || msg === 'Session expired') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Portal client API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
