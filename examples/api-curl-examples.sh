#!/bin/bash

# =============================================================================
# UptimizeAI API Examples - Curl Commands
# =============================================================================
#
# These are ready-to-use curl commands for testing the UptimizeAI agent system.
# Make sure your dev server is running: npm run dev
#
# Base URL: http://localhost:3000
# =============================================================================

BASE_URL="http://localhost:3000"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  UptimizeAI API Examples                                           ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# =============================================================================
# EXAMPLE 1: Agent 1 - Market Intelligence & Targeting
# =============================================================================

echo "┌────────────────────────────────────────────────────────────────────┐"
echo "│  EXAMPLE 1: Agent 1 - Market Intelligence & Targeting             │"
echo "└────────────────────────────────────────────────────────────────────┘"
echo ""
echo "Running Agent 1 to analyze leads and create target pack..."
echo ""

AGENT1_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/agents/run" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analyze these leads from a private community and create a target pack:\n\n1. Sarah Thompson - Founder @ Scale Your Course\n   - Pain: Struggling with follow-up as we scale from 50 to 200 students/month\n   - Context: Just launched new cohort, inbox overwhelmed\n   - Channel: LinkedIn\n\n2. Mike Rodriguez - Operations Director @ Community Mastery\n   - Pain: No visibility into which members need follow-up\n   - Context: Community grew 3x last quarter\n   - Channel: Email\n\n3. Jessica Chen - Founder @ Digital Products Academy\n   - Pain: 60%+ no-show rate on sales calls\n   - Context: Just launched new product\n   - Channel: LinkedIn",
    "agent": "uptimize_agent_1",
    "context": {
      "segment_focus": "Course creators and community operators with scaling pain",
      "pain_categories": ["PAIN_FOLLOWUP", "PAIN_VISIBILITY", "PAIN_NOSHOW"],
      "min_confidence": 0.6,
      "target_count": 3,
      "notes": "Focus on decision-makers with urgent scaling triggers"
    },
    "mode": "balanced"
  }')

echo "$AGENT1_RESPONSE" | jq '.'
echo ""
echo "✅ Agent 1 completed. Saving target pack for Agent 2..."
echo ""

# Extract the target pack (this would be saved in a real workflow)
TARGET_PACK=$(echo "$AGENT1_RESPONSE" | jq '.data.result')

# =============================================================================
# EXAMPLE 2: Agent 2 - Outbound & Appointment Setter
# =============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────────┐"
echo "│  EXAMPLE 2: Agent 2 - Outbound & Appointment Setter               │"
echo "└────────────────────────────────────────────────────────────────────┘"
echo ""
echo "Running Agent 2 to generate outbound campaign from target pack..."
echo ""

AGENT2_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/agents/run" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Generate comprehensive outbound campaign for the target pack. Focus on booking discovery calls with high-priority leads. Use problem-first angle for clear pain signals.",
    "agent": "uptimize_agent_2",
    "context": {
      "targetPack": '"${TARGET_PACK}"',
      "calendarAvailability": [
        "Jan 15-17, 10 AM - 4 PM AST",
        "Jan 18-19, 2 PM - 6 PM AST"
      ],
      "offerPositioning": "AI ops layer that reduces manual work by 60% and stops leads from slipping",
      "proofPoints": [
        "Course creator: Reduced no-show rate from 60% to 22% in 30 days",
        "Community manager: Automated 240 weekly tasks, freed 15 hours/week",
        "SaaS operator: Increased lead response time from 4 hours to 8 minutes"
      ],
      "timezone": "America/Puerto_Rico",
      "channels": ["Email", "LinkedIn"],
      "volumeTargets": {
        "newOutreach": 3,
        "followups": 15,
        "goalBookedCalls": 2
      },
      "notes": "Prioritize Sarah (course scaling) and Jessica (high no-show). Use async audit offer for busy operators."
    },
    "mode": "balanced"
  }')

echo "$AGENT2_RESPONSE" | jq '.'
echo ""
echo "✅ Agent 2 completed. Campaign ready for execution!"
echo ""

# =============================================================================
# EXAMPLE 3: Agent 2 Standalone (no Agent 1 target pack)
# =============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────────┐"
echo "│  EXAMPLE 3: Agent 2 Standalone (Manual Lead Data)                 │"
echo "└────────────────────────────────────────────────────────────────────┘"
echo ""
echo "Running Agent 2 with manually provided lead context (no Agent 1)..."
echo ""

