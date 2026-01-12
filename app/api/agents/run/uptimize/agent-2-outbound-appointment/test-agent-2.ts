/**
 * Test file for Agent 2: Outbound & Appointment Setter
 *
 * This demonstrates how to:
 * 1. Call Agent 2 directly
 * 2. Pass Agent 1 output as context
 * 3. Handle the structured output
 */

import { runAgent2OutboundAppointment } from "./agent";
import type { Agent2Context } from "./types";

/**
 * Example Target Pack from Agent 1
 * This would normally come from running Agent 1 first
 */
const mockTargetPackFromAgent1 = {
  target_pack: {
    run_metadata: {
      run_date: "2025-01-12",
      source_description: "Private community operators, 50-200 leads/month",
      total_leads_analyzed: 10,
      leads_in_pack: 10
    },
    segments: [
      {
        segment_id: "SEG_001",
        segment_name: "Course Creators with Scaling Pain",
        description: "Online course creators experiencing follow-up issues while scaling",
        priority: "high",
        estimated_size: 5
      }
    ],
    leads: [
      {
        lead_id: "LEAD_001",
        name: "Sarah Thompson",
        company: "Scale Your Course",
        role: "Founder & CEO",
        segment_id: "SEG_001",
        channel: "LinkedIn",
        pain_category: "PAIN_FOLLOWUP",
        pain_signal: "Mentioned struggling with lead follow-up while scaling from 50 to 200 students/month",
        trigger_event: "Just launched new cohort, inbox overwhelmed",
        confidence_score: 0.85,
        hook_angle: "AI ops layer for course creator follow-up automation",
        recommended_cta: "15-min leak audit",
        priority_rank: 1,
        notes: "Decision maker, high urgency, familiar with automation tools"
      },
      {
        lead_id: "LEAD_002",
        name: "Mike Rodriguez",
        company: "Community Mastery",
        role: "Operations Director",
        segment_id: "SEG_001",
        channel: "Email",
        pain_category: "PAIN_VISIBILITY",
        pain_signal: "No visibility into which community members need follow-up",
        trigger_event: "Community grew 3x in last quarter",
        confidence_score: 0.78,
        hook_angle: "Dashboard + automation for community engagement tracking",
        recommended_cta: "Quick gap scan call",
        priority_rank: 2,
        notes: "Influencer, uses Slack and Circle for community"
      },
      {
        lead_id: "LEAD_003",
        name: "Jessica Chen",
        company: "Digital Products Academy",
        role: "Founder",
        segment_id: "SEG_001",
        channel: "LinkedIn",
        pain_category: "PAIN_NOSHOW",
        pain_signal: "High no-show rate on sales calls (60%+)",
        trigger_event: "Launched new product, need better show rates",
        confidence_score: 0.82,
        hook_angle: "No-show reduction system with automated reminders",
        recommended_cta: "Show me your current booking flow",
        priority_rank: 3,
        notes: "Solo operator, budget-conscious, needs quick wins"
      }
    ]
  }
};

/**
 * Test 1: Basic Agent 2 execution with minimal context
 */
async function testBasicExecution() {
  console.log("\n=== TEST 1: Basic Agent 2 Execution ===\n");

  const result = await runAgent2OutboundAppointment(
    "Generate outbound campaign for 3 leads from the target pack. Focus on Email and LinkedIn channels.",
    {
      targetPack: mockTargetPackFromAgent1.target_pack,
      calendarAvailability: [
        "Jan 15-17, 10 AM - 4 PM AST",
        "Jan 18, 2 PM - 6 PM AST"
      ],
      offerPositioning: "AI ops layer that reduces manual work and stops leads from slipping",
      proofPoints: [
        "Reduced follow-up time by 60% for SaaS client",
        "Increased show-rate from 45% to 78% for coaching business",
        "Automated 200+ weekly tasks for course creator"
      ],
      channels: ["Email", "LinkedIn"],
      volumeTargets: {
        newOutreach: 3,
        followups: 9,
        goalBookedCalls: 2
      },
      timezone: "America/Puerto_Rico"
    },
    "balanced"
  );

  if (result.success) {
    console.log("✅ Agent 2 executed successfully!");
    console.log(`\n📊 Metadata:`);
    console.log(`   Provider: ${result.metadata?.provider}`);
    console.log(`   Model: ${result.metadata?.model}`);
    console.log(`   Latency: ${result.metadata?.latencyMs}ms`);
    console.log(`   Tokens: ${result.metadata?.tokensUsed || 'N/A'}`);

    if (result.data) {
      console.log(`\n📋 Output Structure:`);
      console.log(`   Run Date: ${result.data.run_metadata.run_date}`);
      console.log(`   Channels: ${result.data.run_metadata.channels_used.join(', ')}`);
      console.log(`   New Outreach Target: ${result.data.run_metadata.volume_targets.new_outreach}`);
      console.log(`   Message Library Entries: ${result.data.message_library.length}`);
      console.log(`   Conversation Updates: ${result.data.conversation_updates.length}`);
      console.log(`   Bookings: ${result.data.bookings.length}`);
      console.log(`   Nurture Queue: ${result.data.nurture_queue.length}`);

      // Show sample message
      if (result.data.message_library.length > 0) {
        const firstMessage = result.data.message_library[0];
        console.log(`\n💬 Sample Message for ${firstMessage.lead_id}:`);
        console.log(`   Channel: ${firstMessage.channel}`);
        console.log(`   Problem-First: ${firstMessage.track_messages.problem_first.substring(0, 100)}...`);
        console.log(`   Follow-up Touches: ${firstMessage.followup_sequence.length}`);
      }

      // Show booking if exists
      if (result.data.bookings.length > 0) {
        const firstBooking = result.data.bookings[0];
        console.log(`\n📅 Sample Booking:`);
        console.log(`   Lead: ${firstBooking.lead_id}`);
        console.log(`   Meeting: ${firstBooking.meeting_time_local} (${firstBooking.meeting_type})`);
        console.log(`   Qualification: ${firstBooking.qualified_lead_summary.qualification_level}`);
        console.log(`   Problem: ${firstBooking.qualified_lead_summary.problem}`);
        console.log(`   Confirmation Steps: ${firstBooking.confirmation_flow.length}`);
      }
    }
  } else {
    console.log("❌ Agent 2 failed:");
    console.log(`   Error Type: ${result.error?.type}`);
    console.log(`   Details: ${result.error?.details}`);
  }

  return result;
}

