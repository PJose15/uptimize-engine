import { NextResponse } from 'next/server';
import { checkRateLimit, getClientId, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { validateInput, WebhookTriggerSchema, validationErrorResponse } from '@/lib/validation';
import { generateRunId } from '@/lib/history';

// Store webhook API keys (in production, use database)
const WEBHOOK_KEYS = new Set([
    process.env.WEBHOOK_API_KEY || 'default-webhook-key',
]);

/**
 * POST /api/webhooks/trigger - Trigger pipeline via webhook
 */
export async function POST(request: Request) {
    // Check API key
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey || !WEBHOOK_KEYS.has(apiKey)) {
        return NextResponse.json(
            { error: 'Invalid or missing API key' },
            { status: 401 }
        );
    }

    // Rate limit by API key
    const rateLimitResult = checkRateLimit(`webhook_${apiKey}`, RATE_LIMITS.webhook);
    if (!rateLimitResult.allowed) {
        return rateLimitResponse(rateLimitResult);
    }

    try {
        const body = await request.json();

        // Validate input
        const validation = validateInput(WebhookTriggerSchema, body);
        if (!validation.success) {
            return validationErrorResponse(validation.errors);
        }

        const { leads, callbackUrl, metadata } = validation.data;
        const runId = generateRunId();

        // Trigger pipeline asynchronously
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        fetch(`${baseUrl}/api/pipeline/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads, runId }),
        }).then(async (response) => {
            // If callback URL provided, notify when complete
            if (callbackUrl) {
                try {
                    const reader = response.body?.getReader();
                    let finalResult = null;

                    if (reader) {
                        const decoder = new TextDecoder();
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const text = decoder.decode(value);
                            const lines = text.split('\n').filter(line => line.startsWith('data: '));

                            for (const line of lines) {
                                try {
                                    const data = JSON.parse(line.replace('data: ', ''));
                                    if (data.type === 'pipeline_complete') {
                                        finalResult = data;
                                    }
                                } catch {
                                    // Skip invalid JSON
                                }
                            }
                        }
                    }

                    // Send callback
                    await fetch(callbackUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            runId,
                            status: finalResult ? 'completed' : 'failed',
                            results: finalResult?.results,
                            metadata,
                        }),
                    });
                } catch (e) {
                    console.error('Callback failed:', e);
                }
            }
        }).catch(console.error);

        return NextResponse.json({
            success: true,
            runId,
            message: 'Pipeline triggered',
            statusUrl: `${baseUrl}/api/pipeline/status?id=${runId}`,
        }, { status: 202 });

    } catch (error) {
        console.error('Webhook trigger error:', error);
        return NextResponse.json(
            { error: 'Failed to trigger pipeline' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/webhooks/trigger - Get webhook documentation
 */
export async function GET() {
    return NextResponse.json({
        endpoint: '/api/webhooks/trigger',
        method: 'POST',
        authentication: 'x-api-key header or Authorization: Bearer <key>',
        body: {
            leads: 'string (required) - Lead information to process',
            callbackUrl: 'string (optional) - URL to POST results when complete',
            metadata: 'object (optional) - Pass-through data included in callback',
        },
        response: {
            runId: 'Unique identifier for this pipeline run',
            statusUrl: 'URL to check run status',
        },
        example: {
            curl: `curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/trigger \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"leads": "John Smith, CEO at Acme Corp..."}'`,
        },
    });
}
