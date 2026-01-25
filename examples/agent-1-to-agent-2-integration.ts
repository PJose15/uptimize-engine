/**
 * Integration Example: Agent 1 → Agent 2 Flow
 *
 * This demonstrates the complete workflow:
 * 1. Agent 1: Market Intelligence & Targeting → produces Target Pack
 * 2. Agent 2: Outbound & Appointment Setter → consumes Target Pack, produces outbound campaign
 *
 * This is the typical "weaponized" sales intelligence → execution flow.
 */

import { runAgent1MarketIntelligence } from "../app/api/agents/run/uptimize/agent-1-market-intelligence";
import { runAgent2OutboundAppointment } from "../app/api/agents/run/uptimize/agent-2-outbound-appointment";
import type { AgentMode } from "../app/api/agents/run/types";

/**
 * Example workflow: From market intelligence to booked calls
 */
export async function runAgent1ToAgent2Workflow(mode: AgentMode = "balanced") {
  console.log("\n" + "=".repeat(70));
  console.log("  UPTIMIZE ENGINE: AGENT 1 → AGENT 2 INTEGRATION");
  console.log("=".repeat(70) + "\n");

  // ============================================================================
  // STEP 1: Run Agent 1 - Market Intelligence & Targeting
  // ============================================================================

  console.log("📊 STEP 1: Running Agent 1 - Market Intelligence & Targeting\n");

  const agent1Task = `
Analyze this list of leads from a private community and create a target pack:

LEAD DATA:
1. Sarah Thompson - Founder @ Scale Your Course
   - Role: CEO, online course creator
   - Pain Signal: "Struggling with follow-up as we scale from 50 to 200 students/month"
   - Context: Just launched new cohort, inbox overwhelmed
   - Channel: LinkedIn
   - Tools: Uses ConvertKit, Slack

2. Mike Rodriguez - Operations Director @ Community Mastery
   - Role: Ops Director, community manager
   - Pain Signal: "No visibility into which members need follow-up or engagement"
   - Context: Community grew 3x last quarter (now 500+ members)
   - Channel: Email
   - Tools: Circle, Slack, Airtable

3. Jessica Chen - Founder @ Digital Products Academy
   - Role: Solo founder
   - Pain Signal: "60%+ no-show rate on sales calls is killing my business"
   - Context: Just launched new product, need better show rates immediately
   - Channel: LinkedIn
   - Tools: Calendly, Gmail, Notion

4. David Park - COO @ Coaching Collective
   - Role: COO, manages 5 coaches
   - Pain Signal: "Manual follow-up tasks eating 20+ hours/week across the team"
   - Context: Hiring 3 more coaches next quarter, need scalable system
   - Channel: Email
   - Tools: HubSpot, Zoom, Google Workspace

5. Amanda Liu - Creator @ Mindful Marketing
   - Role: Solo creator & consultant
   - Pain Signal: "Leads slip through the cracks between IG DMs, email, and my CRM"
   - Context: Growing fast but can't keep up with multi-channel followup
   - Channel: LinkedIn + IG
   - Tools: ActiveCampaign, ManyChat, Instagram

INSTRUCTIONS:
- Segment by pain type and readiness
- Rank by urgency and authority
- Provide hooks and CTAs for each
- Include confidence scores
  `.trim();

  const agent1Context = {
    segment_focus: "Course creators and community operators with scaling pain",
    pain_categories: ["PAIN_FOLLOWUP", "PAIN_VISIBILITY", "PAIN_NOSHOW", "PAIN_INBOX"],
    min_confidence: 0.6,
    target_count: 5,
    notes: "Focus on decision-makers with urgent scaling triggers"
  };

  const agent1Result = await runAgent1MarketIntelligence(
    agent1Task,
    agent1Context,
    mode
  );

  if (!agent1Result.success) {
    console.log("❌ Agent 1 failed:");
    console.log(`   Error: ${agent1Result.error?.details}`);
    return { agent1: agent1Result, agent2: null };
  }

  console.log("✅ Agent 1 completed successfully!\n");
  console.log(`📋 Target Pack Summary:`);
  console.log(`   Date: ${agent1Result.data?.run_metadata.run_date}`);
  console.log(`   Leads Analyzed: ${agent1Result.data?.run_metadata.total_leads_analyzed}`);
  console.log(`   Leads in Pack: ${agent1Result.data?.run_metadata.leads_in_pack}`);
  console.log(`   Segments: ${agent1Result.data?.segments.length}`);
  console.log(`   Provider: ${agent1Result.metadata?.provider}`);
  console.log(`   Latency: ${agent1Result.metadata?.latencyMs}ms`);

  if (agent1Result.data?.leads && agent1Result.data.leads.length > 0) {
    console.log(`\n   Top 3 Leads:`);
    agent1Result.data.leads.slice(0, 3).forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.name} (${lead.company})`);
      console.log(`      Pain: ${lead.pain_category} | Confidence: ${lead.confidence_score}`);
      console.log(`      Hook: ${lead.hook_angle.substring(0, 60)}...`);
    });
  }

  // ============================================================================
  // STEP 2: Run Agent 2 - Outbound & Appointment Setter
  // ============================================================================

  console.log("\n" + "─".repeat(70) + "\n");
  console.log("📨 STEP 2: Running Agent 2 - Outbound & Appointment Setter\n");

  const agent2Task = `
Generate a comprehensive outbound campaign for the target pack.

PRIORITIES:
- Focus on high-confidence, high-urgency leads first
- Use problem-first angle for leads with clear pain signals
- Use proof-first angle for skeptical/analytical profiles
- Create 7-12 touch sequences per lead
- Book discovery calls for qualified leads
- Move low-urgency leads to nurture queue

OFFER POSITIONING:
We install a lightweight AI ops layer that handles follow-up, scheduling, and visibility.
Typically reduces manual ops work by 60% and improves response speed 10x.

TARGET OUTCOMES:
- 2-3 booked calls from high-priority leads
- Full follow-up sequences for all leads
- Qualified lead summaries for sales handoff
  `.trim();

  const agent2Context = {
    targetPack: agent1Result.data, // Pass Agent 1 output directly
    calendarAvailability: [
      "Jan 15-17, 10 AM - 12 PM AST",
      "Jan 15-17, 2 PM - 5 PM AST",
      "Jan 18-19, 10 AM - 4 PM AST",
      "Jan 22-24, 9 AM - 3 PM AST"
    ],
    offerPositioning: "AI ops layer that reduces manual work by 60% and stops leads/tasks from slipping",
    proofPoints: [
      "Course creator: Reduced no-show rate from 60% to 22% in 30 days",
      "Community manager: Automated 240 weekly tasks, freed 15 hours/week",
      "SaaS operator: Increased lead response time from 4 hours to 8 minutes",
      "Coaching business: Improved follow-up completion from 35% to 92%",
      "Solo consultant: Unified 3 channels into one automated workflow"
    ],
    timezone: "America/Puerto_Rico",
    channels: ["Email", "LinkedIn"],
    volumeTargets: {
      newOutreach: 5,
      followups: 25,
      goalBookedCalls: 3
    },
    notes: "Prioritize Sarah (course scaling), Jessica (high no-show), and David (team pain). Use async audit offer for busy operators."
  };

  const agent2Result = await runAgent2OutboundAppointment(
    agent2Task,
    agent2Context,
    mode
  );

  if (!agent2Result.success) {
    console.log("❌ Agent 2 failed:");
    console.log(`   Error: ${agent2Result.error?.details}`);
    return { agent1: agent1Result, agent2: agent2Result };
  }

  console.log("✅ Agent 2 completed successfully!\n");
  console.log(`📊 Outbound Campaign Summary:`);
  console.log(`   Run Date: ${agent2Result.data?.run_metadata.run_date}`);
  console.log(`   Channels: ${agent2Result.data?.run_metadata.channels_used.join(', ')}`);
  console.log(`   New Outreach: ${agent2Result.data?.run_metadata.volume_targets.new_outreach}`);
  console.log(`   Follow-ups: ${agent2Result.data?.run_metadata.volume_targets.followups}`);
  console.log(`   Goal Calls: ${agent2Result.data?.run_metadata.volume_targets.goal_booked_calls}`);
  console.log(`   Provider: ${agent2Result.metadata?.provider}`);
  console.log(`   Latency: ${agent2Result.metadata?.latencyMs}ms`);

  if (agent2Result.data) {
    console.log(`\n   📬 Message Library: ${agent2Result.data.message_library.length} leads`);
    console.log(`   🔄 Conversation Updates: ${agent2Result.data.conversation_updates.length} status changes`);
    console.log(`   📅 Bookings: ${agent2Result.data.bookings.length} calls scheduled`);
    console.log(`   🌱 Nurture Queue: ${agent2Result.data.nurture_queue.length} leads queued`);

    // Show sample outreach message
    if (agent2Result.data.message_library.length > 0) {
      console.log(`\n   💬 Sample Outreach (${agent2Result.data.message_library[0].lead_id}):`);
      console.log(`      Channel: ${agent2Result.data.message_library[0].channel}`);
      console.log(`      Problem-First:`);
      console.log(`      "${agent2Result.data.message_library[0].track_messages.problem_first}"`);
      console.log(`\n      Follow-up Sequence: ${agent2Result.data.message_library[0].followup_sequence.length} touches`);

      if (agent2Result.data.message_library[0].followup_sequence.length > 0) {
        const firstFollow = agent2Result.data.message_library[0].followup_sequence[0];
        console.log(`      Touch 2 (Day ${firstFollow.day_offset}, ${firstFollow.angle_type}):`);
        console.log(`      "${firstFollow.message}"`);
      }
    }

    // Show booking details
    if (agent2Result.data.bookings.length > 0) {
      console.log(`\n   📅 Booked Calls:`);
      agent2Result.data.bookings.forEach((booking, i) => {
        console.log(`\n   ${i + 1}. ${booking.lead_id}`);
        console.log(`      Meeting: ${booking.meeting_time_local} (${booking.meeting_type})`);
        console.log(`      Qualification: ${booking.qualified_lead_summary.qualification_level}`);
        console.log(`      Problem: ${booking.qualified_lead_summary.problem}`);
        console.log(`      Impact: ${booking.qualified_lead_summary.impact}`);
        console.log(`      Timeline: ${booking.qualified_lead_summary.timeline}`);
        console.log(`      Recommended Angle: ${booking.qualified_lead_summary.recommended_offer_angle}`);
        console.log(`      Confirmation Steps: ${booking.confirmation_flow.length}`);
      });
    }

    // Show nurture queue
    if (agent2Result.data.nurture_queue.length > 0) {
      console.log(`\n   🌱 Nurture Queue:`);
      agent2Result.data.nurture_queue.forEach((nurture, i) => {
        console.log(`   ${i + 1}. ${nurture.lead_id}`);
        console.log(`      Reason: ${nurture.reason}`);
        console.log(`      Next Touch: +${nurture.next_touch_day_offset} days`);
      });
    }
  }

  // ============================================================================
  // SUMMARY & NEXT STEPS
  // ============================================================================

  console.log("\n" + "=".repeat(70));
  console.log("  WORKFLOW COMPLETE - READY FOR AGENT 3 (SALES CLOSER)");
  console.log("=".repeat(70) + "\n");

  console.log("📈 Pipeline Overview:");
  console.log(`   ✅ Leads Analyzed: ${agent1Result.data?.run_metadata.total_leads_analyzed || 0}`);
  console.log(`   ✅ Target Pack Created: ${agent1Result.data?.run_metadata.leads_in_pack || 0} leads`);
  console.log(`   ✅ Outreach Messages: ${agent2Result.data?.message_library.length || 0} leads`);
  console.log(`   ✅ Calls Booked: ${agent2Result.data?.bookings.length || 0}`);
  console.log(`   ⏳ In Nurture: ${agent2Result.data?.nurture_queue.length || 0}`);

  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Review qualified lead summaries for booked calls`);
  console.log(`   2. Prepare discovery call deck with Agent 3 recommendations`);
  console.log(`   3. Send outreach messages to ${agent2Result.data?.message_library.length || 0} leads`);
  console.log(`   4. Execute follow-up sequences over 21-day period`);
  console.log(`   5. Hand booked calls to Agent 3 (Sales Closer) for conversion`);

  console.log(`\n💰 Expected Outcomes:`);
  if (agent2Result.data?.bookings.length) {
    const hardQualified = agent2Result.data.bookings.filter(
      b => b.qualified_lead_summary.qualification_level === "hard_qualified"
    ).length;
    console.log(`   ${hardQualified} hard-qualified calls → Est. ${Math.round(hardQualified * 0.4)} closes @ 40% rate`);
  }

  console.log("\n");

  return {
    agent1: agent1Result,
    agent2: agent2Result
  };
}

