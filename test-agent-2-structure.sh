#!/bin/bash

# Agent 2 Structure Validation Test
# This validates the Agent 2 implementation without requiring LLM API calls

echo "======================================================================"
echo "  AGENT 2 STRUCTURE VALIDATION TEST"
echo "======================================================================"
echo ""

PASS=0
FAIL=0
AGENT2_PATH="app/api/agents/run/uptimize/agent-2-outbound-appointment"

# Test function
test_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    echo "✅ $description"
    ((PASS++))
  else
    echo "❌ $description (not found: $file)"
    ((FAIL++))
  fi
}

test_contains() {
  local file=$1
  local pattern=$2
  local description=$3

  if [ -f "$file" ] && grep -q "$pattern" "$file"; then
    echo "✅ $description"
    ((PASS++))
  else
    echo "❌ $description"
    ((FAIL++))
  fi
}

test_executable() {
  local file=$1
  local description=$2

  if [ -f "$file" ] && [ -x "$file" ]; then
    echo "✅ $description"
    ((PASS++))
  else
    echo "❌ $description"
    ((FAIL++))
  fi
}

test_json_valid() {
  local file=$1
  local description=$2

  if [ -f "$file" ] && python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
    echo "✅ $description"
    ((PASS++))
  else
    echo "❌ $description"
    ((FAIL++))
  fi
}

echo "Testing Agent 2 Core Files..."
echo "────────────────────────────────────────────────────────────────────"

test_file "$AGENT2_PATH/agent.ts" "agent.ts exists"
test_file "$AGENT2_PATH/types.ts" "types.ts exists"
test_file "$AGENT2_PATH/schema.json" "schema.json exists"
test_file "$AGENT2_PATH/index.ts" "index.ts exists"
test_file "$AGENT2_PATH/README.md" "README.md exists"
test_file "$AGENT2_PATH/QUICK-REFERENCE.md" "QUICK-REFERENCE.md exists"
test_file "$AGENT2_PATH/test-agent-2.ts" "test-agent-2.ts exists"

echo ""
echo "Testing Schema Validation..."
echo "────────────────────────────────────────────────────────────────────"

test_json_valid "$AGENT2_PATH/schema.json" "schema.json is valid JSON"
test_contains "$AGENT2_PATH/schema.json" "run_metadata" "schema has run_metadata"
test_contains "$AGENT2_PATH/schema.json" "message_library" "schema has message_library"
test_contains "$AGENT2_PATH/schema.json" "bookings" "schema has bookings"
test_contains "$AGENT2_PATH/schema.json" "qualified_lead_summary" "schema has qualified_lead_summary"

echo ""
echo "Testing TypeScript Interfaces..."
echo "────────────────────────────────────────────────────────────────────"

test_contains "$AGENT2_PATH/types.ts" "export interface Agent2Context" "types.ts exports Agent2Context"
test_contains "$AGENT2_PATH/types.ts" "export interface Agent2Result" "types.ts exports Agent2Result"
test_contains "$AGENT2_PATH/types.ts" "export interface OutboundAndBookingOutput" "types.ts exports OutboundAndBookingOutput"
test_contains "$AGENT2_PATH/types.ts" "export interface QualifiedLeadSummary" "types.ts exports QualifiedLeadSummary"

echo ""
echo "Testing Agent Implementation..."
echo "────────────────────────────────────────────────────────────────────"

test_contains "$AGENT2_PATH/agent.ts" "export async function runAgent2OutboundAppointment" "agent.ts exports main function"
test_contains "$AGENT2_PATH/agent.ts" "const SYSTEM_PROMPT" "agent.ts has SYSTEM_PROMPT"
test_contains "$AGENT2_PATH/agent.ts" "OBJECTION HANDLING" "system prompt includes objection handling"
test_contains "$AGENT2_PATH/agent.ts" "FOLLOW-UP ENGINE" "system prompt includes follow-up rules"
test_contains "$AGENT2_PATH/agent.ts" "QUALIFICATION CHECKLIST" "system prompt includes qualification"
test_contains "$AGENT2_PATH/agent.ts" "MESSAGE TRACK TEMPLATES" "system prompt includes message templates"

echo ""
echo "Testing Documentation..."
echo "────────────────────────────────────────────────────────────────────"

test_contains "$AGENT2_PATH/README.md" "Mission" "README has Mission section"
test_contains "$AGENT2_PATH/README.md" "Qualification Framework" "README has Qualification Framework"
test_contains "$AGENT2_PATH/README.md" "Objection Handling" "README has Objection Handling"
test_contains "$AGENT2_PATH/README.md" "No-Show Reduction" "README has No-Show Reduction"
test_contains "$AGENT2_PATH/README.md" "Follow-Up Engine" "README has Follow-Up Engine"

echo ""
echo "Testing Examples..."
echo "────────────────────────────────────────────────────────────────────"

test_file "examples/agent-1-to-agent-2-integration.ts" "Integration example exists"
test_file "examples/api-curl-examples.sh" "Curl examples exist"
test_file "examples/README.md" "Examples README exists"
test_executable "examples/api-curl-examples.sh" "Curl examples are executable"

echo ""
echo "Testing Orchestrator Integration..."
echo "────────────────────────────────────────────────────────────────────"

test_contains "app/api/agents/run/orchestrator.ts" "runAgent2OutboundAppointment" "orchestrator imports Agent 2"
test_contains "app/api/agents/run/orchestrator.ts" "uptimize_agent_2" "orchestrator routes uptimize_agent_2"
test_contains "app/api/agents/run/orchestrator.ts" "outbound_appointment" "orchestrator routes outbound_appointment alias"

echo ""
echo "Testing File Sizes..."
echo "────────────────────────────────────────────────────────────────────"

# Check agent.ts is substantial
if [ -f "$AGENT2_PATH/agent.ts" ]; then
  SIZE=$(wc -c < "$AGENT2_PATH/agent.ts")
  if [ "$SIZE" -gt 5000 ]; then
    echo "✅ agent.ts is substantial (${SIZE} bytes)"
    ((PASS++))
  else
    echo "❌ agent.ts is too small (${SIZE} bytes)"
    ((FAIL++))
  fi
fi

# Check README is comprehensive
if [ -f "$AGENT2_PATH/README.md" ]; then
  SIZE=$(wc -c < "$AGENT2_PATH/README.md")
  if [ "$SIZE" -gt 10000 ]; then
    echo "✅ README.md is comprehensive (${SIZE} bytes)"
    ((PASS++))
  else
    echo "❌ README.md is too small (${SIZE} bytes)"
    ((FAIL++))
  fi
fi

echo ""
echo "======================================================================"
echo "  TEST RESULTS"
echo "======================================================================"
echo ""
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "📊 Total:  $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed! Agent 2 structure is valid."
  echo ""
  echo "📝 Next steps:"
  echo "   1. Review the PR description: PULL_REQUEST.md"
  echo "   2. Create PR at: https://github.com/PJose15/uptimize-engine/pull/new/claude/outbound-appointment-agent-KLdSL"
  echo "   3. Test with live API keys for full validation"
  echo ""
  exit 0
else
  echo "⚠️  Some tests failed. Please review the errors above."
  echo ""
  exit 1
fi
