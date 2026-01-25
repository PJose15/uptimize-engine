/**
 * Agent 5 Test Suite
 * Demonstrates usage of Client Success Agent
 */

import { Agent5ClientSuccess, type Agent5Input, type Agent4HandoffKit } from './index';

/**
 * Mock Agent 4 Handoff Kit for testing
 */
const mockHandoffKit: Agent4HandoffKit = {
  project_id: 'proj_cs_test_001',
  account_id: 'acc_test_solar_agency',
  client_name: 'SolarLeads Pro',

  quickstart_5min: [
    'Log into dashboard at https://app.uptimize.ai',
    'Click "Inbound Lead Router" workflow',
    'Run test with sample lead data',
    'Check Slack for confirmation message',
    'Review auto-created CRM record',
  ],

  daily_sop: [
    'Check Slack #leads channel for new lead notifications (automated)',
    'Review CRM for leads needing follow-up (filtered view auto-created)',
    'Respond to any escalation alerts (P1/P2 only)',
  ],

  weekly_sop: [
    'Review Weekly Win Report (delivered every Monday)',
    'Approve any pending optimization backlog items',
    'Check exception log for recurring patterns',
  ],

  exception_sop: [
    'If lead has missing phone/email: workflow sends to "incomplete leads" queue + notifies team',
    'If lead is duplicate: workflow merges data + notifies original owner',
    'If API fails: workflow retries 3x, then escalates to P2 ticket',
  ],

  training_plan: [
    'Day 1: Quickstart walkthrough (15min)',
    'Day 3: Exception handling review (20min)',
    'Week 2: Advanced features + Phase 2 preview (30min)',
  ],

  admin_notes: [
    'Primary contact: Sarah (Ops Manager)',
    'Secondary: Mike (Sales Director)',
    'Preferred communication: Slack #uptimize-support',
    'Business hours: M-F 9am-6pm EST',
  ],

  baseline_kpis: [
    {
      kpi_name: 'Lead response time',
      baseline_value: '4-6 hours',
      target_value: '<30 minutes',
      measurement_method: 'Time from lead submission to first contact attempt',
    },
    {
      kpi_name: 'Follow-up completion rate',
      baseline_value: '60%',
      target_value: '90%+',
      measurement_method: 'Percentage of leads receiving all scheduled follow-ups',
    },
    {
      kpi_name: 'Data entry errors',
      baseline_value: '15-20/week',
      target_value: '<5/week',
      measurement_method: 'Manual corrections needed in CRM',
    },
    {
      kpi_name: 'Duplicate lead rate',
      baseline_value: '8-10%',
      target_value: '<2%',
      measurement_method: 'Duplicate CRM records created',
    },
  ],

  workflows_delivered: [
    {
      workflow_id: 'wf_inbound_lead_router',
      workflow_name: 'Inbound Lead Router',
      goal: 'Auto-route, enrich, and create CRM records for all inbound leads within 5 minutes',
      exception_paths_top5: [
        'Missing phone/email → queue for manual review',
        'Duplicate lead → merge data + notify owner',
        'Invalid zip code → geocode correction attempt',
        'API rate limit → exponential backoff retry',
        'CRM write failure → log + escalate P2',
      ],
      kpis_affected: [
        'Lead response time',
        'Data entry errors',
        'Duplicate lead rate',
      ],
    },
    {
      workflow_id: 'wf_follow_up_sequencer',
      workflow_name: 'Follow-up Sequencer',
      goal: 'Automated follow-up scheduling and completion tracking',
      exception_paths_top5: [
        'Lead unresponsive after 5 touches → move to long-term nurture',
        'Lead requests different contact method → update preferences',
        'Sales rep manually completes follow-up → sync to tracking',
        'Lead converts before sequence ends → stop sequence',
        'Email bounce → try SMS, then flag for review',
      ],
      kpis_affected: [
        'Follow-up completion rate',
      ],
    },
  ],

  shadow_ops_baseline: [
    'Manual lead data entry from Facebook forms (30min/day)',
    'Copy/paste between systems (WhatsApp → CRM) (45min/day)',
    'Chase sales reps for follow-up status in Slack (1hr/day)',
    'Manual duplicate checking before CRM entry (20min/day)',
    'Reconcile leads vs follow-ups in spreadsheet (2hr/week)',
    'Remember which leads need special handling (tribal knowledge)',
  ],

  exception_library: [
    {
      exception_name: 'Missing contact info (phone or email)',
      frequency: 'daily',
      impact: 'high',
      current_handling: 'Auto-route to incomplete queue + notify ops team',
    },
    {
      exception_name: 'Duplicate lead detected',
      frequency: 'weekly',
      impact: 'medium',
      current_handling: 'Merge data fields + notify original owner + log merge event',
    },
    {
      exception_name: 'CRM API failure',
      frequency: 'weekly',
      impact: 'high',
      current_handling: 'Retry 3x with backoff, then create P2 ticket + log to error queue',
    },
    {
      exception_name: 'Invalid/incomplete address',
      frequency: 'daily',
      impact: 'medium',
      current_handling: 'Attempt geocode correction, fallback to manual review queue',
    },
    {
      exception_name: 'Lead requests callback outside business hours',
      frequency: 'weekly',
      impact: 'low',
      current_handling: 'Schedule for next business day + send confirmation SMS',
    },
  ],
};

