'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import Link from 'next/link';
import {
    ArrowLeft,
    GitCompare,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface PipelineRun {
    id: string;
    timestamp: string;
    leads: string;
    duration: number;
    status: string;
    agentResults: Array<{
        agentNumber: number;
        agentName: string;
        success: boolean;
        duration: number;
        data?: unknown;
    }>;
}

export default function ComparePage() {
    const [history, setHistory] = useState<PipelineRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [run1, setRun1] = useState<string>('');
    const [run2, setRun2] = useState<string>('');
    const [comparing, setComparing] = useState(false);
    const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/history');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                    if (data.length >= 2) {
                        setRun1(data[0].id);
                        setRun2(data[1].id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getRunData = (id: string) => history.find(r => r.id === id);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        return seconds > 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
    };

    const formatDate = (ts: string) => new Date(ts).toLocaleDateString();

    const runA = getRunData(run1);
    const runB = getRunData(run2);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Compare Runs</h1>
                            <p className="text-xs text-zinc-500">Side-by-side pipeline comparison</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <p className="text-center text-zinc-500 py-8">Loading...</p>
                ) : history.length < 2 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <GitCompare className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                            <p className="text-zinc-500 mb-4">Need at least 2 pipeline runs to compare</p>
                            <Link href="/pipeline">
                                <Button>Run Pipeline</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Selectors */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Run A</label>
                                <select
                                    value={run1}
                                    onChange={e => setRun1(e.target.value)}
                                    className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                >
                                    {history.map(run => (
                                        <option key={run.id} value={run.id}>
                                            {formatDate(run.timestamp)} - {run.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Run B</label>
                                <select
                                    value={run2}
                                    onChange={e => setRun2(e.target.value)}
                                    className="w-full p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                >
                                    {history.map(run => (
                                        <option key={run.id} value={run.id}>
                                            {formatDate(run.timestamp)} - {run.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Button
                            onClick={() => setComparing(true)}
                            disabled={run1 === run2}
                            className="mb-6"
                        >
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare
                        </Button>

                        {/* Comparison View */}
                        {comparing && runA && runB && (
                            <div className="space-y-4">
                                {/* Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">Metric</th>
                                                    <th className="text-center py-2">Run A</th>
                                                    <th className="text-center py-2">Run B</th>
                                                    <th className="text-center py-2">Diff</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="py-2">Status</td>
                                                    <td className="text-center">
                                                        <Badge variant={runA.status === 'success' ? 'success' : 'warning'}>
                                                            {runA.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge variant={runB.status === 'success' ? 'success' : 'warning'}>
                                                            {runB.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">-</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2">Duration</td>
                                                    <td className="text-center">{formatDuration(runA.duration)}</td>
                                                    <td className="text-center">{formatDuration(runB.duration)}</td>
                                                    <td className="text-center">
                                                        {runB.duration > runA.duration ? (
                                                            <span className="text-red-500">+{formatDuration(runB.duration - runA.duration)}</span>
                                                        ) : (
                                                            <span className="text-emerald-500">-{formatDuration(runA.duration - runB.duration)}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2">Agents Success</td>
                                                    <td className="text-center">{runA.agentResults.filter(a => a.success).length}/5</td>
                                                    <td className="text-center">{runB.agentResults.filter(a => a.success).length}/5</td>
                                                    <td className="text-center">-</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>

                                {/* Per-Agent Comparison */}
                                {[1, 2, 3, 4, 5].map(agentNum => {
                                    const agentA = runA.agentResults.find(a => a.agentNumber === agentNum);
                                    const agentB = runB.agentResults.find(a => a.agentNumber === agentNum);
                                    const isExpanded = expandedAgent === agentNum;

                                    return (
                                        <Card key={agentNum}>
                                            <CardHeader
                                                className="cursor-pointer"
                                                onClick={() => setExpandedAgent(isExpanded ? null : agentNum)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base">
                                                        Agent {agentNum}: {agentA?.agentName || agentB?.agentName}
                                                    </CardTitle>
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </div>
                                            </CardHeader>
                                            {isExpanded && (
                                                <CardContent>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-zinc-500 mb-1">Run A</p>
                                                            <p className="text-sm">Duration: {formatDuration(agentA?.duration || 0)}</p>
                                                            <pre className="text-xs bg-zinc-50 dark:bg-zinc-800 p-2 rounded mt-2 overflow-auto max-h-40">
                                                                {JSON.stringify(agentA?.data, null, 2)?.substring(0, 500)}...
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-zinc-500 mb-1">Run B</p>
                                                            <p className="text-sm">Duration: {formatDuration(agentB?.duration || 0)}</p>
                                                            <pre className="text-xs bg-zinc-50 dark:bg-zinc-800 p-2 rounded mt-2 overflow-auto max-h-40">
                                                                {JSON.stringify(agentB?.data, null, 2)?.substring(0, 500)}...
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
