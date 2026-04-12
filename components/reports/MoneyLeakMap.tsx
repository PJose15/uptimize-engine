'use client';

import type { Agent3Output } from '@/app/api/agents/run/uptimize/agent-3-sales-engineer/types';
import {
  derivePillarCards,
  deriveRiskLevel,
  type PillarCard,
  type RiskLevel,
} from '@/lib/parse-agent3-output';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Layers,
  CheckCircle2,
  ArrowRight,
  Calendar,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MoneyLeakMapProps {
  data: Agent3Output;
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  high: 'border-red-400 dark:border-red-600',
  medium: 'border-amber-400 dark:border-amber-600',
  low: 'border-emerald-400 dark:border-emerald-600',
};

const SEVERITY_BG: Record<string, string> = {
  high: 'bg-red-50 dark:bg-red-900/20',
  medium: 'bg-amber-50 dark:bg-amber-900/20',
  low: 'bg-emerald-50 dark:bg-emerald-900/20',
};

const SEVERITY_BADGE: Record<string, 'error' | 'warning' | 'success'> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
};

function riskBadgeVariant(risk: RiskLevel): 'error' | 'warning' | 'success' {
  switch (risk) {
    case 'Critical': return 'error';
    case 'High': return 'error';
    case 'Medium': return 'warning';
    case 'Low': return 'success';
    default: return 'warning';
  }
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {subtitle && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MoneyLeakMap({ data }: MoneyLeakMapProps) {
  const pillars = derivePillarCards(data);
  const riskLevel = deriveRiskLevel(pillars);
  const valueCalc = data.value_calc;
  const blueprint = data.solution_blueprint;
  const proposal = data.proposal_sow;
  const closePlan = data.close_plan;

  const totalLeakCost = valueCalc?.monthly_value_estimate ?? 0;
  const hoursSaved = valueCalc?.time_saved_per_week_hours ?? 0;

  return (
    <div id="money-leak-map" className="space-y-8">
      {/* ================================================================
          1. EXECUTIVE SUMMARY
      ================================================================ */}
      <section>
        <SectionHeading
          title="Executive Summary"
          subtitle="High-level overview of identified operational leaks"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<DollarSign className="h-5 w-5 text-red-500" />}
            label="Monthly Leak"
            value={`$${totalLeakCost.toLocaleString()}`}
          />
          <MetricCard
            icon={<Layers className="h-5 w-5 text-violet-500" />}
            label="Pillars"
            value={String(pillars.length)}
          />
          <MetricCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            label="Risk Level"
            value={riskLevel}
            badge={<Badge variant={riskBadgeVariant(riskLevel)}>{riskLevel}</Badge>}
          />
          <MetricCard
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            label="Hours / Week"
            value={`${hoursSaved}h`}
          />
        </div>
      </section>

      {/* ================================================================
          2. SIX PILLARS — BEFORE STATE
      ================================================================ */}
      {pillars.length > 0 && (
        <section>
          <SectionHeading
            title="The Money Leak Pillars"
            subtitle="Each pillar represents a category of operational loss"
          />
          <div className="grid md:grid-cols-2 gap-4">
            {pillars.map((pillar, i) => (
              <PillarCardComponent key={i} pillar={pillar} />
            ))}
          </div>
        </section>
      )}

      {/* ================================================================
          3. SOLUTION — WHAT WE BUILD
      ================================================================ */}
      {blueprint && (
        <section>
          <SectionHeading
            title="Solution Blueprint"
            subtitle="Phased approach to eliminating operational leaks"
          />
          <div className="grid md:grid-cols-3 gap-4">
            <PhaseCard
              phase={1}
              label="Foundation"
              block={blueprint.phase_1}
            />
            <PhaseCard
              phase={2}
              label="Expansion"
              block={blueprint.phase_2}
            />
            <PhaseCard
              phase={3}
              label="Optimization"
              block={blueprint.phase_3_optional}
            />
          </div>
          {blueprint.kpis_to_track.length > 0 && (
            <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">
                KPIs to Track
              </p>
              <ul className="text-xs text-violet-600 dark:text-violet-400 space-y-0.5">
                {blueprint.kpis_to_track.map((kpi, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                    {kpi}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ================================================================
          4. THE NUMBERS — BEFORE VS AFTER
      ================================================================ */}
      {valueCalc && (
        <section>
          <SectionHeading
            title="The Numbers"
            subtitle="Before vs After comparison"
          />
          <div className="grid md:grid-cols-2 gap-4">
            {/* Before */}
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400 text-base">
                  Before — Current State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Monthly loss</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      ${totalLeakCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Wasted hours/week</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {hoursSaved}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Risk level</span>
                    <Badge variant={riskBadgeVariant(riskLevel)}>{riskLevel}</Badge>
                  </div>
                </div>
                {valueCalc.assumptions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Assumptions</p>
                    <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5">
                      {valueCalc.assumptions.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* After */}
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <CardHeader>
                <CardTitle className="text-emerald-700 dark:text-emerald-400 text-base">
                  After — With Uptimize
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Monthly savings</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ${totalLeakCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Hours reclaimed/week</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {hoursSaved}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Leak pillars addressed</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {pillars.length}/{pillars.length}
                    </span>
                  </div>
                </div>
                {valueCalc.notes && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{valueCalc.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ================================================================
          5. INVESTMENT
      ================================================================ */}
      {proposal && (
        <section>
          <SectionHeading
            title="Investment"
            subtitle={proposal.summary || 'Pricing options and engagement terms'}
          />
          {proposal.pricing_options.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {proposal.pricing_options.map((opt, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-base">{opt.option_name}</CardTitle>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {opt.price}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{opt.best_for}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                      {opt.what_included.map((item, j) => (
                        <li key={j} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {proposal.timeline && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <Calendar className="h-4 w-4" />
              <span>Timeline: {proposal.timeline}</span>
            </div>
          )}

          {proposal.acceptance_criteria.length > 0 && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Acceptance Criteria
              </p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5">
                {proposal.acceptance_criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ================================================================
          6. NEXT STEPS
      ================================================================ */}
      {closePlan && (
        <section>
          <SectionHeading
            title="Next Steps"
            subtitle="Clear path forward to engagement"
          />
          {closePlan.next_steps.length > 0 && (
            <div className="space-y-2 mb-4">
              {closePlan.next_steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{step}</span>
                </div>
              ))}
            </div>
          )}

          {closePlan.follow_up_schedule.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Day
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {closePlan.follow_up_schedule.map((f, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                    >
                      <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                        +{f.day_offset}d
                      </td>
                      <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                        {f.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      {badge ?? (
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</span>
      )}
    </Card>
  );
}

function PillarCardComponent({ pillar }: { pillar: PillarCard }) {
  return (
    <Card className={`border-l-4 ${SEVERITY_COLORS[pillar.severity]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{pillar.name}</CardTitle>
          <Badge variant={SEVERITY_BADGE[pillar.severity]}>{pillar.severity}</Badge>
        </div>
        {pillar.estimatedCost > 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ~${pillar.estimatedCost.toLocaleString()}/mo impact
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {pillar.findings.map((f, i) => (
            <li
              key={i}
              className={`text-xs p-2 rounded-lg ${SEVERITY_BG[f.severity]}`}
            >
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{f.name}</span>
              <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{f.detail}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PhaseCard({
  phase,
  label,
  block,
}: {
  phase: number;
  label: string;
  block: { goal: string; deliverables: string[]; time_to_value: string; dependencies: string[] };
}) {
  if (!block.goal && block.deliverables.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold">
            {phase}
          </span>
          <CardTitle className="text-base">{label}</CardTitle>
        </div>
        {block.time_to_value && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {block.time_to_value}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {block.goal && (
          <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">{block.goal}</p>
        )}
        {block.deliverables.length > 0 && (
          <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
            {block.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                {d}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