/**
 * Mock input for Week 1 (onboarding phase)
 */
const week1Input: Agent5Input = {
  handoff_kit: mockHandoffKit,
  current_week_of: '2026-01-12',
  usage_data: {
    workflows_executed_this_week: 47,
    active_users_this_week: 3,
    exceptions_triggered_this_week: 8,
    avg_exception_resolution_hours: 2.5,
  },
  client_feedback: 'Team loves the Slack notifications! Sarah mentioned the incomplete lead queue is super helpful. Mike asked if we can add appointment booking to Phase 2.',
  open_tickets: [
    {
      ticket_id: 'TKT-001',
      severity: 'P3',
      issue: 'Would like custom Slack message format for high-value leads',
      created_at: '2026-01-10',
    },
  ],
};

/**
 * Mock input for Week 4 (stable adoption phase)
 */
const week4Input: Agent5Input = {
  handoff_kit: mockHandoffKit,
  current_week_of: '2026-02-02',
  usage_data: {
    workflows_executed_this_week: 142,
    active_users_this_week: 5,
    exceptions_triggered_this_week: 3,
    avg_exception_resolution_hours: 1.2,
  },
  client_feedback: 'This is a game changer. We\'re handling 3x the lead volume with the same team size. Ready to talk about adding appointment booking.',
  open_tickets: [],
};

/**
 * Test Runner
 */
