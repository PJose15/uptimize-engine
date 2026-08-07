// @vitest-environment node
/**
 * Structural coverage for learning delivery.
 *
 * A sub-agent that does not splice memory into its prompt, or an orchestrator
 * that never loads memory, fails silently: the run succeeds, the notice is
 * consumed, and the learning simply has no effect. Nothing at runtime catches
 * that, so it is caught here — including for sub-agents added later.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

function files(pattern: string): string[] {
    return execSync(`find ${pattern} -type f -name '*.ts'`, { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
}

const subAgentFiles = files("app/api/agents/run -path '*/subagents/*'");

const orchestratorFiles = [
    ...files("app/api/agents/run/uptimize -name 'subagent-orchestrator.ts'"),
    'app/api/agents/run/uptimize/agent-5-client-success/agent.ts',
    'app/api/agents/run/uptimize/agent-6-closer/agent.ts',
    'app/api/agents/run/uptimize/agent-7-nurture/agent.ts',
    'app/api/agents/run/uptimize/agent-8-intelligence/agent.ts',
    ...files("app/api/agents/run/operational -name 'agent.ts'"),
];

describe('sub-agent prompt delivery', () => {
    it('finds every sub-agent', () => {
        // 13 agents × 2 sub-agents each.
        expect(subAgentFiles.length).toBe(26);
    });

    it.each(subAgentFiles)('%s splices memory into its prompt', (file) => {
        const source = readFileSync(file, 'utf8');

        expect(source).toContain('withMemoryContext');
        // Guards against importing the helper but forgetting to apply it.
        expect(source).toMatch(/withMemoryContext\([\s\S]*?ctx\.memory_context\)/);
    });
});

describe('orchestrator memory loading', () => {
    // Agents 1–5 load through subagent-adapters.ts rather than in their own
    // orchestrators, since the adapter is the seam every caller passes through.
    const selfLoading = orchestratorFiles.filter(f =>
        /agent-(6|7|8|9|10|11|12|13)-/.test(f),
    );

    it('covers agents 6-13', () => {
        expect(selfLoading.length).toBe(8);
    });

    it.each(selfLoading)('%s loads and commits memory', (file) => {
        const source = readFileSync(file, 'utf8');

        expect(source).toContain('loadAgentMemory');
        expect(source).toContain('commitAgentMemory');
        // Acknowledging unconditionally would burn learning on a failed run.
        expect(source).toMatch(/task_completed[\s\S]{0,200}commitAgentMemory/);
    });

    it('routes agents 1-5 through the adapter seam', () => {
        const adapter = readFileSync(
            'app/api/agents/run/uptimize/subagent-adapters.ts',
            'utf8',
        );

        for (const agentId of [
            'agent-1-market-intelligence',
            'agent-2-outbound-appointment',
            'agent-3-sales-engineer',
            'agent-4-systems-builder',
            'agent-5-client-success',
        ]) {
            expect(adapter).toContain(`loadMemory('${agentId}'`);
            expect(adapter).toContain(`commitMemory(memory.loaded, '${agentId}'`);
        }
    });
});
