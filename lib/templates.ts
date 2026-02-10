/**
 * Lead Templates Storage
 * Save and reuse common lead formats
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface LeadTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
}

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'lead-templates.json');

// Default templates
const DEFAULT_TEMPLATES: LeadTemplate[] = [
    {
        id: 'saas-ops',
        name: 'SaaS Operations Director',
        description: 'Operations leader at a scaling SaaS company',
        content: `[Name], [Title] at [Company] ([size]-person [industry])
- Currently [pain point 1]
- Team uses [current tools]
- Mentioned: "[quote about pain point]"`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
    },
    {
        id: 'agency-owner',
        name: 'Agency Owner',
        description: 'Creative or marketing agency owner',
        content: `[Name], Owner at [Agency Name] ([team size]-person [agency type] agency)
- Manages [X] active client accounts
- Struggles with [pain point]
- Uses [tools] for project management
- Spends [X hours] weekly on [manual task]`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
    },
    {
        id: 'startup-ceo',
        name: 'Startup CEO',
        description: 'Early-stage startup founder/CEO',
        content: `[Name], CEO/Founder at [Startup Name] ([stage] startup, [X] employees)
- Building in [industry/vertical]
- Current challenge: [main pain point]
- Tech stack: [current tools]
- Growth goal: [specific goal]`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
    },
];

async function ensureDataDir(): Promise<void> {
    const dataDir = path.dirname(TEMPLATES_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

export async function loadTemplates(): Promise<LeadTemplate[]> {
    try {
        await ensureDataDir();
        const data = await fs.readFile(TEMPLATES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        // Return defaults if file doesn't exist
        await saveTemplates(DEFAULT_TEMPLATES);
        return DEFAULT_TEMPLATES;
    }
}

export async function saveTemplates(templates: LeadTemplate[]): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
}

export async function getTemplateById(id: string): Promise<LeadTemplate | null> {
    const templates = await loadTemplates();
    return templates.find(t => t.id === id) || null;
}

export async function createTemplate(template: Omit<LeadTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<LeadTemplate> {
    const templates = await loadTemplates();

    const newTemplate: LeadTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
    };

    templates.push(newTemplate);
    await saveTemplates(templates);

    return newTemplate;
}

export async function updateTemplate(id: string, updates: Partial<LeadTemplate>): Promise<LeadTemplate | null> {
    const templates = await loadTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) return null;

    templates[index] = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    await saveTemplates(templates);
    return templates[index];
}

export async function deleteTemplate(id: string): Promise<boolean> {
    const templates = await loadTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) return false;

    templates.splice(index, 1);
    await saveTemplates(templates);
    return true;
}

export async function incrementUsage(id: string): Promise<void> {
    const templates = await loadTemplates();
    const template = templates.find(t => t.id === id);

    if (template) {
        template.usageCount++;
        await saveTemplates(templates);
    }
}
