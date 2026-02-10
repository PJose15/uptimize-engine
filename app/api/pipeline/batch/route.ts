import { NextResponse } from 'next/server';

/**
 * POST /api/pipeline/batch - Process multiple leads in parallel
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { leads, concurrency = 2 } = body;

        if (!Array.isArray(leads) || leads.length === 0) {
            return NextResponse.json(
                { error: 'leads must be a non-empty array' },
                { status: 400 }
            );
        }

        const results: Array<{
            leadIndex: number;
            lead: string;
            status: 'success' | 'failed';
            result?: unknown;
            error?: string;
            duration: number;
        }> = [];

        // Process in batches based on concurrency
        for (let i = 0; i < leads.length; i += concurrency) {
            const batch = leads.slice(i, i + concurrency);

            const batchResults = await Promise.allSettled(
                batch.map(async (lead, batchIndex) => {
                    const leadIndex = i + batchIndex;
                    const startTime = Date.now();

                    try {
                        const response = await fetch(
                            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pipeline/run`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ leads: lead }),
                            }
                        );

                        if (!response.ok) {
                            throw new Error(`Pipeline failed with status ${response.status}`);
                        }

                        // Read the stream to completion
                        const reader = response.body?.getReader();
                        const decoder = new TextDecoder();
                        let fullResult: unknown = null;

                        if (reader) {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                const text = decoder.decode(value);
                                const lines = text.split('\n').filter(line => line.startsWith('data: '));

                                for (const line of lines) {
                                    try {
                                        const data = JSON.parse(line.replace('data: ', ''));
                                        if (data.type === 'pipeline_complete') {
                                            fullResult = data.results;
                                        }
                                    } catch {
                                        // Skip invalid JSON
                                    }
                                }
                            }
                        }

                        return {
                            leadIndex,
                            lead,
                            status: 'success' as const,
                            result: fullResult,
                            duration: Date.now() - startTime,
                        };
                    } catch (error) {
                        return {
                            leadIndex,
                            lead,
                            status: 'failed' as const,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            duration: Date.now() - startTime,
                        };
                    }
                })
            );

            // Collect results
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        leadIndex: results.length,
                        lead: '',
                        status: 'failed',
                        error: result.reason?.message || 'Unknown error',
                        duration: 0,
                    });
                }
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

        return NextResponse.json({
            summary: {
                total: leads.length,
                success: successCount,
                failed: leads.length - successCount,
                totalDuration,
                avgDuration: totalDuration / leads.length,
            },
            results,
        });

    } catch (error) {
        console.error('Batch processing error:', error);
        return NextResponse.json(
            { error: 'Batch processing failed' },
            { status: 500 }
        );
    }
}
