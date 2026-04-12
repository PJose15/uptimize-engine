/**
 * V2 Event Dispatcher — fires background jobs after agent completions
 */

import { collectFromAgent3 } from '@/lib/learning/collectors/from-agent3';
import { collectFromAgent4 } from '@/lib/learning/collectors/from-agent4';
import { collectFromAgent5 } from '@/lib/learning/collectors/from-agent5';
import { collectFromAgent6 } from '@/lib/learning/collectors/from-agent6';
import { prisma } from '@/lib/prisma';

export interface DispatchContext {
  clientId: string;
  pipelineRunId?: string;
  sessionId?: string;
  vertical?: string;
}

/** Fire-and-forget: log errors but don't throw */
function fireAndForget(label: string, fn: () => Promise<void>): void {
  fn().catch(err => console.error(`[event-dispatcher] ${label} failed:`, err));
}

// ============================================================================
// AGENT COMPLETION HANDLERS
// ============================================================================

export function onAgent2NurtureQueue(
  entries: Array<{
    leadId: string; company: string; contactName?: string; vertical: string;
    category: 'hot' | 'warm' | 'cold' | 'lost_deal'; reason: string;
    originalPain: string; whatWasTried: string[];
  }>,
  context: DispatchContext,
): void {
  fireAndForget('agent2-nurture', async () => {
    const delayDays: Record<string, number> = { hot: 7, warm: 14, cold: 30, lost_deal: 60 };
    for (const entry of entries) {
      const nextTouch = new Date();
      nextTouch.setDate(nextTouch.getDate() + (delayDays[entry.category] ?? 14));
      await prisma.nurtureRecord.create({
        data: {
          leadId: entry.leadId, company: entry.company, contactName: entry.contactName,
          vertical: entry.vertical, category: entry.category, reason: entry.reason,
          originalPain: entry.originalPain, whatWasTried: JSON.stringify(entry.whatWasTried),
          nextTouch, sourceRunId: context.pipelineRunId, clientId: context.clientId,
        },
      });
    }
  });
}

export function onAgent3Complete(output: { vertical: string; [key: string]: unknown }, context: DispatchContext): void {
  fireAndForget('agent3-learning', async () => {
    await collectFromAgent3(output as Parameters<typeof collectFromAgent3>[0], context.pipelineRunId ?? '');
  });
}

export function onAgent4Complete(output: { vertical: string; [key: string]: unknown }, context: DispatchContext): void {
  fireAndForget('agent4-learning', async () => {
    await collectFromAgent4(output as Parameters<typeof collectFromAgent4>[0], context.pipelineRunId ?? '');
  });
}

export function onAgent5Complete(output: Record<string, unknown>, context: DispatchContext): void {
  fireAndForget('agent5-learning', async () => {
    await collectFromAgent5(output as Parameters<typeof collectFromAgent5>[0], context.pipelineRunId ?? '');
  });

  // Update portfolio health
  if (output.client_health_score !== undefined) {
    fireAndForget('agent5-portfolio', async () => {
      await prisma.clientPortfolio.upsert({
        where: { clientId: context.clientId },
        update: {
          currentHealthScore: output.client_health_score as number,
          expansionReady: (output.expansion_ready as boolean) ?? false,
        },
        create: {
          clientId: context.clientId,
          currentHealthScore: output.client_health_score as number,
          vertical: context.vertical ?? '',
        },
      });
    });
  }
}

export function onAgent6Complete(output: Record<string, unknown>, context: DispatchContext): void {
  fireAndForget('agent6-learning', async () => {
    await collectFromAgent6(output as Parameters<typeof collectFromAgent6>[0], context.pipelineRunId ?? '');
  });

  // Create compliance record on contract signed
  const contractStatus = output.contract_status as { signed?: boolean; retainer_usd?: number } | undefined;
  if (contractStatus?.signed) {
    fireAndForget('agent6-compliance', async () => {
      await prisma.complianceRecord.create({
        data: {
          clientId: context.clientId, recordType: 'contract',
          effectiveDate: new Date(), status: 'active',
        },
      });
      await prisma.clientPortfolio.upsert({
        where: { clientId: context.clientId },
        update: { stage: 'active', retainerUsd: contractStatus.retainer_usd ?? 0 },
        create: { clientId: context.clientId, stage: 'active', vertical: context.vertical ?? '', retainerUsd: contractStatus.retainer_usd ?? 0 },
      });
    });
  }
}
