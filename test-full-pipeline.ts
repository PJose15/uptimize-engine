/**
 * UptimizeAI - Full 5-Agent Pipeline Test
 * 
 * This script demonstrates the complete customer lifecycle automation:
 * Agent 1 (Target) → Agent 2 (Outreach) → Agent 3 (Sales) → Agent 4 (Build) → Agent 5 (Success)
 * 
 * Features:
 * - Full JSON output logging for each agent
 * - Type-safe with proper null handling
 * - Saves results to file for analysis
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Type definitions for agent results
interface AgentResult {
    success: boolean;
    data?: unknown;
    message?: string;
    metadata?: {
        provider?: string;
        model?: string;
        tokensUsed?: number;
        timestamp?: string;
        latencyMs?: number;
    };
    error?: {
        type?: string;
        details?: string;
    };
}

// Dynamic imports to avoid module resolution issues
async function loadAgents() {
    const agent1 = await import('./app/api/agents/run/uptimize/agent-1-market-intelligence/agent');
    const agent2 = await import('./app/api/agents/run/uptimize/agent-2-outbound-appointment/agent');
    const agent3 = await import('./app/api/agents/run/uptimize/agent-3-sales-engineer/agent');
    const agent4 = await import('./app/api/agents/run/uptimize/agent-4-systems-delivery/agent');
    const agent5 = await import('./app/api/agents/run/uptimize/agent-5-client-success/agent');

    return {
        runAgent1: agent1.runAgent1MarketIntelligence,
        runAgent2: agent2.runAgent2OutboundAppointment,
        runAgent3: agent3.runAgent3SalesEngineer,
        runAgent4: agent4.runAgent4SystemsDelivery,
        runAgent5: agent5.runAgent5
    };
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_LEADS = `
Analyze these 5 leads for a B2B automation agency:

1. Sarah Chen, Operations Director at GrowthScale (200-person SaaS)
   - Currently tracks 500+ leads/month in spreadsheets
   - Team uses WhatsApp groups for lead handoffs
   - Mentioned on LinkedIn: "Spending 3 hours daily on manual lead routing"
   
2. Marcus Rodriguez, Head of Sales at FitnessPro Network (fitness influencer community)
   - Manages 50+ influencer partnerships via DMs
   - No CRM - uses Notes app and memory
   - Recently posted: "Missed a major collab because message got buried"

3. Jennifer Walsh, CEO at LegalTech Solutions (legal software startup)
   - Team of 15, scaling to 30 this quarter
   - Uses 5 different tools (Notion, Slack, Email, Calendly, HubSpot)
   - Complained about: "Nobody knows who's following up with which lead"

4. David Kim, Founder at QuantumLeads (lead generation agency)
   - Generates 1000+ leads/week for clients
   - Manual quality scoring before handoff
   - Trigger: Just lost a $50K client due to lead quality issues

5. Priya Patel, Community Manager at DevConnect Hub (developer community)
   - Manages 10K+ member community across Discord, Slack, LinkedIn
   - Tracks engagement in Google Sheets
   - Pain: "Takes 2 hours daily just to respond to all channels"
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function printSeparator(title: string): void {
    console.log('\n' + '═'.repeat(70));
    console.log(`  ${title}`);
    console.log('═'.repeat(70) + '\n');
}

function printSubsection(title: string): void {
    console.log('\n' + '─'.repeat(50));
    console.log(`  ${title}`);
    console.log('─'.repeat(50));
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function safeGet<T>(obj: unknown, ...keys: string[]): T | undefined {
    let current: unknown = obj;
    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[key];
    }
    return current as T | undefined;
}

function safeLength(arr: unknown): number {
    return Array.isArray(arr) ? arr.length : 0;
}

function logFullJson(label: string, data: unknown): void {
    console.log(`\n📄 ${label} (Full JSON):`);
    console.log('─'.repeat(40));
    try {
        console.log(JSON.stringify(data, null, 2));
    } catch {
        console.log('[Unable to stringify data]');
    }
    console.log('─'.repeat(40));
}

function saveResultsToFile(results: Record<string, unknown>): void {
    const outputPath = path.resolve(process.cwd(), 'pipeline-results.json');
    try {
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
        console.log(`\n💾 Results saved to: ${outputPath}`);
    } catch (error) {
        console.error('Failed to save results:', error);
    }
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function runFullPipeline(): Promise<void> {
    const pipelineStartTime = Date.now();
    const results: Record<string, unknown> = {};
    const durations: Record<string, number> = {};

    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║     UPTIMIZE ENGINE - FULL 5-AGENT PIPELINE DEMONSTRATION           ║
║                                                                      ║
║     Agent 1 → Agent 2 → Agent 3 → Agent 4 → Agent 5                 ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

    try {
        const agents = await loadAgents();

        // ====================================================================
        // AGENT 1: Market Intelligence & Targeting
        // ====================================================================
        printSeparator('AGENT 1: Market Intelligence & Targeting');
        console.log('📊 Purpose: Analyze leads, score by fit, identify Shadow Ops density');
        console.log('📥 Input: Raw lead list with context clues');
        console.log('📤 Output: Target Pack with fit scores, pain categories, and hooks\n');

        const agent1StartTime = Date.now();
        console.log('🔄 Running Agent 1...');

        const agent1Result = await agents.runAgent1(SAMPLE_LEADS, {}, 'fast') as AgentResult;
        durations.agent1 = Date.now() - agent1StartTime;

        if (agent1Result.success) {
            console.log(`✅ Agent 1 completed in ${formatDuration(durations.agent1)}`);
            console.log(`   Provider: ${agent1Result.metadata?.provider ?? 'unknown'}`);

            printSubsection('Target Pack Summary');
            const primaryLeads = safeGet<unknown[]>(agent1Result, 'data', 'target_pack_primary') ?? [];
            const secondaryLeads = safeGet<unknown[]>(agent1Result, 'data', 'target_pack_secondary') ?? [];

            console.log(`   Primary Leads: ${safeLength(primaryLeads)}`);
            console.log(`   Secondary Leads: ${safeLength(secondaryLeads)}`);

            if (primaryLeads.length > 0) {
                console.log('\n   📋 Top Leads:');
                primaryLeads.slice(0, 3).forEach((lead: unknown, i: number) => {
                    const name = safeGet<string>(lead, 'name') ?? 'Unknown';
                    const company = safeGet<string>(lead, 'company') ?? 'Unknown';
                    const fitScore = safeGet<number>(lead, 'fit_score_0_100') ?? 0;
                    const shadowOps = safeGet<number>(lead, 'shadow_ops_density_0_10') ?? 0;
                    const painCats = safeGet<string[]>(lead, 'pain_categories') ?? [];

                    console.log(`   ${i + 1}. ${name} (${company})`);
                    console.log(`      Fit Score: ${fitScore}/100`);
                    console.log(`      Shadow Ops Density: ${shadowOps}/10`);
                    console.log(`      Pain: ${painCats.join(', ') || 'N/A'}`);
                });
            }

            const shadowInsights = safeGet<{ top_signals_found?: string[] }>(agent1Result, 'data', 'shadow_ops_insights');
            if (shadowInsights?.top_signals_found) {
                console.log('\n   🔍 Shadow Ops Insights:');
                shadowInsights.top_signals_found.slice(0, 3).forEach((signal: string) => {
                    console.log(`      • ${signal}`);
                });
            }

            // Full JSON output
            logFullJson('Agent 1 Output', agent1Result.data);

            results.agent1 = agent1Result;
        } else {
            console.log(`❌ Agent 1 failed: ${agent1Result.error?.details ?? 'Unknown error'}`);
            return;
        }

        // ====================================================================
        // AGENT 2: Outbound & Appointment Setter
        // ====================================================================
        printSeparator('AGENT 2: Outbound & Appointment Setter');
        console.log('📊 Purpose: Generate outreach campaigns, qualify leads, book meetings');
        console.log('📥 Input: Target Pack from Agent 1');
        console.log('📤 Output: Message library, follow-up sequences, bookings\n');

        const agent2StartTime = Date.now();
        console.log('🔄 Running Agent 2...');

        const agent2Result = await agents.runAgent2(
            `Using the Target Pack, create outreach campaigns for the top leads`,
            {
                targetPack: agent1Result.data,
                calendarAvailability: ['Tuesday 2-4pm', 'Wednesday 10am-12pm', 'Thursday 3-5pm'],
                offerPositioning: 'AI-powered operations automation that eliminates Shadow Ops',
                channels: ['linkedin', 'email']
            },
            'fast'
        ) as AgentResult;
        durations.agent2 = Date.now() - agent2StartTime;

        if (agent2Result.success) {
            console.log(`✅ Agent 2 completed in ${formatDuration(durations.agent2)}`);
            console.log(`   Provider: ${agent2Result.metadata?.provider ?? 'unknown'}`);

            printSubsection('Outbound Campaign Summary');
            const messageLib = safeGet<unknown[]>(agent2Result, 'data', 'message_library') ?? [];
            const convUpdates = safeGet<unknown[]>(agent2Result, 'data', 'conversation_updates') ?? [];
            const bookings = safeGet<unknown[]>(agent2Result, 'data', 'bookings') ?? [];
            const nurtureQueue = safeGet<unknown[]>(agent2Result, 'data', 'nurture_queue') ?? [];

            console.log(`   📬 Message Library: ${safeLength(messageLib)} leads`);
            console.log(`   🔄 Pipeline Updates: ${safeLength(convUpdates)}`);
            console.log(`   📅 Bookings: ${safeLength(bookings)}`);
            console.log(`   🌱 Nurture Queue: ${safeLength(nurtureQueue)}`);

            if (messageLib.length > 0) {
                const firstMsg = messageLib[0];
                const patternInterrupt = safeGet<string>(firstMsg, 'track_messages', 'pattern_interrupt') ?? 'N/A';
                console.log('\n   💬 Sample Message (Pattern Interrupt):');
                console.log(`      "${patternInterrupt.substring(0, 100)}..."`);
            }

            // Full JSON output
            logFullJson('Agent 2 Output', agent2Result.data);

            results.agent2 = agent2Result;
        } else {
            console.log(`❌ Agent 2 failed: ${agent2Result.error?.details ?? 'Unknown error'}`);
            return;
        }

        // ====================================================================
        // AGENT 3: Sales Engineer & Offer Architect
        // ====================================================================
        printSeparator('AGENT 3: Sales Engineer & Offer Architect');
        console.log('📊 Purpose: Run discovery, map Shadow Ops, create proposal/SOW');
        console.log('📥 Input: Qualified lead summary from Agent 2');
        console.log('📤 Output: Shadow Ops map, exception library, proposal, handoff spec\n');

        const agent3StartTime = Date.now();
        console.log('🔄 Running Agent 3...');

        // Get qualified lead from Agent 2 bookings or use fallback
        const bookingsArr = safeGet<unknown[]>(agent2Result, 'data', 'bookings') ?? [];
        const qualifiedLead = bookingsArr.length > 0
            ? safeGet<unknown>(bookingsArr[0], 'qualified_lead_summary') ?? {}
            : {
                problem: 'Manual lead routing taking 3+ hours daily',
                impact: '$50K+ in lost deals from missed follow-ups',
                urgency: 'Lost major client last month',
                stack: ['Google Sheets', 'WhatsApp', 'Gmail'],
                shadow_ops_off_system_examples: ['Tracks leads in memory', 'WhatsApp handoffs']
            };

        const agent3Result = await agents.runAgent3(
            `Run discovery and create proposal for lead with high Shadow Ops density`,
            {
                qualified_lead_brief: qualifiedLead,
                call_context: {
                    call_notes: 'Prospect mentioned spending 3 hours on manual routing. Team uses WhatsApp for everything.',
                    call_duration_minutes: 45
                },
                mode: 'proposal_generation'
            },
            'fast'
        ) as AgentResult;
        durations.agent3 = Date.now() - agent3StartTime;

        if (agent3Result.success) {
            console.log(`✅ Agent 3 completed in ${formatDuration(durations.agent3)}`);
            console.log(`   Provider: ${agent3Result.metadata?.provider ?? 'unknown'}`);

            printSubsection('Sales Package Summary');

            const shadowOpsMap = safeGet<{ top_invisible_tasks_ranked?: unknown[] }>(agent3Result, 'data', 'shadow_ops_map');
            if (shadowOpsMap?.top_invisible_tasks_ranked) {
                console.log('\n   🔍 Shadow Ops Map:');
                shadowOpsMap.top_invisible_tasks_ranked.slice(0, 3).forEach((task: unknown) => {
                    const taskName = safeGet<string>(task, 'task') ?? 'Unknown';
                    const freq = safeGet<string>(task, 'frequency') ?? 'N/A';
                    const impact = safeGet<string>(task, 'impact') ?? 'N/A';
                    console.log(`      • ${taskName} (${freq}, ${impact} impact)`);
                });
            }

            const exceptionLib = safeGet<{ top_exceptions_ranked?: unknown[] }>(agent3Result, 'data', 'exception_library');
            if (exceptionLib?.top_exceptions_ranked) {
                console.log('\n   ⚠️ Exception Library:');
                exceptionLib.top_exceptions_ranked.slice(0, 3).forEach((ex: unknown) => {
                    const name = safeGet<string>(ex, 'exception_name') ?? 'Unknown';
                    const current = safeGet<string>(ex, 'current_handling') ?? 'N/A';
                    const desired = safeGet<string>(ex, 'desired_handling') ?? 'N/A';
                    console.log(`      • ${name}: ${current} → ${desired}`);
                });
            }

            const valueCalc = safeGet<{ time_saved_per_week_hours?: number; monthly_value_estimate?: number }>(agent3Result, 'data', 'value_calc');
            if (valueCalc) {
                console.log('\n   💰 Value Calculation:');
                console.log(`      Hours saved/week: ${valueCalc.time_saved_per_week_hours ?? 'N/A'}`);
                console.log(`      Monthly value: $${valueCalc.monthly_value_estimate ?? 'N/A'}`);
            }

            const handoff = safeGet<{ build_modules?: string[] }>(agent3Result, 'data', 'handoff_to_agent4_spec');
            if (handoff?.build_modules) {
                console.log('\n   📦 Handoff to Agent 4:');
                console.log(`      Build Modules: ${handoff.build_modules.join(', ')}`);
            }

            // Full JSON output
            logFullJson('Agent 3 Output', agent3Result.data);

            results.agent3 = agent3Result;
        } else {
            console.log(`❌ Agent 3 failed: ${agent3Result.error?.details ?? 'Unknown error'}`);
            return;
        }

        // ====================================================================
        // AGENT 4: Systems Builder & Delivery
        // ====================================================================
        printSeparator('AGENT 4: Systems Builder & Delivery');
        console.log('📊 Purpose: Convert proposal to production system with SOPs');
        console.log('📥 Input: Build spec from Agent 3');
        console.log('📤 Output: Workflow specs, exception paths, handoff kit\n');

        const agent4StartTime = Date.now();
        console.log('🔄 Running Agent 4...');

        // Build handoff spec from Agent 3 or use fallback
        const agent3Handoff = safeGet<{
            build_modules?: string[];
            integrations?: string[];
            risks?: string[];
            definition_of_done?: string[];
            top_exceptions_to_handle?: string[];
            audit_trail_fields_required?: string[];
        }>(agent3Result, 'data', 'handoff_to_agent4_spec');

        const handoffSpec = {
            buildModules: agent3Handoff?.build_modules ?? ['Lead Intake Automation', 'DM Aggregation', 'Alert System'],
            integrations: agent3Handoff?.integrations ?? ['Slack', 'Google Sheets', 'WhatsApp'],
            risks: agent3Handoff?.risks ?? ['WhatsApp API limitations', 'Data migration complexity'],
            definitionOfDone: agent3Handoff?.definition_of_done ?? ['All leads auto-routed', 'VIP alerts working', 'Audit trail complete'],
            topExceptionsToHandle: agent3Handoff?.top_exceptions_to_handle ?? ['VIP lead missed', 'Duplicate lead', 'Invalid data'],
            auditTrailFieldsRequired: agent3Handoff?.audit_trail_fields_required ?? ['lead_source', 'first_response_time', 'escalation_timestamp']
        };

        const agent4Result = await agents.runAgent4(
            `Create delivery package for lead automation system`,
            {
                handoffSpec,
                clientTools: {
                    available: ['Slack', 'Google Workspace', 'Zapier'],
                    restricted: ['Direct WhatsApp API']
                },
                targetTimelineDays: 14
            },
            'fast'
        ) as AgentResult;
        durations.agent4 = Date.now() - agent4StartTime;

        if (agent4Result.success) {
            console.log(`✅ Agent 4 completed in ${formatDuration(durations.agent4)}`);
            console.log(`   Provider: ${agent4Result.metadata?.provider ?? 'unknown'}`);

            printSubsection('Delivery Package Summary');
            const workflowSpecs = safeGet<unknown[]>(agent4Result, 'data', 'workflow_specs') ?? [];
            const agentSpecs = safeGet<unknown[]>(agent4Result, 'data', 'agent_spec_sheets') ?? [];
            const fallbackModes = safeGet<unknown[]>(agent4Result, 'data', 'fallback_modes') ?? [];

            console.log(`   📋 Workflows: ${safeLength(workflowSpecs)}`);
            console.log(`   🤖 Agent Specs: ${safeLength(agentSpecs)}`);
            console.log(`   🔄 Fallback Modes: ${safeLength(fallbackModes)}`);

            if (workflowSpecs.length > 0) {
                console.log('\n   ⚙️ Workflow Specs:');
                workflowSpecs.slice(0, 2).forEach((wf: unknown) => {
                    const name = safeGet<string>(wf, 'workflow_name') ?? 'Unknown';
                    const happySteps = safeGet<unknown[]>(wf, 'happy_path_steps') ?? [];
                    const exceptions = safeGet<unknown[]>(wf, 'exception_paths') ?? [];
                    console.log(`      • ${name}: ${safeLength(happySteps)} steps, ${safeLength(exceptions)} exceptions`);
                });
            }

            const handoffKit = safeGet<{
                quickstart_5min?: string[];
                daily_sop?: string[];
                exception_sop?: string[];
            }>(agent4Result, 'data', 'client_handoff_kit');

            if (handoffKit) {
                console.log('\n   📖 Client Handoff Kit:');
                console.log(`      Quickstart: ${safeLength(handoffKit.quickstart_5min)} steps`);
                console.log(`      Daily SOP: ${safeLength(handoffKit.daily_sop)} tasks`);
                console.log(`      Exception SOP: ${safeLength(handoffKit.exception_sop)} procedures`);
            }

            // Full JSON output
            logFullJson('Agent 4 Output', agent4Result.data);

            results.agent4 = agent4Result;
        } else {
            console.log(`❌ Agent 4 failed: ${agent4Result.error?.details ?? 'Unknown error'}`);
            return;
        }

        // ====================================================================
        // AGENT 5: Client Success & Expansion
        // ====================================================================
        printSeparator('AGENT 5: Client Success & Expansion');
        console.log('📊 Purpose: Onboard, track adoption, prove ROI, identify expansion');
        console.log('📥 Input: Handoff kit from Agent 4');
        console.log('📤 Output: Onboarding plan, health score, Shadow Ops reduction report\n');

        const agent5StartTime = Date.now();
        console.log('🔄 Running Agent 5...');

        // Check for Anthropic API key
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            console.log('⚠️ ANTHROPIC_API_KEY not set, skipping Agent 5');
            durations.agent5 = 0;
            results.agent5 = { success: false, error: { details: 'API key not configured' } };
        } else {
            // Build handoff from Agent 4
            const kit = safeGet<{
                quickstart_5min?: string[];
                daily_sop?: string[];
                weekly_sop?: string[];
                exception_sop?: string[];
                training_plan?: string[];
            }>(agent4Result, 'data', 'client_handoff_kit');

            const workflows = safeGet<unknown[]>(agent4Result, 'data', 'workflow_specs') ?? [];
            const exceptionLibrary = safeGet<{ top_exceptions_ranked?: unknown[] }>(agent3Result, 'data', 'exception_library');

            const agent4Handoff = {
                project_id: 'proj_001',
                account_id: 'acc_001',
                client_name: 'GrowthScale Inc',
                quickstart_5min: kit?.quickstart_5min ?? [],
                daily_sop: kit?.daily_sop ?? [],
                weekly_sop: kit?.weekly_sop ?? [],
                exception_sop: kit?.exception_sop ?? [],
                training_plan: kit?.training_plan ?? [],
                admin_notes: [],
                baseline_kpis: [
                    { kpi_name: 'Lead Response Time', baseline_value: '4 hours', target_value: '15 minutes', measurement_method: 'CRM timestamp delta' },
                    { kpi_name: 'Shadow Ops Hours', baseline_value: '15 hrs/week', target_value: '2 hrs/week', measurement_method: 'Time tracking' }
                ],
                workflows_delivered: workflows.map((wf: unknown) => ({
                    workflow_id: `wf_${Math.random().toString(36).substr(2, 9)}`,
                    workflow_name: safeGet<string>(wf, 'workflow_name') ?? 'Unknown',
                    goal: safeGet<string>(wf, 'goal') ?? '',
                    exception_paths_top5: (safeGet<unknown[]>(wf, 'exception_paths') ?? []).slice(0, 5).map((e: unknown) => safeGet<string>(e, 'exception_name') ?? ''),
                    kpis_affected: safeGet<string[]>(wf, 'kpis_affected') ?? []
                })),
                shadow_ops_baseline: ['Manual lead routing', 'WhatsApp coordination', 'Spreadsheet tracking', 'Memory-based follow-ups'],
                exception_library: (exceptionLibrary?.top_exceptions_ranked ?? []).map((ex: unknown) => ({
                    exception_name: safeGet<string>(ex, 'exception_name') ?? '',
                    frequency: safeGet<string>(ex, 'frequency') ?? '',
                    impact: safeGet<string>(ex, 'impact') ?? '',
                    current_handling: safeGet<string>(ex, 'current_handling') ?? ''
                }))
            };

            try {
                const agent5Output = await agents.runAgent5(
                    { apiKey: anthropicKey },
                    {
                        handoff_kit: agent4Handoff,
                        current_week_of: new Date().toISOString().split('T')[0]
                    }
                );
                durations.agent5 = Date.now() - agent5StartTime;

                // Agent 5 returns package directly
                console.log(`✅ Agent 5 completed in ${formatDuration(durations.agent5)}`);
                console.log(`   Provider: Anthropic (Claude)`);

                printSubsection('Client Success Package Summary');

                const onboarding = safeGet<{ day_1?: string[]; day_3?: string[]; day_7?: string[] }>(agent5Output, 'onboarding_plan');
                if (onboarding) {
                    console.log('\n   📅 Onboarding Plan:');
                    console.log(`      Day 1: ${safeLength(onboarding.day_1)} tasks`);
                    console.log(`      Day 3: ${safeLength(onboarding.day_3)} tasks`);
                    console.log(`      Day 7: ${safeLength(onboarding.day_7)} tasks`);
                }

                const reductionReport = safeGet<{ before_list?: string[]; after_list?: string[]; delta_summary?: string }>(agent5Output, 'shadow_ops_reduction_report');
                if (reductionReport) {
                    console.log('\n   📉 Shadow Ops Reduction:');
                    console.log(`      Before: ${safeLength(reductionReport.before_list)} tasks`);
                    console.log(`      After: ${safeLength(reductionReport.after_list)} tasks`);
                    console.log(`      Delta: ${reductionReport.delta_summary ?? 'N/A'}`);
                }

                const healthScore = safeGet<{ score_0_100?: number; risk_level?: string }>(agent5Output, 'client_health_score');
                if (healthScore) {
                    console.log('\n   ❤️ Client Health:');
                    console.log(`      Score: ${healthScore.score_0_100 ?? 'N/A'}/100`);
                    console.log(`      Risk Level: ${healthScore.risk_level ?? 'N/A'}`);
                }

                const expansionMap = safeGet<{ phase_2_recommendations?: string[] }>(agent5Output, 'expansion_map');
                if (expansionMap?.phase_2_recommendations) {
                    console.log('\n   🚀 Expansion Opportunities:');
                    expansionMap.phase_2_recommendations.slice(0, 3).forEach((rec: string) => {
                        console.log(`      • ${rec}`);
                    });
                }

                // Full JSON output
                logFullJson('Agent 5 Output', agent5Output);

                results.agent5 = { success: true, data: agent5Output };
            } catch (error) {
                durations.agent5 = Date.now() - agent5StartTime;
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                console.log(`❌ Agent 5 failed: ${errorMsg}`);
                results.agent5 = { success: false, error: { details: errorMsg } };
            }
        }

        // ====================================================================
        // FINAL SUMMARY
        // ====================================================================
        const totalDuration = Date.now() - pipelineStartTime;

        printSeparator('PIPELINE COMPLETE - FINAL SUMMARY');

        console.log('📊 Agent Execution Summary:');
        console.log('─'.repeat(50));
        console.log(`   Agent 1 (Market Intel):    ${safeGet(results, 'agent1', 'success') ? '✅' : '❌'} ${formatDuration(durations.agent1 ?? 0)}`);
        console.log(`   Agent 2 (Outbound):        ${safeGet(results, 'agent2', 'success') ? '✅' : '❌'} ${formatDuration(durations.agent2 ?? 0)}`);
        console.log(`   Agent 3 (Sales Engineer):  ${safeGet(results, 'agent3', 'success') ? '✅' : '❌'} ${formatDuration(durations.agent3 ?? 0)}`);
        console.log(`   Agent 4 (Systems Builder): ${safeGet(results, 'agent4', 'success') ? '✅' : '❌'} ${formatDuration(durations.agent4 ?? 0)}`);
        console.log(`   Agent 5 (Client Success):  ${safeGet(results, 'agent5', 'success') ? '✅' : '❌'} ${formatDuration(durations.agent5 ?? 0)}`);
        console.log('─'.repeat(50));
        console.log(`   TOTAL PIPELINE TIME:       ${formatDuration(totalDuration)}`);

        console.log('\n📈 Data Flow Completed:');
        console.log(`   Leads Analyzed:      ${safeLength(safeGet(results, 'agent1', 'data', 'target_pack_primary'))}`);
        console.log(`   Campaigns Created:   ${safeLength(safeGet(results, 'agent2', 'data', 'message_library'))}`);
        console.log(`   Proposals Generated: ${safeGet(results, 'agent3', 'success') ? 1 : 0}`);
        console.log(`   Workflows Built:     ${safeLength(safeGet(results, 'agent4', 'data', 'workflow_specs'))}`);
        console.log(`   Success Plans:       ${safeGet(results, 'agent5', 'success') ? 1 : 0}`);

        // Save all results to file
        saveResultsToFile({
            timestamp: new Date().toISOString(),
            totalDurationMs: totalDuration,
            durations,
            results
        });

        console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║     🎉 FULL PIPELINE EXECUTION COMPLETE!                            ║
║                                                                      ║
║     From raw leads to client success plan in ${formatDuration(totalDuration).padEnd(12)}          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

    } catch (error) {
        console.error('\n❌ Pipeline Error:', error);
    }
}

// Run the pipeline
runFullPipeline();
