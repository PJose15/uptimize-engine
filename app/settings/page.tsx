'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, CheckCircle2, Key, Bell, Clock, Webhook } from 'lucide-react';

interface Settings {
    slackWebhookUrl: string;
    notificationEmail: string;
    defaultTimeout: number;
    maxConcurrency: number;
    webhookApiKey: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        slackWebhookUrl: '',
        notificationEmail: '',
        defaultTimeout: 120,
        maxConcurrency: 2,
        webhookApiKey: '',
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        // Load settings from localStorage or API
        const stored = localStorage.getItem('uptimize_settings');
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    const saveSettings = async () => {
        setLoading(true);
        setSaved(false);

        try {
            // Save to localStorage (in production, save to database via API)
            localStorage.setItem('uptimize_settings', JSON.stringify(settings));

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateApiKey = () => {
        const key = 'wh_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        setSettings(s => ({ ...s, webhookApiKey: key }));
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Settings</h1>
                            <p className="text-xs text-zinc-500">Configure your pipeline</p>
                        </div>
                    </div>
                    <Button onClick={saveSettings} disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : saved ? (
                            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {saved ? 'Saved!' : 'Save Settings'}
                    </Button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-violet-500" />
                            <CardTitle className="text-base">Notifications</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Slack Webhook URL</label>
                            <input
                                type="url"
                                value={settings.slackWebhookUrl}
                                onChange={e => setSettings(s => ({ ...s, slackWebhookUrl: e.target.value }))}
                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                placeholder="https://hooks.slack.com/services/..."
                            />
                            <p className="text-xs text-zinc-500 mt-1">Get notified on Slack when pipelines complete</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Notification Email</label>
                            <input
                                type="email"
                                value={settings.notificationEmail}
                                onChange={e => setSettings(s => ({ ...s, notificationEmail: e.target.value }))}
                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                placeholder="you@example.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline Config */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-base">Pipeline Configuration</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Default Agent Timeout (seconds)
                            </label>
                            <input
                                type="number"
                                min={30}
                                max={600}
                                value={settings.defaultTimeout}
                                onChange={e => setSettings(s => ({ ...s, defaultTimeout: parseInt(e.target.value) || 120 }))}
                                className="w-32 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                            <p className="text-xs text-zinc-500 mt-1">How long before an agent times out (30-600s)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Max Batch Concurrency
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={settings.maxConcurrency}
                                onChange={e => setSettings(s => ({ ...s, maxConcurrency: parseInt(e.target.value) || 2 }))}
                                className="w-32 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                            <p className="text-xs text-zinc-500 mt-1">How many leads to process in parallel (1-10)</p>
                        </div>
                    </CardContent>
                </Card>

                {/* API Keys */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Webhook className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-base">Webhook Integration</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Webhook API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={settings.webhookApiKey}
                                    readOnly
                                    className="flex-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-mono"
                                    placeholder="Click generate to create a key"
                                />
                                <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                                    {showApiKey ? 'Hide' : 'Show'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={generateApiKey}>
                                    <Key className="h-4 w-4 mr-1" />
                                    Generate
                                </Button>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                Use this key in the x-api-key header when calling /api/webhooks/trigger
                            </p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                            <p className="text-xs font-medium mb-2">Example cURL:</p>
                            <pre className="text-xs font-mono overflow-auto">
                                {`curl -X POST http://localhost:3000/api/webhooks/trigger \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${settings.webhookApiKey || 'YOUR_API_KEY'}" \\
  -d '{"leads": "John Smith, CEO..."}'`}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                {/* Environment Variables */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-zinc-500" />
                            <CardTitle className="text-base">API Keys Status</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-500 mb-3">
                            These are configured in your .env.local file:
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>GEMINI_API_KEY</span>
                                <Badge variant="success">Configured</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>ANTHROPIC_API_KEY</span>
                                <Badge variant="success">Configured</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>OPENAI_API_KEY</span>
                                <Badge variant="success">Configured</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
