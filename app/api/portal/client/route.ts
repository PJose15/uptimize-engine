import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const config = await prisma.clientConfig.findFirst({
            where: { clientId: 'client_001' },
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
        console.error('Portal client API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