/**
 * Quick API-style test
 */
export async function testViaAPI() {
  console.log("\n" + "=".repeat(70));
  console.log("  API INTEGRATION TEST");
  console.log("=".repeat(70) + "\n");

  console.log("This is how you would call the agents via the API:\n");

  console.log("1️⃣ Agent 1 API Request:");
  console.log("─".repeat(70));
  console.log(`
POST /api/agents/run
{
  "task": "Analyze these 5 leads and create target pack...",
  "agent": "uptimize_agent_1",
  "context": {
    "segment_focus": "Course creators with scaling pain",
    "pain_categories": ["PAIN_FOLLOWUP", "PAIN_VISIBILITY"],
    "target_count": 5
  },
  "mode": "balanced"
}
  `.trim());

  console.log("\n\n2️⃣ Agent 2 API Request (using Agent 1 output):");
  console.log("─".repeat(70));
  console.log(`
POST /api/agents/run
{
  "task": "Generate outbound campaign for target pack...",
  "agent": "uptimize_agent_2",
  "context": {
    "targetPack": { /* Agent 1 output.data.result */ },
    "calendarAvailability": ["Jan 15-17, 10 AM - 4 PM AST"],
    "offerPositioning": "AI ops layer that reduces manual work",
    "proofPoints": ["60% reduction in follow-up time"],
    "channels": ["Email", "LinkedIn"],
    "volumeTargets": {
      "newOutreach": 5,
      "followups": 25,
      "goalBookedCalls": 3
    }
  },
  "mode": "balanced"
}
  `.trim());

  console.log("\n\n3️⃣ Agent Aliases:");
  console.log("─".repeat(70));
  console.log(`   "uptimize_agent_1" or "market_intelligence" → Agent 1`);
  console.log(`   "uptimize_agent_2" or "outbound_appointment" → Agent 2`);

  console.log("\n");
}

// Run the integration if this file is executed directly
if (require.main === module) {
  const mode = (process.argv[2] as AgentMode) || "balanced";
  console.log(`Running in ${mode} mode...\n`);

  runAgent1ToAgent2Workflow(mode)
    .then(() => {
      console.log("\n✅ Integration test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Integration test failed:", error);
      process.exit(1);
    });
}
