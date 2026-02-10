/**
 * Agent 1: Market Intelligence & Targeting Tests
 * Uses real API calls
 */

import { describe, it, expect } from 'vitest';
import { runAgent1MarketIntelligence } from '../app/api/agents/run/uptimize/agent-1-market-intelligence/agent';

describe('Agent 1: Market Intelligence', () => {
    const testLeads = `
    1. Sarah Chen, Operations Director at GrowthScale
       - Tracks 500+ leads/month in spreadsheets
       - Pain: "Spending 3 hours daily on manual lead routing"
    
    2. Marcus Rodriguez, Head of Sales at FitnessPro
       - No CRM - uses Notes app
       - Recently said: "Missed a major deal because message got buried"
  `;

    it('should analyze leads and return structured target pack', async () => {
        const result = await runAgent1MarketIntelligence(testLeads, {}, 'fast');

        // Type assertion
        const typedResult = result as {
            success: boolean;
            data?: {
                target_pack_primary?: unknown[];
                target_pack_secondary?: unknown[];
                shadow_ops_insights?: unknown;
            };
            metadata?: {
                provider?: string;
                latencyMs?: number;
            };
        };

        expect(typedResult.success).toBe(true);
        expect(typedResult.data).toBeDefined();
        expect(typedResult.metadata?.provider).toBeDefined();

        // Check data structure
        const { target_pack_primary, target_pack_secondary, shadow_ops_insights } = typedResult.data || {};

        expect(target_pack_primary).toBeDefined();
        expect(Array.isArray(target_pack_primary)).toBe(true);

        // At least one lead should be analyzed
        expect((target_pack_primary?.length || 0) + (target_pack_secondary?.length || 0)).toBeGreaterThan(0);

        // Shadow ops insights should exist
        expect(shadow_ops_insights).toBeDefined();
    }, 120000); // 2 minute timeout

    it('should score leads with fit scores', async () => {
        const result = await runAgent1MarketIntelligence(testLeads, {}, 'fast');

        const typedResult = result as {
            success: boolean;
            data?: {
                target_pack_primary?: Array<{
                    name?: string;
                    fit_score_0_100?: number;
                    shadow_ops_density_0_10?: number;
                }>;
            };
        };

        if (typedResult.data?.target_pack_primary?.length) {
            const firstLead = typedResult.data.target_pack_primary[0];

            // Check for fit score
            expect(firstLead.fit_score_0_100).toBeDefined();
            expect(typeof firstLead.fit_score_0_100).toBe('number');
            expect(firstLead.fit_score_0_100).toBeGreaterThanOrEqual(0);
            expect(firstLead.fit_score_0_100).toBeLessThanOrEqual(100);

            // Check for shadow ops density
            expect(firstLead.shadow_ops_density_0_10).toBeDefined();
            expect(typeof firstLead.shadow_ops_density_0_10).toBe('number');
        }
    }, 120000);

    it('should handle empty input gracefully', async () => {
        const result = await runAgent1MarketIntelligence('', {}, 'fast');

        // Should still return a result structure, even if empty
        expect(result).toBeDefined();
    }, 60000);
});
