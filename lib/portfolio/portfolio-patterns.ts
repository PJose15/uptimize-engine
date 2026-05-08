/**
 * Cross-client pattern detection.
 *
 * Source: UPTIMIZE_PORTFOLIO_MANAGEMENT_SPEC.md, Sprint 14.1
 */

import type { PortfolioClientView } from './portfolio-health';

export type PortfolioPatternType =
  | 'same_dimension_drop'
  | 'expansion_cluster'
  | 'churn_risk_cluster'
  | 'vertical_concentration'
  | 'health_decline_trend';

export type PatternSeverity = 'info' | 'warning' | 'critical';

export interface DetectedPattern {
  pattern_type: PortfolioPatternType;
  severity: PatternSeverity;
  description: string;                         // Specific, actionable
  affected_client_ids: string[];
  verticals_affected: string[];
  week_of: string;                             // ISO week e.g. "2026-W19"
}

export interface PortfolioPatternInputs {
  // Optional per-client per-pillar score signal (for same_dimension_drop)
  pillar_drops?: Record<string, Record<string, number>>;
  // Map of client_id → { pillar: drop_amount }, e.g. { c1: { audit_trail: -8 } }
}

const VERTICAL_CONCENTRATION_THRESHOLD = 0.5;   // 50%+ in single vertical
const CHURN_CLUSTER_MIN = 3;                    // 3+ clients at risk
const EXPANSION_CLUSTER_MIN = 3;                // 3+ clients expansion-ready
const SAME_DIMENSION_MIN = 2;                   // 2+ clients drop on same pillar

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function detectPortfolioPatterns(
  clients: PortfolioClientView[],
  weekOf: Date | string = new Date(),
  inputs: PortfolioPatternInputs = {},
): DetectedPattern[] {
  const week = typeof weekOf === 'string' ? weekOf : isoWeek(weekOf);
  const active = clients.filter(c => c.stage !== 'churned');
  if (active.length === 0) return [];

  const patterns: DetectedPattern[] = [];

  // 1. Churn risk cluster
  const atRisk = active.filter(c => c.current_health_score < 60 || c.stage === 'at_risk');
  if (atRisk.length >= CHURN_CLUSTER_MIN) {
    patterns.push({
      pattern_type: 'churn_risk_cluster',
      severity: 'critical',
      description: `${atRisk.length} clients at risk this week — review intervention plan in Monday brief`,
      affected_client_ids: atRisk.map(c => c.client_id),
      verticals_affected: dedupe(atRisk.map(c => c.vertical)),
      week_of: week,
    });
  }

  // 2. Expansion cluster
  const expansionReady = active.filter(c => c.expansion_ready);
  if (expansionReady.length >= EXPANSION_CLUSTER_MIN) {
    patterns.push({
      pattern_type: 'expansion_cluster',
      severity: 'info',
      description: `${expansionReady.length} clients expansion-ready — schedule conversations this week`,
      affected_client_ids: expansionReady.map(c => c.client_id),
      verticals_affected: dedupe(expansionReady.map(c => c.vertical)),
      week_of: week,
    });
  }

  // 3. Vertical concentration risk
  const verticalCounts = new Map<string, number>();
  for (const c of active) verticalCounts.set(c.vertical, (verticalCounts.get(c.vertical) ?? 0) + 1);
  for (const [vertical, count] of verticalCounts) {
    if (count / active.length >= VERTICAL_CONCENTRATION_THRESHOLD && active.length >= 4) {
      patterns.push({
        pattern_type: 'vertical_concentration',
        severity: 'warning',
        description: `${count} of ${active.length} clients (${Math.round((count / active.length) * 100)}%) are in ${vertical} — diversify pipeline`,
        affected_client_ids: active.filter(c => c.vertical === vertical).map(c => c.client_id),
        verticals_affected: [vertical],
        week_of: week,
      });
    }
  }

  // 4. Same-dimension drop across clients (uses optional pillar_drops input)
  if (inputs.pillar_drops) {
    const pillarToClients = new Map<string, Array<{ client_id: string; drop: number }>>();
    for (const [clientId, drops] of Object.entries(inputs.pillar_drops)) {
      for (const [pillar, drop] of Object.entries(drops)) {
        if (drop < 0) {  // negative = score went down
          const arr = pillarToClients.get(pillar) ?? [];
          arr.push({ client_id: clientId, drop });
          pillarToClients.set(pillar, arr);
        }
      }
    }
    for (const [pillar, dropClients] of pillarToClients) {
      if (dropClients.length >= SAME_DIMENSION_MIN) {
        const ids = dropClients.map(d => d.client_id);
        const verticals = active.filter(c => ids.includes(c.client_id)).map(c => c.vertical);
        patterns.push({
          pattern_type: 'same_dimension_drop',
          severity: dropClients.length >= 3 ? 'warning' : 'info',
          description: `${dropClients.length} clients dropped on ${pillar} this week — playbook may need update`,
          affected_client_ids: ids,
          verticals_affected: dedupe(verticals),
          week_of: week,
        });
      }
    }
  }

  // 5. Portfolio-wide declining health trend
  const trending_down = active.filter(c => c.health_trend === 'declining');
  if (trending_down.length >= Math.ceil(active.length * 0.4) && active.length >= 5) {
    patterns.push({
      pattern_type: 'health_decline_trend',
      severity: 'warning',
      description: `${trending_down.length} of ${active.length} clients trending down — investigate systemic cause`,
      affected_client_ids: trending_down.map(c => c.client_id),
      verticals_affected: dedupe(trending_down.map(c => c.vertical)),
      week_of: week,
    });
  }

  return patterns;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
