'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit,
    Copy,
    FileText,
    Check
} from 'lucide-react';

interface LeadTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    usageCount: number;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<LeadTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<LeadTemplate | null>(null);
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        content: ''
    });

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveTemplate = async () => {
        try {
            if (editing) {
                // Update existing
                const res = await fetch(`/api/templates?id=${editing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
                if (res.ok) {
                    await fetchTemplates();
                    setEditing(null);
                }
            } else {
                // Create new
                const res = await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
                if (res.ok) {
                    await fetchTemplates();
                    setCreating(false);
                }
            }
            setForm({ name: '', description: '', content: '' });
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        try {
            const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    const copyToClipboard = async (template: LeadTemplate) => {
        await navigator.clipboard.writeText(template.content);
        setCopied(template.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const startEdit = (template: LeadTemplate) => {
        setEditing(template);
        setForm({
            name: template.name,
            description: template.description,
            content: template.content
        });
        setCreating(false);
    };

    const startCreate = () => {
        setCreating(true);
        setEditing(null);
        setForm({ name: '', description: '', content: '' });
    };

    const cancelEdit = () => {
        setEditing(null);
        setCreating(false);
        setForm({ name: '', description: '', content: '' });
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Lead Templates</h1>
                            <p className="text-xs text-zinc-500">Save and reuse common lead formats</p>
                        </div>
                    </div>
                    <Button onClick={startCreate} disabled={creating || !!editing}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Editor */}
                {(creating || editing) && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {editing ? 'Edit Template' : 'New Template'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full mt-1 p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                    placeholder="e.g., SaaS Operations Director"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full mt-1 p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                    placeholder="Brief description of this template"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Lead Format</label>
                                <textarea
                                    value={form.content}
                                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                    rows={6}
                                    className="w-full mt-1 p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-sm"
                                    placeholder="Enter the lead format template..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={saveTemplate} disabled={!form.name || !form.content}>
                                    {editing ? 'Update' : 'Create'}
                                </Button>
                                <Button variant="outline" onClick={cancelEdit}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Templates List */}
                {loading ? (
                    <p className="text-center text-zinc-500 py-8">Loading...</p>
                ) : templates.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                            <p className="text-zinc-500 mb-4">No templates yet</p>
                            <Button onClick={startCreate}>Create Your First Template</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map(template => (
                            <Card key={template.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">{template.name}</CardTitle>
                                            <p className="text-xs text-zinc-500">{template.description}</p>
                                        </div>
                                        <Badge variant="default">{template.usageCount} uses</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <pre className="text-xs bg-zinc-50 dark:bg-zinc-800 p-2 rounded mb-3 overflow-auto max-h-32 whitespace-pre-wrap">
                                        {template.content}
                                    </pre>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(template)}
                                        >
                                            {copied === template.id ? (
                                                <><Check className="h-4 w-4 mr-1" /> Copied</>
                                            ) : (
                                                <><Copy className="h-4 w-4 mr-1" /> Copy</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => startEdit(template)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteTemplate(template.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
