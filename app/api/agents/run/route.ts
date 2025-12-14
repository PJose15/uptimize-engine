import { NextResponse } from "next/server";
import { runOrchestrator } from "./orchestrator";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { task } = body;

        if (!task) {
            return NextResponse.json(
                { success: false, message: "Missing 'task' field in request body" },
                { status: 400 }
            );
        }

        const result = await runOrchestrator(task);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[API] Error running agent:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
