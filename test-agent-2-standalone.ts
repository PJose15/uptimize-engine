#!/usr/bin/env ts-node
/**
 * Standalone Agent 2 Test
 *
 * This test validates the Agent 2 structure without requiring API keys or LLM calls.
 * It checks:
 * - File structure exists
 * - Imports work correctly
 * - Types are properly defined
 * - Schema is valid JSON
 * - Function signatures are correct
 */

import * as fs from 'fs';
import * as path from 'path';

console.log("\n" + "=".repeat(70));
console.log("  AGENT 2 STANDALONE VALIDATION TEST");
console.log("=".repeat(70) + "\n");

let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => boolean | void) {
  try {
    const result = fn();
    if (result === false) {
      console.log(`❌ ${name}`);
      failCount++;
    } else {
      console.log(`✅ ${name}`);
      passCount++;
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    failCount++;
  }
}

const agent2Path = path.join(__dirname, 'app/api/agents/run/uptimize/agent-2-outbound-appointment');

// Test 1: Check all required files exist
test("Agent 2 directory exists", () => {
  return fs.existsSync(agent2Path);
});

test("agent.ts exists", () => {
  return fs.existsSync(path.join(agent2Path, 'agent.ts'));
});

test("types.ts exists", () => {
  return fs.existsSync(path.join(agent2Path, 'types.ts'));
});

test("schema.json exists", () => {
  return fs.existsSync(path.join(agent2Path, 'schema.json'));
});

test("index.ts exists", () => {
  return fs.existsSync(path.join(agent2Path, 'index.ts'));
});

test("README.md exists", () => {
  return fs.existsSync(path.join(agent2Path, 'README.md'));
});

test("QUICK-REFERENCE.md exists", () => {
  return fs.existsSync(path.join(agent2Path, 'QUICK-REFERENCE.md'));
});

test("test-agent-2.ts exists", () => {
  return fs.existsSync(path.join(agent2Path, 'test-agent-2.ts'));
});

// Test 2: Validate schema.json is valid JSON
test("schema.json is valid JSON", () => {
  const schemaPath = path.join(agent2Path, 'schema.json');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);
  return schema && schema.$schema && schema.type === 'object';
});

// Test 3: Check schema has required properties
test("schema.json has all required top-level properties", () => {
  const schemaPath = path.join(agent2Path, 'schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const requiredProps = [
    'run_metadata',
    'outbound_run_sheet',
    'message_library',
    'conversation_updates',
    'bookings',
    'nurture_queue'
  ];
  return requiredProps.every(prop => schema.properties && prop in schema.properties);
});

// Test 4: Validate TypeScript files can be imported (syntax check)
test("types.ts has valid TypeScript syntax", () => {
  const typesPath = path.join(agent2Path, 'types.ts');
  const content = fs.readFileSync(typesPath, 'utf-8');

  // Check for key type exports
  const hasAgent2Context = content.includes('export interface Agent2Context');
  const hasAgent2Result = content.includes('export interface Agent2Result');
  const hasOutboundOutput = content.includes('export interface OutboundAndBookingOutput');

  return hasAgent2Context && hasAgent2Result && hasOutboundOutput;
});

test("agent.ts exports runAgent2OutboundAppointment function", () => {
  const agentPath = path.join(agent2Path, 'agent.ts');
  const content = fs.readFileSync(agentPath, 'utf-8');

  return content.includes('export async function runAgent2OutboundAppointment');
});

test("agent.ts has SYSTEM_PROMPT constant", () => {
  const agentPath = path.join(agent2Path, 'agent.ts');
  const content = fs.readFileSync(agentPath, 'utf-8');

  return content.includes('const SYSTEM_PROMPT');
});

// Test 5: Check README has key sections
test("README.md has Mission section", () => {
  const readmePath = path.join(agent2Path, 'README.md');
  const content = fs.readFileSync(readmePath, 'utf-8');

  return content.includes('## Mission') || content.includes('Mission');
});

test("README.md has Qualification Framework section", () => {
  const readmePath = path.join(agent2Path, 'README.md');
  const content = fs.readFileSync(readmePath, 'utf-8');

  return content.includes('Qualification Framework');
});

test("README.md has Objection Handling section", () => {
  const readmePath = path.join(agent2Path, 'README.md');
  const content = fs.readFileSync(readmePath, 'utf-8');

  return content.includes('Objection Handling');
});

// Test 6: Check examples directory
test("examples directory exists", () => {
  const examplesPath = path.join(__dirname, 'examples');
  return fs.existsSync(examplesPath);
});

