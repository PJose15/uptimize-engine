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

/**
 * Portfolio fields, extracted by the caller from Agent 5's package.
 *
 * Previously this read `output.client_health_score` and cast it to a number —
 * but that field is an object, so Prisma rejected the Int write and
 * fireAndForget swallowed the error, leaving portfolio health silently never
 * updated. `expansion_ready` was read too and does not exist on the package at
 * all, so it was always false. Both are now the caller's job to derive, with
 * types that make a mistake visible.
 */
export interface Agent5PortfolioUpdate {
  healthScore: number;
  expansionReady: boolean;
}

export function onAgent5Complete(
  output: Record<string, unknown>,
  context: DispatchContext,
  portfolio?: Agent5PortfolioUpdate,
): void {
  fireAndForget('agent5-learning', async () => {
    await collectFromAgent5(output as Parameters<typeof collectFromAgent5>[0], context.pipelineRunId ?? '');
  });

  // A run with no resolvable client would collide on ClientPortfolio.clientId,
  // which is unique — every anonymous run overwriting one bogus row that then
  // skews retainer-weighted portfolio health on the admin dashboard.
  if (!portfolio || !context.clientId || context.clientId === 'unknown') return;

  fireAndForget('agent5-portfolio', async () => {
    await prisma.clientPortfolio.upsert({
      where: { clientId: context.clientId },
      update: {
        currentHealthScore: portfolio.healthScore,
        expansionReady: portfolio.expansionReady,
      },
      create: {
        clientId: context.clientId,
        currentHealthScore: portfolio.healthScore,
        expansionReady: portfolio.expansionReady,
        vertical: context.vertical ?? '',
      },
    });
  });
}

export function onAgent6Complete(output: Record<string, unknown>, context: DispatchContext): void {
  fireAndForget('agent6-learning', async () => {
    await collectFromAgent6(output as Parameters<typeof collectFromAgent6>[0], context.pipelineRunId ?? '');
  });

  // Contract signed handling — supports both legacy and Sprint 10 v2 shapes
  const contractStatus = output.contract_status as
    | {
        signed?: boolean;
        signed_at?: string;
        retainer_usd?: number;
        agreed_terms?: { build_fee_usd?: number; monthly_retainer_usd?: number; payment_terms?: string };
        baa_required?: boolean;
      }
    | undefined;
  const isSigned = Boolean(contractStatus?.signed) || Boolean(contractStatus?.signed_at);

  if (isSigned) {
    const retainer = contractStatus?.agreed_terms?.monthly_retainer_usd ?? contractStatus?.retainer_usd ?? 0;

    fireAndForget('agent6-portfolio', async () => {
      await prisma.clientPortfolio.upsert({
        where: { clientId: context.clientId },
        update: { stage: 'active', retainerUsd: retainer },
        create: { clientId: context.clientId, stage: 'active', vertical: context.vertical ?? '', retainerUsd: retainer },
      });
    });

    // Sprint 13.4 wiring: notify Agent 12 (compliance) of the signed contract.
    // Worker handles ComplianceRecord creation + initial invoice generation.
    fireAndForget('agent6-to-agent12', async () => {
      const { notifyAgent12OfContractSigned } = await import('@/app/api/agents/run/operational/agent-12-compliance/worker');
      await notifyAgent12OfContractSigned({
        clientId: context.clientId,
        signedAt: contractStatus?.signed_at ?? new Date().toISOString(),
        agreedTerms: contractStatus?.agreed_terms,
        baaRequired: contractStatus?.baa_required,
      });
    });
  }
}