/**
 * Test 2: Fast mode execution
 */
async function testFastMode() {
  console.log("\n=== TEST 2: Fast Mode Execution ===\n");

  const result = await runAgent2OutboundAppointment(
    "Quick outbound run for 2 high-priority leads. Email only.",
    {
      targetPack: {
        leads: mockTargetPackFromAgent1.target_pack.leads.slice(0, 2)
      },
      channels: ["Email"],
      volumeTargets: {
        newOutreach: 2,
        followups: 6,
        goalBookedCalls: 1
      }
    },
    "fast"
  );

  console.log(result.success ? "✅ Fast mode succeeded" : "❌ Fast mode failed");
  if (result.metadata) {
    console.log(`   Provider: ${result.metadata.provider}`);
    console.log(`   Latency: ${result.metadata.latencyMs}ms`);
  }

  return result;
}

/**
 * Test 3: Quality mode with detailed context
 */
async function testQualityMode() {
  console.log("\n=== TEST 3: Quality Mode with Detailed Context ===\n");

  const detailedContext: Agent2Context = {
    targetPack: mockTargetPackFromAgent1.target_pack,
    calendarAvailability: [
      "Jan 15-17, 10 AM - 12 PM AST",
      "Jan 15-17, 2 PM - 5 PM AST",
      "Jan 18-19, 10 AM - 4 PM AST"
    ],
    offerPositioning: "Lightweight AI ops system that handles follow-up, scheduling, and visibility - typically reduces manual work by 60% and increases response speed by 10x",
    proofPoints: [
      "Course creator: Reduced no-show rate from 60% to 22% in 30 days",
      "Community manager: Automated 240 weekly tasks, freed 15 hours/week",
      "SaaS operator: Increased lead response time from 4 hours to 8 minutes",
      "Coaching business: Improved follow-up completion from 35% to 92%"
    ],
    timezone: "America/Puerto_Rico",
    channels: ["Email", "LinkedIn", "DM"],
    volumeTargets: {
      newOutreach: 10,
      followups: 30,
      goalBookedCalls: 4
    },
    notes: "Focus on course creators and community managers. Prioritize leads with scaling pain and high no-show rates. Use proof-first angle for skeptical leads."
  };

  const result = await runAgent2OutboundAppointment(
    "Generate comprehensive outbound campaign with full follow-up sequences and qualification framework. Prioritize high-intent leads and include objection handling.",
    detailedContext,
    "quality"
  );

  console.log(result.success ? "✅ Quality mode succeeded" : "❌ Quality mode failed");
  if (result.metadata) {
    console.log(`   Provider: ${result.metadata.provider}`);
    console.log(`   Model: ${result.metadata.model}`);
    console.log(`   Latency: ${result.metadata.latencyMs}ms`);
    console.log(`   Tokens: ${result.metadata.tokensUsed || 'N/A'}`);
  }

  if (result.success && result.data) {
    console.log(`\n📊 Detailed Output:`);
    console.log(`   Daily Plan Blocks: ${result.data.outbound_run_sheet.daily_plan.length}`);
    console.log(`   Sequence Rules: ${result.data.outbound_run_sheet.sequence_rules.substring(0, 60)}...`);
    console.log(`   No-Show Protocol: ${result.data.outbound_run_sheet.no_show_protocol.substring(0, 60)}...`);
  }

  return result;
}

/**
 * Test 4: Error handling - minimal context
 */
async function testErrorHandling() {
  console.log("\n=== TEST 4: Error Handling ===\n");

  const result = await runAgent2OutboundAppointment(
    "Generate outbound campaign",
    {}, // Minimal context
    "balanced"
  );

  console.log(result.success ? "✅ Succeeded with minimal context" : "⚠️ Failed with minimal context (expected)");
  if (!result.success) {
    console.log(`   Error Type: ${result.error?.type}`);
    console.log(`   Details: ${result.error?.details}`);
  }

  return result;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log("\n" + "=".repeat(60));
  console.log("  AGENT 2 TEST SUITE");
  console.log("=".repeat(60));

  try {
    await testBasicExecution();
    await testFastMode();
    await testQualityMode();
    await testErrorHandling();

    console.log("\n" + "=".repeat(60));
    console.log("  ALL TESTS COMPLETED");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Test suite failed with error:");
    console.error(error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
