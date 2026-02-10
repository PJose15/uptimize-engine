'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress, Badge } from '@/components/ui';
import { AgentCard, PipelineFlow, type AgentStatus } from '@/components/dashboard';
import Link from 'next/link';
import {
    ArrowLeft,
    Play,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Download,
    Copy,
    Eye,
    X
} from 'lucide-react';

const SAMPLE_LEADS = `1. Sarah Chen, Operations Director at GrowthScale (200-person SaaS)
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
   - Complained about: "Nobody knows who's following up with which lead"`;

interface AgentResult {
    success: boolean;
    duration: number;
    data?: unknown;
    error?: string;
}

interface PipelineState {
    isRunning: boolean;
    currentAgent: number;
    agents: Array<{
        id: number;
        name: string;
        description: string;
        status: AgentStatus;
        duration?: number;
        result?: AgentResult;
    }>;
    totalDuration: number;
    error?: string;
}

export default function PipelinePage() {
    const [leads, setLeads] = useState(SAMPLE_LEADS);
    const [pipeline, setPipeline] = useState<PipelineState>({
        isRunning: false,
        currentAgent: 0,
        agents: [
            { id: 1, name: 'Market Intelligence', description: 'Analyze leads, score by fit, identify Shadow Ops', status: 'pending' },
            { id: 2, name: 'Outbound & Appointment', description: 'Generate campaigns, qualify leads, book meetings', status: 'pending' },
            { id: 3, name: 'Sales Engineer', description: 'Run discovery, map Shadow Ops, create proposals', status: 'pending' },
            { id: 4, name: 'Systems Builder', description: 'Convert to production system with SOPs', status: 'pending' },
            { id: 5, name: 'Client Success', description: 'Onboard, track adoption, prove ROI', status: 'pending' },
        ],
        totalDuration: 0,
    });
    const [showResults, setShowResults] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const runPipeline = async () => {
        setPipeline(prev => ({
            ...prev,
            isRunning: true,
            error: undefined,
            agents: prev.agents.map(a => ({ ...a, status: 'pending' as AgentStatus, duration: undefined, result: undefined })),
        }));
        setShowResults(false);

        try {
            const response = await fetch('/api/pipeline/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leads }),
            });

            if (!response.ok) {
                throw new Error('Pipeline failed');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No response body');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));

                        if (data.type === 'agent_start') {
                            setPipeline(prev => ({
                                ...prev,
                                currentAgent: data.agentNumber,
                                agents: prev.agents.map(a =>
                                    a.id === data.agentNumber
                                        ? { ...a, status: 'running' as AgentStatus }
                                        : a
                                ),
                            }));
                        }

                        if (data.type === 'agent_complete') {
                            setPipeline(prev => ({
                                ...prev,
                                agents: prev.agents.map(a =>
                                    a.id === data.agentNumber
                                        ? {
                                            ...a,
                                            status: data.success ? 'success' as AgentStatus : 'error' as AgentStatus,
                                            duration: data.duration,
                                            result: data.result
                                        }
                                        : a
                                ),
                            }));
                        }

                        if (data.type === 'pipeline_complete') {
                            setPipeline(prev => ({
                                ...prev,
                                isRunning: false,
                                totalDuration: data.totalDuration,
                            }));
                            setShowResults(true);
                        }

                        if (data.type === 'error') {
                            setPipeline(prev => ({
                                ...prev,
                                isRunning: false,
                                error: data.message,
                            }));
                        }
                    } catch {
                        // Skip invalid JSON lines
                    }
                }
            }
        } catch (error) {
            setPipeline(prev => ({
                ...prev,
                isRunning: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }));
        }
    };

    // Get all results as JSON
    const getResultsJSON = () => {
        const results: Record<string, unknown> = {
            pipeline_completed_at: new Date().toISOString(),
            total_duration_ms: pipeline.totalDuration,
            leads_input: leads,
            agents: {}
        };

        pipeline.agents.forEach(agent => {
            if (agent.result?.data) {
                (results.agents as Record<string, unknown>)[`agent_${agent.id}_${agent.name.replace(/\s+/g, '_').toLowerCase()}`] = {
                    success: agent.result.success,
                    duration_ms: agent.duration,
                    data: agent.result.data
                };
            }
        });

        return JSON.stringify(results, null, 2);
    };

    // Download JSON file
    const downloadResults = () => {
        const json = getResultsJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pipeline-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Copy to clipboard
    const copyToClipboard = async () => {
        const json = getResultsJSON();
        await navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const progress = pipeline.agents.filter(a => a.status === 'success').length * 20;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Run Pipeline</h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Execute the 5-agent workflow</p>
                        </div>
                    </div>
                    <Button
                        onClick={runPipeline}
                        disabled={pipeline.isRunning || !leads.trim()}
                    >
                        {pipeline.isRunning ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Pipeline
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Input */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Lead Input</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={leads}
                                    onChange={(e) => setLeads(e.target.value)}
                                    disabled={pipeline.isRunning}
                                    className="w-full h-[400px] p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="Enter leads to analyze..."
                                />
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                    Enter lead information with names, companies, and context clues
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Pipeline Status */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Pipeline Progress</CardTitle>
                                    <div className="flex items-center gap-2">
                                        {pipeline.isRunning && (
                                            <Badge variant="warning">
                                                {progress}% • Agent {pipeline.currentAgent}/5 • ~{Math.max(0, Math.ceil((5 - pipeline.currentAgent) * 0.8))} min left
                                            </Badge>
                                        )}
                                        {pipeline.totalDuration > 0 && (
                                            <Badge variant="success">
                                                Complete in {(pipeline.totalDuration / 1000).toFixed(1)}s
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-2 flex justify-between text-xs text-zinc-500">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="mb-4" />
                                <PipelineFlow
                                    agents={pipeline.agents.map(a => ({
                                        id: a.id,
                                        name: a.name.split(' ')[0],
                                        status: a.status,
                                    }))}
                                />
                            </CardContent>
                        </Card>

                        {/* Error Display */}
                        {pipeline.error && (
                            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                        <div>
                                            <p className="font-medium text-red-800 dark:text-red-200">Pipeline Error</p>
                                            <p className="text-sm text-red-600 dark:text-red-300">{pipeline.error}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Agent Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pipeline.agents.map((agent) => (
                                <AgentCard
                                    key={agent.id}
                                    agentNumber={agent.id}
                                    name={agent.name}
                                    description={agent.description}
                                    status={agent.status}
                                    duration={agent.duration}
                                    outputPreview={
                                        agent.result?.data
                                            ? JSON.stringify(agent.result.data).substring(0, 100) + '...'
                                            : undefined
                                    }
                                />
                            ))}
                        </div>

                        {/* Results Summary */}
                        {showResults && (
                            <Card className="border-emerald-200 dark:border-emerald-800">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <CardTitle className="text-base">Pipeline Complete!</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                        Successfully processed leads through all 5 agents.
                                    </p>
                                    <div className="mt-4 flex gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Full Results
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={downloadResults}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download JSON
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            {/* Results Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[80vh] m-4 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-lg font-bold">Pipeline Results</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={downloadResults}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="text-xs font-mono bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg overflow-auto">
                                {getResultsJSON()}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

