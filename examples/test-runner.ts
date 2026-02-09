import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from project root
console.log("Loading .env.local...");
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import and run the workflow
import { runAgent1ToAgent2Workflow } from './agent-1-to-agent-2-integration';

// Run with "fast" mode (Gemini first)
console.log("Running in FAST mode (Gemini first)...");
runAgent1ToAgent2Workflow("fast").then(() => {
    console.log("Runner finished.");
}).catch(err => {
    console.error("Runner failed:", err);
});
