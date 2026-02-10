import { NextRequest, NextResponse } from 'next/server';
import { createGoogleSheetsIntegration } from '@/lib/integrations/google-sheets';

export async function GET() {
    const sheets = createGoogleSheetsIntegration();

    if (!sheets) {
        return NextResponse.json(
            { error: 'Google Sheets not configured' },
            { status: 503 }
        );
    }

    try {
        const leads = await sheets.importLeads();
        const formattedForAgent1 = sheets.formatLeadsForAgent1(leads);

        return NextResponse.json({
            success: true,
            count: leads.length,
            leads,
            formattedText: formattedForAgent1,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to import leads',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const sheets = createGoogleSheetsIntegration();

    if (!sheets) {
        return NextResponse.json(
            { error: 'Google Sheets not configured' },
            { status: 503 }
        );
    }

    try {
        const lead = await request.json();
        await sheets.appendLead(lead);

        return NextResponse.json({
            success: true,
            message: 'Lead added successfully',
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to add lead',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