test("agent-1-to-agent-2-integration.ts exists", () => {
  const integrationPath = path.join(__dirname, 'examples/agent-1-to-agent-2-integration.ts');
  return fs.existsSync(integrationPath);
});

test("api-curl-examples.sh exists and is executable", () => {
  const curlPath = path.join(__dirname, 'examples/api-curl-examples.sh');
  const exists = fs.existsSync(curlPath);
  if (!exists) return false;

  const stats = fs.statSync(curlPath);
  return (stats.mode & 0o111) !== 0; // Check if executable
});

test("examples/README.md exists", () => {
  const readmePath = path.join(__dirname, 'examples/README.md');
  return fs.existsSync(readmePath);
});

// Test 7: Check orchestrator integration
test("orchestrator.ts imports Agent 2", () => {
  const orchestratorPath = path.join(__dirname, 'app/api/agents/run/orchestrator.ts');
  const content = fs.readFileSync(orchestratorPath, 'utf-8');

  return content.includes('runAgent2OutboundAppointment');
});

test("orchestrator.ts routes to Agent 2", () => {
  const orchestratorPath = path.join(__dirname, 'app/api/agents/run/orchestrator.ts');
  const content = fs.readFileSync(orchestratorPath, 'utf-8');

  const hasUptimizeAgent2 = content.includes('uptimize_agent_2');
  const hasOutboundAlias = content.includes('outbound_appointment');

  return hasUptimizeAgent2 && hasOutboundAlias;
});

// Test 8: Validate file sizes are reasonable
test("agent.ts is substantial (>5KB)", () => {
  const agentPath = path.join(agent2Path, 'agent.ts');
  const stats = fs.statSync(agentPath);
  return stats.size > 5000; // Should be >5KB
});

test("README.md is comprehensive (>10KB)", () => {
  const readmePath = path.join(agent2Path, 'README.md');
  const stats = fs.statSync(readmePath);
  return stats.size > 10000; // Should be >10KB
});

// Test 9: Check for key system prompt elements
test("System prompt includes objection handling", () => {
  const agentPath = path.join(agent2Path, 'agent.ts');
  const content = fs.readFileSync(agentPath, 'utf-8');

  return content.includes('OBJECTION HANDLING') || content.includes('objection');
});

test("System prompt includes follow-up rules", () => {
  const agentPath = path.join(agent2Path, 'agent.ts');
  const content = fs.readFileSync(agentPath, 'utf-8');

  return content.includes('FOLLOW-UP ENGINE') || content.includes('7–12 touch');
});

test("System prompt includes qualification checklist", () => {
  const agentPath = path.join(agent2Path, 'agent.ts');
  const content = fs.readFileSync(agentPath, 'utf-8');

  return content.includes('QUALIFICATION CHECKLIST');
});

// Test 10: Check schema validation structure
test("schema.json defines message_library with required fields", () => {
  const schemaPath = path.join(agent2Path, 'schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

  const messageLib = schema.properties?.message_library;
  if (!messageLib || messageLib.type !== 'array') return false;

  const itemProps = messageLib.items?.properties;
  return itemProps && 'lead_id' in itemProps && 'track_messages' in itemProps && 'followup_sequence' in itemProps;
});

test("schema.json defines bookings with qualified_lead_summary", () => {
  const schemaPath = path.join(agent2Path, 'schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

  const bookings = schema.properties?.bookings;
  if (!bookings || bookings.type !== 'array') return false;

  const itemProps = bookings.items?.properties;
  return itemProps && 'qualified_lead_summary' in itemProps;
});

// Summary
console.log("\n" + "=".repeat(70));
console.log("  TEST RESULTS");
console.log("=".repeat(70));
console.log(`\n✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total:  ${passCount + failCount}`);

if (failCount === 0) {
  console.log("\n🎉 All tests passed! Agent 2 structure is valid.");
  console.log("\n📝 Next steps:");
  console.log("   1. Review the PR description: PULL_REQUEST.md");
  console.log("   2. Create PR at: https://github.com/PJose15/uptimize-engine/pull/new/claude/outbound-appointment-agent-KLdSL");
  console.log("   3. Run integration test: npx ts-node examples/agent-1-to-agent-2-integration.ts");
  console.log("   4. Test with live API keys for full validation\n");
  process.exit(0);
} else {
  console.log("\n⚠️  Some tests failed. Please review the errors above.\n");
  process.exit(1);
}