curl -s -X POST "${BASE_URL}/api/agents/run" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Generate outbound campaign for this high-intent lead:\n\nName: David Park\nCompany: Coaching Collective\nRole: COO\nPain: Manual follow-up eating 20+ hours/week\nTrigger: Hiring 3 more coaches next quarter\nChannel: Email",
    "agent": "uptimize_agent_2",
    "context": {
      "calendarAvailability": ["Jan 15-17, 10 AM - 12 PM AST"],
      "offerPositioning": "AI ops layer for coaching businesses",
      "proofPoints": ["Coaching business: Improved follow-up completion from 35% to 92%"],
      "channels": ["Email"],
      "volumeTargets": {
        "newOutreach": 1,
        "followups": 7,
        "goalBookedCalls": 1
      },
      "notes": "High urgency, team pain, decision maker. Prioritize same-day booking."
    },
    "mode": "fast"
  }' | jq '.'

echo ""
echo "✅ Standalone Agent 2 completed!"
echo ""

# =============================================================================
# EXAMPLE 4: Quality Mode with Extended Context
# =============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────────┐"
echo "│  EXAMPLE 4: Quality Mode (Anthropic Claude)                       │"
echo "└────────────────────────────────────────────────────────────────────┘"
echo ""
echo "Running Agent 1 in quality mode for best results..."
echo ""

curl -s -X POST "${BASE_URL}/api/agents/run" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analyze these 5 high-value leads with detailed segmentation and confidence scoring:\n\n[Lead data with rich context, pain signals, trigger events, tool stacks, etc.]",
    "agent": "uptimize_agent_1",
    "context": {
      "segment_focus": "Enterprise SaaS operators with revenue operations pain",
      "pain_categories": ["PAIN_FOLLOWUP", "PAIN_VISIBILITY", "PAIN_CRM"],
      "min_confidence": 0.75,
      "target_count": 5,
      "channels": ["Email", "LinkedIn"],
      "geography": "North America",
      "notes": "Focus on VP+ level, $1M+ ARR companies, integration-friendly tech stacks"
    },
    "mode": "quality"
  }' | jq '.'

echo ""
echo "✅ Quality mode completed with Claude!"
echo ""

# =============================================================================
# EXAMPLE 5: Agent Aliases
# =============================================================================

echo ""
echo "┌────────────────────────────────────────────────────────────────────┐"
echo "│  EXAMPLE 5: Using Agent Aliases                                   │"
echo "└────────────────────────────────────────────────────────────────────┘"
echo ""

echo "Agent 1 can be called with:"
echo "  - \"uptimize_agent_1\" (primary ID)"
echo "  - \"market_intelligence\" (alias)"
echo ""

echo "Agent 2 can be called with:"
echo "  - \"uptimize_agent_2\" (primary ID)"
echo "  - \"outbound_appointment\" (alias)"
echo ""

curl -s -X POST "${BASE_URL}/api/agents/run" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Quick analysis of this lead: Sarah - Course Creator - Scaling pain",
    "agent": "market_intelligence",
    "context": { "target_count": 1 },
    "mode": "fast"
  }' | jq '.success, .message, .data.agent'

echo ""

curl -s -X POST "${BASE_URL}/api/agents/run" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Quick outreach for this lead",
    "agent": "outbound_appointment",
    "context": {
      "channels": ["Email"],
      "volumeTargets": { "newOutreach": 1, "followups": 5, "goalBookedCalls": 1 }
    },
    "mode": "fast"
  }' | jq '.success, .message, .data.agent'

echo ""
echo "✅ Aliases work correctly!"
echo ""

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  EXAMPLES COMPLETE                                                 ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📚 What you learned:"
echo "   ✅ How to call Agent 1 for market intelligence"
echo "   ✅ How to pass Agent 1 output to Agent 2"
echo "   ✅ How to use Agent 2 standalone"
echo "   ✅ How to use quality mode for best results"
echo "   ✅ How to use agent aliases"
echo ""
echo "🎯 Next steps:"
echo "   1. Modify the examples with your own lead data"
echo "   2. Save Agent 1 output and pass to Agent 2"
echo "   3. Review the full integration: examples/agent-1-to-agent-2-integration.ts"
echo "   4. Check the README: examples/README.md"
echo ""
echo "💡 Tips:"
echo "   - Use 'balanced' mode for most tasks (default)"
echo "   - Use 'fast' for quick iterations"
echo "   - Use 'quality' for important campaigns"
echo "   - Always pass Agent 1 output to Agent 2 for best results"
echo ""
