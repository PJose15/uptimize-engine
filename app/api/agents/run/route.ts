import { NextResponse } from "next/server";
import { runOrchestrator } from "./orchestrator";
import { logger } from "./logger";
import { randomUUID } from "crypto";

// Configure route timeout
export const maxDuration = 60; // seconds

/**
 * POST handler for agent orchestration
 */
export async function POST(request: Request) {
    const requestId = randomUUID();
    const startTime = Date.now();

    try {
        // Validate content type
        const contentType = request.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
            logger.warn("Invalid content type", { requestId }, { contentType });
            return NextResponse.json(
                {
                    success: false,
                    message: "Content-Type must be application/json",
                    error: {
                        type: "VALIDATION_ERROR",
                        details: "Invalid Content-Type header",
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { task, mode, agent, context } = body;

        if (!task) {
            logger.warn("Missing task field", { requestId });
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing 'task' field in request body",
                    error: {
                        type: "VALIDATION_ERROR",
                        details: "Request body must include 'task' field",
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 400 }
            );
        }

        logger.info("Processing agent request", { requestId }, {
            taskLength: task.length,
            mode: mode || "balanced",
            agent: agent || "orchestrator"
        });

        // Run orchestrator with agent routing
        const result = await runOrchestrator(task, mode, agent, context);
        const latencyMs = Date.now() - startTime;

        // Add request metadata to response
        const response = {
            ...result,
            metadata: {
                requestId,
                latencyMs,
            },
        };

        logger.info("Request completed", { requestId }, {
            success: result.success,
            latencyMs,
        });

        return NextResponse.json(response, {
            status: result.success ? 200 : 500,
            headers: {
                "X-Request-ID": requestId,
                "X-Response-Time": `${latencyMs}ms`,
            },
        });
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        logger.error("Request failed", { requestId }, { error: errorMessage, latencyMs });

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: {
                    type: "UNKNOWN_ERROR",
                    details: errorMessage,
                    timestamp: new Date().toISOString(),
                },
                metadata: {
                    requestId,
                    latencyMs,
                },
            },
            {
                status: 500,
                headers: {
                    "X-Request-ID": requestId,
                    "X-Response-Time": `${latencyMs}ms`,
                },
            }
        );
    }
}
