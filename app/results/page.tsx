'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import Link from 'next/link';
import {
    ArrowLeft,
    Play,
    Loader2,
    Users,
    Mail,
    FileText,
    Settings,
    Heart,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const SAMPLE_LEADS = `1. Sarah Chen, Operations Director at GrowthScale (200-person SaaS)
   - Currently tracks 500+ leads/month in spreadsheets
   - Team uses WhatsApp groups for lead handoffs
   - Mentioned on LinkedIn: "Spending 3 hours daily on manual lead routing"`;

interface AgentOutput {
    agent1?: Agent1Output;
    agent2?: Agent2Output;
    agent3?: Agent3Output;
    agent4?: Agent4Output;
    agent5?: Agent5Output;
}

interface Agent1Output {
    run_metadata?: { run_date: string; segment_focus: string[] };
    qualified_leads?: Array<{
        lead_name: string;
        company: string;
        fit_score: number;
        shadow_ops_identified: string[];
        pain_points: string[];
    }>;
}

interface Agent2Output {
    bookings?: Array<{
        lead_name: string;
        email_sequence?: { subject: string; body: string }[];
        linkedin_messages?: string[];
        meeting_slot?: string;
    }>;
}

interface Agent3Output {
    pre_call_brief?: { hypotheses: string[]; questions: string[] };
    proposal?: { title: string; scope: string[]; pricing?: string };
    handoff_to_agent4_spec?: { build_modules: string[]; integrations: string[] };
}

interface Agent4Output {
    build_plan?: { phase_1?: { goal: string; deliverables: string[] } };
    workflow_specs?: Array<{ workflow_name: string; goal: string; happy_path_steps: string[] }>;
    client_handoff_kit?: { quickstart_5min: string[]; daily_sop: string[] };
}

interface Agent5Output {
    onboarding_plan?: { fvi7_protocol?: { day_1: string[]; day_3: string[]; day_7: string[] } };
    weekly_win_report?: { wins: string[]; metrics_snapshot: string[] };
    expansion_map?: { phase_2_recommendations: string[] };
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="mb-4">
            <CardHeader
                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-violet-500" />
                        <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
            </CardHeader>
            {isOpen && <CardContent>{children}</CardContent>}
        </Card>
    );
}

