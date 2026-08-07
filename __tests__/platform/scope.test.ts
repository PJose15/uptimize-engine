import { describe, expect, it } from 'vitest';
import { getCommandCenterData } from '@/lib/platform/data';
import { getScopedData, partnerName, scopeData, scopeLabel } from '@/lib/platform/scope';

const data = getCommandCenterData();
const partner = data.partners[0];

describe('scopeData — no scope', () => {
    it('returns the snapshot untouched', () => {
        expect(scopeData(data, {})).toBe(data);
    });

    it('ignores an unknown partner id', () => {
        const scoped = scopeData(data, { partner: 'not-a-partner' });
        expect(scoped.partners).toHaveLength(data.partners.length);
        expect(scoped.leaks).toHaveLength(data.leaks.length);
    });
});

describe('scopeData — partner scope', () => {
    const scoped = scopeData(data, { partner: partner.id });

    it('narrows every partner-owned list to that partner', () => {
        expect(scoped.partners).toEqual([partner]);
        expect(scoped.leaks.every((leak) => leak.partner === partner.name)).toBe(true);
        expect(scoped.approvals.every((a) => a.partner === partner.name)).toBe(true);
        expect(scoped.workflows.every((w) => w.partner === partner.name)).toBe(true);
        expect(scoped.shadowOps.every((op) => op.partner === partner.name)).toBe(true);
    });

    it('drops rows belonging to other partners', () => {
        const others = data.leaks.filter((leak) => leak.partner !== partner.name);
        expect(others.length).toBeGreaterThan(0);
        expect(scoped.leaks.length).toBeLessThan(data.leaks.length);
    });

    it('recomputes the money KPIs from the partner record', () => {
        const revenue = scoped.kpis.find((kpi) => kpi.id === 'revenue-protected');
        const saved = scoped.kpis.find((kpi) => kpi.id === 'money-saved');

        // SouthRex protects $612K, so the headline is "$612" with a "K" unit.
        expect(revenue?.value).toBe(`$${Math.round(partner.revenueProtected / 1000)}`);
        expect(revenue?.unit).toBe('K');
        expect(saved?.value).toBe(`$${Math.round(partner.moneySaved / 1000)}`);
    });

    it('apportions portfolio totals below the unscoped figures', () => {
        expect(scoped.roi.returned).toBe(partner.moneySaved);
        expect(scoped.roi.investment).toBeLessThan(data.roi.investment);
        expect(scoped.workflowPerformance.totalRuns).toBeLessThan(
            data.workflowPerformance.totalRuns
        );

        const scopedPeak = Math.max(...scoped.trend.map((point) => point.revenueProtected));
        const fullPeak = Math.max(...data.trend.map((point) => point.revenueProtected));
        expect(scopedPeak).toBeLessThan(fullPeak);
    });

    it('rewrites the executive summary for the partner', () => {
        expect(scoped.executiveSummary).toContain(partner.name);
        expect(scoped.executiveSummary).not.toBe(data.executiveSummary);
    });
});

describe('scopeData — query scope', () => {
    it('matches case-insensitively across list fields', () => {
        const scoped = scopeData(data, { query: 'DUPLICATE' });
        expect(scoped.leaks.length).toBeGreaterThan(0);
        expect(
            scoped.leaks.every((leak) => leak.name.toLowerCase().includes('duplicate'))
        ).toBe(true);
    });

    it('filters agents by name and description', () => {
        const scoped = scopeData(data, { query: 'shadow' });
        expect(scoped.agents.map((agent) => agent.name)).toContain('Shadow Ops Detector');
        expect(scoped.agents.length).toBeLessThan(data.agents.length);
    });

    it('treats a blank query as no query', () => {
        expect(scopeData(data, { query: '   ' }).agents).toHaveLength(data.agents.length);
    });

    it('returns empty lists when nothing matches', () => {
        const scoped = scopeData(data, { query: 'zzzz-no-such-thing' });
        expect(scoped.leaks).toHaveLength(0);
        expect(scoped.agents).toHaveLength(0);
        expect(scoped.partners).toHaveLength(0);
    });

    it('composes with a partner scope', () => {
        const scoped = scopeData(data, { partner: partner.id, query: partner.name });
        expect(scoped.partners).toEqual([partner]);
    });
});

describe('helpers', () => {
    it('reads scope straight off search params', () => {
        expect(getScopedData({ partner: partner.id }).partners).toEqual([partner]);
        expect(getScopedData({}).partners).toHaveLength(data.partners.length);
    });

    it('resolves partner display names', () => {
        expect(partnerName(partner.id)).toBe(partner.name);
        expect(partnerName('nope')).toBeUndefined();
        expect(partnerName()).toBeUndefined();
    });

    it('labels the active scope', () => {
        expect(scopeLabel({})).toBeNull();
        expect(scopeLabel({ partner: partner.id })).toBe(partner.name);
        expect(scopeLabel({ partner: partner.id, q: 'leak' })).toContain('leak');
    });
});
