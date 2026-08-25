import { describe, expect, it } from 'vitest';
import { SCHEMA_STRICT_PROVIDER_ORDER } from '@/app/api/agents/run/config';
import { applyResponseValidation, resolveProviderOrder } from '@/app/api/agents/run/fallback';
import { ErrorType, ProviderName } from '@/app/api/agents/run/types';
import { validateAgent2FallbackResponse } from '@/app/api/agents/run/uptimize/agent-2-outbound-appointment/agent';
import {
  AGENT_4_COMPACT_OUTPUT_CONTRACT,
  buildPrompt,
  validateAgent4FallbackResponse,
} from '@/app/api/agents/run/uptimize/agent-4-systems-delivery/agent';

describe('schema-strict agent routing', () => {
  it('prefers Anthropic and retains OpenAI/Gemini as fallbacks', () => {
    expect(SCHEMA_STRICT_PROVIDER_ORDER).toEqual([
      ProviderName.ANTHROPIC,
      ProviderName.OPENAI,
      ProviderName.GEMINI,
    ]);

    expect(resolveProviderOrder('fast', SCHEMA_STRICT_PROVIDER_ORDER)).toEqual(
      SCHEMA_STRICT_PROVIDER_ORDER,
    );
  });

  it('preserves normal mode routing when no override is supplied', () => {
    expect(resolveProviderOrder('balanced')).toEqual([
      ProviderName.OPENAI,
      ProviderName.GEMINI,
      ProviderName.ANTHROPIC,
    ]);
  });
});

describe('Agent 4 bounded output contract', () => {
  it('keeps every required delivery section while bounding response size', () => {
    const requiredSections = [
      'build_plan',
      'data_model',
      'workflow_specs',
      'agent_spec_sheets',
      'qa_plan_and_results',
      'fallback_modes',
      'client_handoff_kit',
      'post_launch_monitoring',
      'audit_trail_spec',
    ];

    for (const section of requiredSections) {
      expect(AGENT_4_COMPACT_OUTPUT_CONTRACT).toContain(section);
    }

    expect(AGENT_4_COMPACT_OUTPUT_CONTRACT).toContain('At most 3 workflows');
    expect(AGENT_4_COMPACT_OUTPUT_CONTRACT).toContain('system_prompt <= 1200 characters');
    expect(AGENT_4_COMPACT_OUTPUT_CONTRACT).toContain('raw valid JSON only');
  });

  it('uses the compact contract instead of embedding the full JSON Schema', () => {
    const prompt = buildPrompt('Create a delivery package');

    expect(prompt).toContain(AGENT_4_COMPACT_OUTPUT_CONTRACT.trim());
    expect(prompt).not.toContain('http://json-schema.org/draft-07/schema#');
    expect(prompt.length).toBeLessThan(12_000);
  });
});
describe('schema-aware fallback validation', () => {
  const successfulResponse = {
    success: true,
    message: '{}',
  };

  it('turns a schema-invalid success into a model error for failover', () => {
    const result = applyResponseValidation(successfulResponse, () => ({
      valid: false,
      details: 'missing workflow_specs',
    }));

    expect(result.success).toBe(false);
    expect(result.error).toEqual({
      type: ErrorType.MODEL_ERROR,
      details: 'missing workflow_specs',
    });
  });

  it('keeps a schema-valid provider response successful', () => {
    const result = applyResponseValidation(successfulResponse, () => ({
      valid: true,
    }));

    expect(result).toBe(successfulResponse);
  });

  it('rejects Agent 2 output with missing required sections', () => {
    const validation = validateAgent2FallbackResponse('{"message_library":[]}');

    expect(validation.valid).toBe(false);
    expect(validation.details).toContain('run_metadata');
  });

  it('accepts a compact, complete Agent 4 delivery package', () => {
    const packageJson = JSON.stringify({
      build_plan: {
        phase_1: {},
        phase_2_optional: {},
        milestones: [],
        dependencies: [],
        change_request_linkage: 'CR-1',
      },
      data_model: {},
      workflow_specs: [],
      agent_spec_sheets: [],
      qa_plan_and_results: {},
      fallback_modes: [],
      client_handoff_kit: {},
      post_launch_monitoring: {},
      audit_trail_spec: {},
    });

    expect(validateAgent4FallbackResponse(packageJson)).toEqual({
      valid: true,
      details: undefined,
    });
  });
});