export default function ResultsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<AgentOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runDemo = async () => {
        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch('/api/pipeline/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leads: SAMPLE_LEADS }),
            });

            if (!response.ok) throw new Error('Pipeline failed');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('No response body');

            const agentResults: AgentOutput = {};

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));

                        if (data.type === 'agent_complete' && data.result?.data) {
                            if (data.agentNumber === 1) agentResults.agent1 = data.result.data;
                            if (data.agentNumber === 2) agentResults.agent2 = data.result.data;
                            if (data.agentNumber === 3) agentResults.agent3 = data.result.data;
                            if (data.agentNumber === 4) agentResults.agent4 = data.result.data;
                            if (data.agentNumber === 5) agentResults.agent5 = data.result.data;
                            setResults({ ...agentResults });
                        }

                        if (data.type === 'pipeline_complete') {
                            setIsLoading(false);
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">What Does the Pipeline Produce?</h1>
                            <p className="text-xs text-zinc-500">See exactly what each agent generates</p>
                        </div>
                    </div>
                    <Button onClick={runDemo} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Run Demo
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {!results && !isLoading && (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">Click &quot;Run Demo&quot; to see what gets generated</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                            This will process a sample lead through all 5 agents and show you the formatted results
                        </p>
                        <Button size="lg" onClick={runDemo}>
                            <Play className="h-5 w-5 mr-2" />
                            Run Demo Pipeline
                        </Button>
                    </div>
                )}

                {/* Agent 1: Market Intelligence */}
                {results?.agent1 && (
                    <CollapsibleSection title="Agent 1: Market Intelligence" icon={Users}>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">📊 Segment Focus</h4>
                                <div className="flex flex-wrap gap-2">
                                    {results.agent1.run_metadata?.segment_focus?.map((seg, i) => (
                                        <Badge key={i} variant="default">{seg}</Badge>
                                    ))}
                                </div>
                            </div>

                            {results.agent1.qualified_leads?.map((lead, i) => (
                                <div key={i} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{lead.lead_name} @ {lead.company}</h4>
                                        <Badge variant={lead.fit_score >= 80 ? 'success' : 'warning'}>
                                            Fit Score: {lead.fit_score}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-zinc-500 mb-1">🔴 Shadow Ops Identified:</p>
                                            <ul className="list-disc list-inside">
                                                {lead.shadow_ops_identified?.slice(0, 3).map((op, j) => (
                                                    <li key={j}>{op}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">😣 Pain Points:</p>
                                            <ul className="list-disc list-inside">
                                                {lead.pain_points?.slice(0, 3).map((pain, j) => (
                                                    <li key={j}>{pain}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Agent 2: Outbound */}
                {results?.agent2 && (
                    <CollapsibleSection title="Agent 2: Outbound & Campaigns" icon={Mail}>
                        <div className="space-y-4">
                            {results.agent2.bookings?.slice(0, 2).map((booking, i) => (
                                <div key={i} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <h4 className="font-semibold mb-3">📧 Campaign for: {booking.lead_name}</h4>

                                    {booking.email_sequence?.[0] && (
                                        <div className="mb-3">
                                            <p className="text-xs text-zinc-500 mb-1">Email Subject:</p>
                                            <p className="font-medium">{booking.email_sequence[0].subject}</p>
                                            <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-300 line-clamp-3">
                                                {booking.email_sequence[0].body?.substring(0, 200)}...
                                            </p>
                                        </div>
                                    )}

                                    {booking.linkedin_messages?.[0] && (
                                        <div className="mb-3">
                                            <p className="text-xs text-zinc-500 mb-1">LinkedIn Message:</p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                                {booking.linkedin_messages[0].substring(0, 150)}...
                                            </p>
                                        </div>
                                    )}

                                    {booking.meeting_slot && (
                                        <Badge variant="success">📅 Meeting: {booking.meeting_slot}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Agent 3: Sales Engineer */}
                {results?.agent3 && (
                    <CollapsibleSection title="Agent 3: Sales Engineer & Proposals" icon={FileText}>
                        <div className="space-y-4">
                            {results.agent3.pre_call_brief && (
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">🎯 Pre-Call Brief</h4>
                                    <div className="text-sm">
                                        <p className="text-zinc-500 mb-1">Hypotheses to Test:</p>
                                        <ul className="list-disc list-inside mb-3">
                                            {results.agent3.pre_call_brief.hypotheses?.slice(0, 3).map((h, i) => (
                                                <li key={i}>{h}</li>
                                            ))}
                                        </ul>
                                        <p className="text-zinc-500 mb-1">Discovery Questions:</p>
                                        <ul className="list-disc list-inside">
                                            {results.agent3.pre_call_brief.questions?.slice(0, 3).map((q, i) => (
                                                <li key={i}>{q}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {results.agent3.proposal && (
                                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                                    <h4 className="font-semibold mb-2">📄 Proposal: {results.agent3.proposal.title}</h4>
                                    <div className="text-sm">
                                        <p className="text-zinc-500 mb-1">Scope:</p>
                                        <ul className="list-disc list-inside">
                                            {results.agent3.proposal.scope?.slice(0, 4).map((s, i) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                        </ul>
                                        {results.agent3.proposal.pricing && (
                                            <p className="mt-2 font-semibold text-violet-600 dark:text-violet-400">
                                                💰 {results.agent3.proposal.pricing}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {results.agent3.handoff_to_agent4_spec && (
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">🔧 Handoff to Agent 4</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-zinc-500 mb-1">Build Modules:</p>
                                            {results.agent3.handoff_to_agent4_spec.build_modules?.map((m, i) => (
                                                <Badge key={i} variant="default" className="mr-1 mb-1">{m}</Badge>
                                            ))}
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">Integrations:</p>
                                            {results.agent3.handoff_to_agent4_spec.integrations?.map((int, i) => (
                                                <Badge key={i} variant="warning" className="mr-1 mb-1">{int}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Agent 4: Systems Builder */}
                {results?.agent4 && (
                    <CollapsibleSection title="Agent 4: Systems Builder & Delivery" icon={Settings}>
                        <div className="space-y-4">
                            {results.agent4.build_plan?.phase_1 && (
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">🏗️ Build Plan - Phase 1</h4>
                                    <p className="text-sm mb-2"><strong>Goal:</strong> {results.agent4.build_plan.phase_1.goal}</p>
                                    <p className="text-zinc-500 text-sm mb-1">Deliverables:</p>
                                    <ul className="list-disc list-inside text-sm">
                                        {results.agent4.build_plan.phase_1.deliverables?.slice(0, 4).map((d, i) => (
                                            <li key={i}>{d}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {results.agent4.workflow_specs?.[0] && (
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">⚙️ Workflow: {results.agent4.workflow_specs[0].workflow_name}</h4>
                                    <p className="text-sm mb-2">{results.agent4.workflow_specs[0].goal}</p>
                                    <p className="text-zinc-500 text-sm mb-1">Steps:</p>
                                    <ol className="list-decimal list-inside text-sm">
                                        {results.agent4.workflow_specs[0].happy_path_steps?.slice(0, 5).map((step, i) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {results.agent4.client_handoff_kit && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                                    <h4 className="font-semibold mb-2">📦 Client Handoff Kit</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-zinc-500 mb-1">⚡ Quickstart (5 min):</p>
                                            <ol className="list-decimal list-inside">
                                                {results.agent4.client_handoff_kit.quickstart_5min?.slice(0, 3).map((s, i) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ol>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">📋 Daily SOP:</p>
                                            <ol className="list-decimal list-inside">
                                                {results.agent4.client_handoff_kit.daily_sop?.slice(0, 3).map((s, i) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Agent 5: Client Success */}
                {results?.agent5 && (
                    <CollapsibleSection title="Agent 5: Client Success & ROI" icon={Heart}>
                        <div className="space-y-4">
                            {/* Show raw JSON preview if structured display fails */}
                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">🚀 Agent 5 Output</h4>
                                <pre className="text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
                                    {JSON.stringify(results.agent5, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </CollapsibleSection>
                )}

                {isLoading && (
                    <div className="text-center py-10">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-violet-500" />
                        <p className="text-zinc-500">Processing lead through all 5 agents...</p>
                        <p className="text-xs text-zinc-400 mt-2">This takes about 3-5 minutes</p>
                    </div>
                )}
            </main>
        </div>
    );
}
