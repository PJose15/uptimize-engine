import { NextResponse } from 'next/server';
import {
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById
} from '@/lib/templates';

/**
 * GET /api/templates - Get all templates or a specific one
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const template = await getTemplateById(id);
            if (!template) {
                return NextResponse.json(
                    { error: 'Template not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(template);
        }

        const templates = await loadTemplates();
        return NextResponse.json(templates);

    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/templates - Create a new template
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name || !body.content) {
            return NextResponse.json(
                { error: 'Name and content are required' },
                { status: 400 }
            );
        }

        const template = await createTemplate({
            name: body.name,
            description: body.description || '',
            content: body.content,
        });

        return NextResponse.json(template, { status: 201 });

    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/templates - Update a template
 */
export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Template ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const updated = await updateTemplate(id, body);

        if (!updated) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/templates - Delete a template
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Template ID is required' },
                { status: 400 }
            );
        }

        const deleted = await deleteTemplate(id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
