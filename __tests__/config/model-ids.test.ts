// @vitest-environment node
/**
 * Model id integrity.
 *
 * A wrong model id is not caught by types, lint or any offline test — it fails
 * at the provider API, mid-run, after money has already been spent on earlier
 * agents. Agent 5 carried `claude-sonnet-4-6` and `claude-opus-4-6`, neither of
 * which is a real Anthropic id, on a path reachable from POST /api/agents/run.
 *
 * These tests are the cheap standing check for that class of mistake.
 */
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

import {
    MODEL_TO_PROVIDER,
    MODEL_PRICING,
    MODELS,
    FALLBACK_CHAINS,
    ANTHROPIC_MODE_MODELS,
    isKnownModel,
} from '@/lib/config/models';

/** Model-ish string literals in application code, excluding the registry itself. */
function referencedModelIds(): Array<{ file: string; model: string }> {
    // Comment lines are stripped first: prose that names a bad id (including
    // the comment recording why it was removed) is not a reference to it.
    const out = execSync(
        `grep -rhE "'(claude|gpt-4|gemini-|llama-|mistral-|sonar)[A-Za-z0-9._-]*'" ` +
        `--include='*.ts' app lib ` +
        `| grep -vE "^\\s*(//|\\*|/\\*)" ` +
        `| grep -oE "'(claude|gpt-4|gemini-|llama-|mistral-|sonar)[A-Za-z0-9._-]*'" | sort -u`,
        { encoding: 'utf8' },
    );

    return out
        .split('\n')
        .filter(Boolean)
        .map(s => s.replace(/'/g, ''))
        // Bare provider names and prefixes, not model ids.
        .filter(m => !['gemini', 'mistral', 'sonar'].includes(m))
        .map(model => ({ file: 'app|lib', model }));
}

describe('registry self-consistency', () => {
    it('prices every model it can route to', () => {
        for (const model of Object.keys(MODEL_TO_PROVIDER)) {
            expect(MODEL_PRICING[model], `${model} has a provider but no price`).toBeDefined();
        }
    });

    it('knows a provider for every model it prices', () => {
        for (const model of Object.keys(MODEL_PRICING)) {
            expect(MODEL_TO_PROVIDER[model], `${model} is priced but has no provider`).toBeDefined();
        }
    });

    it('resolves every tier default', () => {
        for (const [tier, model] of Object.entries(MODELS)) {
            expect(isKnownModel(model), `${tier} tier default ${model} is unknown`).toBe(true);
        }
    });

    it('resolves every model in every fallback chain', () => {
        for (const [tier, chain] of Object.entries(FALLBACK_CHAINS)) {
            for (const model of chain) {
                expect(isKnownModel(model), `${tier} chain contains unknown ${model}`).toBe(true);
            }
        }
    });

    it('resolves the provider-pinned mode models', () => {
        for (const [mode, model] of Object.entries(ANTHROPIC_MODE_MODELS)) {
            expect(isKnownModel(model), `anthropic ${mode} model ${model} is unknown`).toBe(true);
            expect(MODEL_TO_PROVIDER[model], `${model} is not an Anthropic model`).toBe('anthropic');
        }
    });
});

describe('model ids referenced in application code', () => {
    const referenced = referencedModelIds();

    it('finds model ids to check', () => {
        expect(referenced.length).toBeGreaterThan(5);
    });

    // Cost estimation has its own older table (lib/costs.ts) holding ids the
    // router never selects, so an id is acceptable if either source knows it.
    it.each(referenced)('$model is known to the registry or the cost table', async ({ model }) => {
        const { PRICING } = await import('@/lib/costs');
        const inCostTable = Object.values(PRICING).some(
            group => model in (group as Record<string, unknown>),
        );

        expect(
            isKnownModel(model) || inCostTable,
            `${model} is referenced in code but unknown to both lib/config/models.ts and lib/costs.ts — ` +
            `it will fail at the provider API or be priced at a wrong default`,
        ).toBe(true);
    });
});