async function testAgent5() {
  console.log('🧪 Agent 5 Test Suite\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    console.log('\nTo run this test:');
    console.log('  export ANTHROPIC_API_KEY=your_key_here');
    console.log('  npx tsx test-agent-5.ts\n');
    return;
  }

  const agent = new Agent5ClientSuccess({
    apiKey,
    model: 'claude-opus-4-5-20251101',
    maxTokens: 16000,
    temperature: 0.7,
  });

  try {
    // Test 1: Week 1 Onboarding
    console.log('📋 Test 1: Week 1 Onboarding (FVi7 Phase)');
    console.log('─'.repeat(60));
    const week1Result = await agent.run(week1Input);

    console.log('\n✅ Week 1 Package Generated\n');

    console.log('📊 Onboarding Plan (FVi7):');
    console.log(`  Day 1: ${week1Result.onboarding_plan.day_1.length} tasks`);
    console.log(`  Day 3: ${week1Result.onboarding_plan.day_3.length} tasks`);
    console.log(`  Day 7: ${week1Result.onboarding_plan.day_7.length} tasks`);
    console.log(`  Training sessions: ${week1Result.onboarding_plan.training_sessions.length}`);

    console.log('\n📈 Adoption Dashboard:');
    console.log(`  KPIs tracked: ${week1Result.adoption_dashboard.kpis.length}`);
    console.log(`  Usage signals: ${week1Result.adoption_dashboard.usage_signals.length}`);
    console.log(`  Exceptions this week: ${week1Result.adoption_dashboard.exception_metrics.exceptions_count_week}`);
    console.log(`  Avg resolution time: ${week1Result.adoption_dashboard.exception_metrics.avg_time_to_resolution}`);

    console.log('\n📝 Weekly Win Report:');
    console.log(`  Wins: ${week1Result.weekly_win_report.wins.length}`);
    week1Result.weekly_win_report.wins.forEach((win, i) => {
      console.log(`    ${i + 1}. ${win}`);
    });

    console.log('\n🎯 Shadow Ops Reduction:');
    console.log(`  Before: ${week1Result.shadow_ops_reduction_report.before_list.length} shadow tasks`);
    console.log(`  After: ${week1Result.shadow_ops_reduction_report.after_list.length} shadow tasks`);
    console.log(`  Delta: ${week1Result.shadow_ops_reduction_report.delta_summary}`);

    console.log('\n💚 Client Health Score:');
    console.log(`  Score: ${week1Result.client_health_score.score_0_100}/100`);
    console.log(`  Risk Level: ${week1Result.client_health_score.risk_level.toUpperCase()}`);
    console.log(`  Top Drivers:`);
    week1Result.client_health_score.drivers.slice(0, 3).forEach((driver) => {
      console.log(`    • ${driver}`);
    });

    console.log('\n🔧 Optimization Backlog:');
    console.log(`  Items: ${week1Result.optimization_backlog.length}`);
    const topOptimizations = week1Result.optimization_backlog
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
    topOptimizations.forEach((opt) => {
      console.log(`    [P${opt.priority}] ${opt.item} (impact: ${opt.impact}, effort: ${opt.effort})`);
    });

    console.log('\n🎁 Proof Asset Pipeline:');
    console.log(`  Testimonial plan: ${week1Result.proof_asset_pipeline.testimonial_request_plan.length} steps`);
    console.log(`  Case study outline: ${week1Result.proof_asset_pipeline.case_study_draft_outline.length} sections`);
    console.log(`  ROI points: ${week1Result.proof_asset_pipeline.roi_snapshot_points.length}`);

    console.log('\n🚀 Expansion Map:');
    console.log(`  Phase 2 recommendations: ${week1Result.expansion_map.phase_2_recommendations.length}`);
    if (week1Result.expansion_map.phase_2_recommendations.length > 0) {
      console.log(`    Top: ${week1Result.expansion_map.phase_2_recommendations[0]}`);
    }

    console.log('\n' + '─'.repeat(60));

    // Test 2: Week 4 Stable Phase
    console.log('\n📋 Test 2: Week 4 Stable Adoption Phase');
    console.log('─'.repeat(60));
    const week4Result = await agent.run(week4Input);

    console.log('\n✅ Week 4 Package Generated\n');

    console.log('📈 Adoption Progress:');
    console.log(`  Workflows executed: 47 → 142 (+202%)`);
    console.log(`  Active users: 3 → 5 (+67%)`);
    console.log(`  Exceptions: 8 → 3 (-63%)`);
    console.log(`  Resolution time: 2.5h → 1.2h (-52%)`);

    console.log('\n💚 Client Health Score:');
    console.log(`  Week 1: ${week1Result.client_health_score.score_0_100}/100 (${week1Result.client_health_score.risk_level})`);
    console.log(`  Week 4: ${week4Result.client_health_score.score_0_100}/100 (${week4Result.client_health_score.risk_level})`);

    const scoreDelta = week4Result.client_health_score.score_0_100 - week1Result.client_health_score.score_0_100;
    console.log(`  Change: ${scoreDelta > 0 ? '+' : ''}${scoreDelta} points`);

    console.log('\n📝 Weekly Win Report Highlights:');
    week4Result.weekly_win_report.wins.forEach((win, i) => {
      console.log(`  ${i + 1}. ${win}`);
    });

    console.log('\n🚀 Expansion Readiness:');
    console.log(`  Phase 2 recommendations: ${week4Result.expansion_map.phase_2_recommendations.length}`);
    week4Result.expansion_map.phase_2_recommendations.forEach((rec) => {
      console.log(`    • ${rec}`);
    });

    console.log('\n🎯 Shadow Ops Eliminated:');
    const eliminated = week1Result.shadow_ops_reduction_report.before_list.length -
                      week4Result.shadow_ops_reduction_report.after_list.length;
    console.log(`  ${eliminated} of ${week1Result.shadow_ops_reduction_report.before_list.length} shadow tasks eliminated`);

    console.log('\n' + '─'.repeat(60));

    // Write results to file for inspection
    const fs = await import('fs');
    const outputDir = './test-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      `${outputDir}/agent-5-week1-result.json`,
      JSON.stringify(week1Result, null, 2)
    );
    fs.writeFileSync(
      `${outputDir}/agent-5-week4-result.json`,
      JSON.stringify(week4Result, null, 2)
    );

    console.log('\n📁 Full results saved to:');
    console.log(`  ${outputDir}/agent-5-week1-result.json`);
    console.log(`  ${outputDir}/agent-5-week4-result.json`);

    console.log('\n✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('\nError details:', error.message);
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * Health Score Calculation Test
 */
function testHealthScoreCalculation() {
  console.log('\n🧮 Health Score Calculation Test\n');
  console.log('─'.repeat(60));

  const scenarios = [
    {
      name: 'Healthy Client (Week 4)',
      factors: {
        adoption_score: 28,      // High adoption
        kpi_trend_score: 22,     // Strong KPI improvement
        responsiveness_score: 18, // Very responsive
        friction_score: 14,      // Minimal issues
        expansion_readiness_score: 9, // Asking about next features
      },
    },
    {
      name: 'Watch Client (Week 2)',
      factors: {
        adoption_score: 18,      // Moderate adoption
        kpi_trend_score: 15,     // Some improvement
        responsiveness_score: 12, // Decent responsiveness
        friction_score: 10,      // Some P2 issues
        expansion_readiness_score: 5, // Not thinking about expansion
      },
    },
    {
      name: 'At Risk Client',
      factors: {
        adoption_score: 10,      // Low adoption
        kpi_trend_score: 5,      // Minimal improvement
        responsiveness_score: 8,  // Slow responses
        friction_score: 5,       // Multiple P2s or P1
        expansion_readiness_score: 0, // Not engaged
      },
    },
  ];

  scenarios.forEach((scenario) => {
    const score = Agent5ClientSuccess.calculateHealthScore(scenario.factors);
    const riskLevel = Agent5ClientSuccess.determineRiskLevel(score);

    console.log(`\n${scenario.name}:`);
    console.log(`  Adoption: ${scenario.factors.adoption_score}/30`);
    console.log(`  KPI Trend: ${scenario.factors.kpi_trend_score}/25`);
    console.log(`  Responsiveness: ${scenario.factors.responsiveness_score}/20`);
    console.log(`  Low Friction: ${scenario.factors.friction_score}/15`);
    console.log(`  Expansion Ready: ${scenario.factors.expansion_readiness_score}/10`);
    console.log(`  ──────────────────────`);
    console.log(`  Total Score: ${score}/100`);
    console.log(`  Risk Level: ${riskLevel.toUpperCase()}`);
  });

  console.log('\n' + '─'.repeat(60));
}

/**
 * Run all tests
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       Agent 5 - Client Success Test Suite                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Run health score calculation test (no API needed)
  testHealthScoreCalculation();

  // Run full agent tests (requires API key)
  await testAgent5();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { testAgent5, testHealthScoreCalculation };
