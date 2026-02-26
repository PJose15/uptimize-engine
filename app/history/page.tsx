'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import Link from 'next/link';
import {
    ArrowLeft,
    Trash2,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    DollarSign
} from 'lucide-react';

interface PipelineRun {
    id: string;
    timestamp: string;
    leads: string;
    duration: number;
    status: 'success' | 'partial' | 'failed';
    agentResults: Array<{
        agentNumber: number;
        agentName: string;
        success: boolean;
        duration: number;
    }>;
    totalCost?: number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<PipelineRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);
    const [stats, setStats] = useState<{
        totalRuns: number;
        successRate: number;
        avgDuration: number;
        totalCost: number;
    } | null>(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [historyRes, statsRes] = await Promise.all([
                fetch('/api/history'),
                fetch('/api/history?summary=true')
            ]);

            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistory(data);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteRun = async (id: string) => {
        try {
            const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(prev => prev.filter(r => r.id !== id));
                if (selectedRun?.id === id) setSelectedRun(null);
            }
        } catch (error) {
            console.error('Failed to delete run:', error);
        }
    };

    const clearAll = async () => {
        if (!confirm('Are you sure you want to clear all history?')) return;
        try {
            const res = await fetch('/api/history?all=true', { method: 'DELETE' });
            if (res.ok) {
                setHistory([]);
                setSelectedRun(null);
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'partial': return <AlertCircle className="h-4 w-4 text-amber-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Pipeline History</h1>
                            <p className="text-xs text-zinc-500">View past pipeline runs</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchHistory}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        {history.length > 0 && (
                            <Button variant="outline" size="sm" onClick={clearAll}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                {stats && stats.totalRuns > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-zinc-500">Total Runs</p>
                                <p className="text-2xl font-bold">{stats.totalRuns}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-zinc-500">Success Rate</p>
                                <p className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-zinc-500">Avg Duration</p>
                                <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-zinc-500">Total Cost</p>
                                <p className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* History List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Recent Runs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <p className="text-zinc-500 text-center py-8">Loading...</p>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-zinc-500 mb-4">No pipeline runs yet</p>
                                        <Link href="/pipeline">
                                            <Button>Run Your First Pipeline</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {history.map(run => (
                                            <div
                                                key={run.id}
                                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedRun?.id === run.id
                                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                                    }`}
                                                onClick={() => setSelectedRun(run)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusIcon(run.status)}
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {formatDate(run.timestamp)}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 line-clamp-1">
                                                                {run.leads.substring(0, 50)}...
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right text-xs">
                                                            <div className="flex items-center gap-1 text-zinc-500">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDuration(run.duration)}
                                                            </div>
                                                            {run.totalCost !== undefined && (
                                                                <div className="flex items-center gap-1 text-zinc-500">
                                                                    <DollarSign className="h-3 w-3" />
                                                                    ${run.totalCost.toFixed(4)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteRun(run.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-zinc-400" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Run Details */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Run Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {selectedRun ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Status</p>
                                            <Badge variant={
                                                selectedRun.status === 'success' ? 'success' :
                                                    selectedRun.status === 'failed' ? 'error' : 'warning'
                                            }>
                                                {selectedRun.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Agent Results</p>
                                            <div className="space-y-1">
                                                {selectedRun.agentResults.map(agent => (
                                                    <div key={agent.agentNumber} className="flex items-center justify-between text-sm">
                                                        <span className="flex items-center gap-2">
                                                            {agent.success ? (
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3 text-red-500" />
                                                            )}
                                                            Agent {agent.agentNumber}
                                                        </span>
                                                        <span className="text-zinc-500">
                                                            {formatDuration(agent.duration)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Lead Input</p>
                                            <p className="text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded line-clamp-5">
                                                {selectedRun.leads}
                                            </p>
                                        </div>

                                        <Link href={`/history/${selectedRun.id}`}>
                                            <Button className="w-full" variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Full Results
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <p className="text-zinc-500 text-center py-8">
                                        Select a run to view details
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
